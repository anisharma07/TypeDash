"use strict";
const express = require("express");
const path = require("path");
const { createServer } = require("node:http");
const app = express();
const server = createServer(app);
const { Server } = require("socket.io");
const PORT = process.env.PORT || 2360;
const io = new Server(server);

const {
  users,
  userJoin,
  userLeave,
  getUserIndex,
  getUniqueId,
  Racer,
} = require("./utils/functions.js");
const { getQuote } = require("./utils/quotes.js");

// Limits for what clients send. Anything outside them is clamped or ignored, never trusted.
const MAX_USERNAME = 10;
const MAX_CONTACT = 100;
const MAX_WPM = 400;
const AVATAR_PATTERN = /^avatar([1-9]|1[0-5])$/;

function logError(where, err) {
  console.error(`[error] ${where}:`, err && err.stack ? err.stack : err);
}

// Last line of defence: a rejected promise somewhere (a database call, say) is logged, not fatal.
process.on("unhandledRejection", (reason) => logError("unhandled rejection", reason));

function cleanText(value, max, fallback) {
  if (typeof value !== "string") return fallback;
  const text = value.trim().slice(0, max);
  return text || fallback;
}

function cleanAvatar(value) {
  return typeof value === "string" && AVATAR_PATTERN.test(value) ? value : "avatar1";
}

