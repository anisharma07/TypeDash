"use strict";
const express = require("express");
const path = require("path");
const { createServer } = require("node:http");
const { join } = require("node:path");
const app = express();
const server = createServer(app);
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3001;
const { get } = require("http");
const io = new Server(server);

const {
  users,
  checkIfunique,
  userJoin,
  userLeave,
  getUserIndex,
  setWordspermin,
  getRoomUsers,
  getCurrentUser,
  getUniqueId,
  Racer,
} = require("./utils/functions.js");
const { quotes, getRandomWords, getQuote } = require("./utils/quotes.js");
const { BoyNames, GirlNames } = require("./utils/usernames.js");

app.use(express.static(path.join(__dirname, "public")));
app.get("/get-users-leaderboard", async (req, res) => {
  const players = await Racer.find().sort({ highscore: -1 });
  res.json(players);
});
io.on("connection", (socket) => {
  socket.on("join", ({ username, userAvatar, userIdentity }) => {
    const userJoinId = Number(getUniqueId());
    userJoin(socket.id, username, 0, userAvatar, userJoinId);
    const newPlayer = new Racer({
      username: username,
      joinId: userJoinId,
      userAvatar: userAvatar,
      userContact: userIdentity,
    });
    newPlayer.save();
    socket.emit("joining id", userJoinId);
    io.emit("add user progress", users);
    io.emit("display board", users);
    console.log("user-joined, " + users.length + " users on server");
  });
  socket.on("join by Id", (joinId) => {
    async function joinUser() {
      const data = await Racer.find({ joinId: joinId });
      console.log(data[0]);
      if (data[0]) {
        console.log("yes");
        console.log(joinId);
        userJoin(socket.id, data[0].username, 0, data[0].userAvatar, joinId);
        socket.emit("joining by id", joinId, data[0].username);
        io.emit("add user progress", users);
        io.emit("display board", users);
        console.log("user-joined, " + users.length + " users on server");
      } else {
        socket.emit("wrong join id error");
      }
    }
    joinUser();
  });

  socket.on("ready status", function (userLevel) {
    const i = getUserIndex(socket.id);
    users[i].status = true;
    users[i].difficulty = userLevel;

    const easyNum = users.reduce(
      (acc, curr) => (curr.difficulty === "easy" ? (acc = acc + 1) : acc),
      0
    );
    let levelOfQuote = 0;
    if (users.length - easyNum > easyNum) {
      levelOfQuote = 1;
    } else {
      levelOfQuote = 0;
    }
    io.emit("sendStatusReady", socket.id);
    if (users.every((user) => user.status === true) && users.length > 1) {
      const quoteFromServer = getQuote(levelOfQuote);
      for (let i = 0; i < users.length; i++) {
        users[i].progress = 0;
      }
      users.forEach((user) => {
        user.leaveMatch = 0;
      });
      io.emit("start game", { quoteFromServer, levelOfQuote });
    } else if (users.length === 1) {
      socket.emit("insufficient players");
    }
  });

  socket.on("not ready", function () {
    const i = getUserIndex(socket.id);
    io.emit("sendStatusNotReady", socket.id);
    users[i].status = false;
  });
  socket.on("set leave match true", function () {
    const i = getUserIndex(socket.id);
    users[i].leaveMatch = 1;
  });
  socket.on("leave match", function () {
    const i = getUserIndex(socket.id);
    users[i].leaveMatch = 1;
    if (users.every((user) => user.leaveMatch === 1)) {
      io.emit("end game on request");
    }
  });
  socket.on("progress", (value, wpm) => {
    const index = getUserIndex(socket.id);
    users[index].progress = Number(value);
    users[index].currWpm = Number(wpm);
    io.emit("user progress", users);
  });
  socket.on("user score", (object) => {
    const i = getUserIndex(socket.id);
    const joinuserid = users[i].userJoinId;
    if (object.userDevice === "mobile") {
      if (object.quoteLevel === 1) {
        async function ScoreMediumMobile() {
          await Racer.updateOne(
            {
              joinId: Number(joinuserid),
              "highScore.Medium.Mobile": { $lt: object.wpm },
            },
            { $set: { "highScore.Medium.Mobile": object.wpm } }
          );

          io.emit("update user leaderboard");
        }
        ScoreMediumMobile();
      } else {
        async function ScoreEasyMobile() {
          await Racer.updateOne(
            {
              joinId: Number(joinuserid),
              "highScore.Easy.Mobile": { $lt: object.wpm },
            },
            { $set: { "highScore.Easy.Mobile": object.wpm } }
          );

          io.emit("update user leaderboard");
        }
        ScoreEasyMobile();
      }
    } else {
      if (object.quoteLevel === 1) {
        async function ScoreMediumLaptop() {
          await Racer.updateOne(
            {
              joinId: Number(joinuserid),
              "highScore.Medium.Laptop": { $lt: object.wpm },
            },
            { $set: { "highScore.Medium.Laptop": object.wpm } }
          );
          io.emit("update user leaderboard");
        }
        ScoreMediumLaptop();
      } else {
        async function ScoreEasyLaptop() {
          await Racer.updateMany(
            {
              joinId: Number(joinuserid),
              "highScore.Easy.Laptop": { $lt: object.wpm },
            },
            { $set: { "highScore.Easy.Laptop": object.wpm } }
          );
          io.emit("update user leaderboard");
        }
        ScoreEasyLaptop();
      }
    }
  });
  socket.on("get rank", () => {
    const findRank = users;
    const sorted = findRank.sort((a, b) => b.currWpm - a.currWpm);
    const rank = sorted.findIndex((player) => player.id == socket.id) + 1;
    const playerId = socket.id;
    io.emit("set player rank", { playerId, rank });
  });
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    const usersArr = getRoomUsers();
    if (user) {
      io.emit("game users", usersArr);
      io.emit("remove user progress", users);
      console.log("user-left" + " no. of users on server: " + users.length);
    }
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