/** A 6-digit Player ID as a number, or null. Accepts a number or a string of digits. */
function toJoinId(value) {
  const n = typeof value === "string" && /^\d{6}$/.test(value.trim()) ? Number(value) : value;
  return Number.isInteger(n) && n >= 100000 && n <= 999999 ? n : null;
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// The React frontend is built by Vite into client/dist (run: npm run build). CLIENT_DIST serves another build.
const clientDist = process.env.CLIENT_DIST
  ? path.resolve(process.env.CLIENT_DIST)
  : path.join(__dirname, "client", "dist");
const clientBuilt = require("fs").existsSync(path.join(clientDist, "index.html"));
if (!clientBuilt) {
  console.warn(
    "WARNING: client/dist/index.html not found. The React frontend is not built. Run: npm run build"
  );
  app.get("/", (req, res) => {
    res
      .status(503)
      .type("text/plain")
      .send(
        "Type Dash frontend is not built yet.\nRun: npm run build\nThen restart the server (or use the Vite dev server: npm run client:dev)."
      );
  });
}
app.use(express.static(clientDist));
app.get("/get-users-leaderboard", async (req, res) => {
  try {
    const players = await Racer.find().sort({ highscore: -1 });
    res.json(players);
  } catch (err) {
    logError("GET /get-users-leaderboard", err);
    res.status(500).json([]);
  }
});

// Players in the game right now, for the "online" badge on both pages. Visitors of the home page connect
// only to receive this count; they are not players until they join.
function sendPlayersOnline(target) {
  target.emit("players online", users.length);
}

function announceJoin() {
  io.emit("add user progress", users);
  io.emit("display board", users);
  sendPlayersOnline(io);
  console.log("user-joined, " + users.length + " users on server");
}

io.on("connection", (socket) => {
  /** Registers a handler that can never take the server down: sync throws and async rejections are logged. */
  function on(event, handler) {
    socket.on(event, (...args) => {
      try {
        const result = handler(...args);
        if (result && typeof result.catch === "function") {
          result.catch((err) => logError(`socket "${event}"`, err));
        }
      } catch (err) {
        logError(`socket "${event}"`, err);
      }
    });
  }

  /** This socket's player, or undefined when it has not joined (a home page visitor or a stray client). */
  function me() {
    return users[getUserIndex(socket.id)];
  }

  sendPlayersOnline(socket);

  on("join", (payload) => {
    if (me()) return; // one player per connection
    const data = payload && typeof payload === "object" ? payload : {};
    const username = cleanText(data.username, MAX_USERNAME, "Player");
    const userAvatar = cleanAvatar(data.userAvatar);
    const userContact = cleanText(data.userIdentity, MAX_CONTACT, "none");
    const userJoinId = Number(getUniqueId());
    userJoin(socket.id, username, 0, userAvatar, userJoinId);
    new Racer({ username, joinId: userJoinId, userAvatar, userContact })
      .save()
      .catch((err) => logError("saving a new player", err));
    socket.emit("joining id", userJoinId);
    announceJoin();
  });

  on("join by Id", async (rawId) => {
    if (me()) return;
    const joinId = toJoinId(rawId);
    if (joinId === null) {
      socket.emit("wrong join id error");
      return;
    }
    let player;
    try {
      [player] = await Racer.find({ joinId });
    } catch (err) {
      logError("looking up a Player ID", err);
      socket.emit("wrong join id error");
      return;
    }
    // The socket may have left, or joined another way, while the database answered.
    if (!socket.connected || me()) return;
    if (!player) {
      socket.emit("wrong join id error");
      return;
    }
    userJoin(socket.id, player.username, 0, player.userAvatar, joinId);
    socket.emit("joining by id", joinId, player.username);
    announceJoin();
  });

  on("ready status", (userLevel) => {
    const player = me();
    if (!player) return;
    player.status = true;
    player.difficulty = userLevel === "medium" ? "medium" : "easy";

    const easyNum = users.filter((user) => user.difficulty === "easy").length;
    const levelOfQuote = users.length - easyNum > easyNum ? 1 : 0;
    io.emit("sendStatusReady", socket.id);
    if (users.every((user) => user.status === true) && users.length > 1) {
      const quoteFromServer = getQuote(levelOfQuote);
      users.forEach((user) => {
        user.progress = 0;
        user.leaveMatch = 0;
        user.racing = true; // allowed to post one score for this race
      });
      io.emit("start game", { quoteFromServer, levelOfQuote });
    } else if (users.length === 1) {
      socket.emit("insufficient players");
    }
  });

  on("not ready", () => {
    const player = me();
    if (!player) return;
    io.emit("sendStatusNotReady", socket.id);
    player.status = false;
  });

  on("set leave match true", () => {
    const player = me();
    if (player) player.leaveMatch = 1;
  });

  on("leave match", () => {
    const player = me();
    if (!player) return;
    player.leaveMatch = 1;
    if (users.every((user) => user.leaveMatch === 1)) {
      io.emit("end game on request");
    }
  });

  on("progress", (value, wpm) => {
    const player = me();
    if (!player) return;
    player.progress = clampNumber(value, 0, 100);
    player.currWpm = Math.round(clampNumber(wpm, 0, MAX_WPM));
    io.emit("user progress", users);
  });

  on("user score", async (score) => {
    const player = me();
    if (!player || !player.racing) return; // one score per race, and only from someone who raced
    const data = score && typeof score === "object" ? score : {};
    const wpm = Number(data.wpm);
    if (!Number.isFinite(wpm) || wpm <= 0 || wpm > MAX_WPM) return;
    player.racing = false;
    const level = data.quoteLevel === 1 ? "Medium" : "Easy";
    const device = data.userDevice === "mobile" ? "Mobile" : "Laptop";
    const field = `highScore.${level}.${device}`;
    await Racer.updateOne(
      { joinId: Number(player.userJoinId), [field]: { $lt: Math.round(wpm) } },
      { $set: { [field]: Math.round(wpm) } }
    );
    io.emit("update user leaderboard");
  });

  on("get rank", () => {
    if (!me()) return;
    const sorted = users.sort((a, b) => b.currWpm - a.currWpm);
    const rank = sorted.findIndex((player) => player.id === socket.id) + 1;
    io.emit("set player rank", { playerId: socket.id, rank });
  });

  on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.emit("game users", users.map((u) => u.username));
      io.emit("remove user progress", users);
      sendPlayersOnline(io);
      console.log("user-left" + " no. of users on server: " + users.length);
    }
  });
});

server.on("error", (err) => {
  logError("server", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to another port.`);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  const os = require("os");
  const networkInterfaces = os.networkInterfaces();

  console.log(`\n🚀 TypeDash Server Started Successfully!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`\n🌐 Available on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Local:    http://127.0.0.1:${PORT}`);

  // Show all network interfaces
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((networkInterface) => {
      if (networkInterface.family === "IPv4" && !networkInterface.internal) {
        console.log(
          `   Network:  http://${networkInterface.address}:${PORT} (${interfaceName})`
        );
      }
    });
  });

  console.log(`\n💡 Use Ctrl+C to stop the server\n`);
});
