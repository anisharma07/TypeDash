const users = [];
const checkIfunique = [];
require("dotenv").config();
const mongoURI = process.env.MONGODB_URI;
const mongoose = require("mongoose");
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const LeaderboardSchema = new mongoose.Schema({
  username: String,
  joinId: Number,
  userAvatar: String,
  userContact: String,
  highScore: {
    Easy: {
      Mobile: {
        type: Number,
        default: 0,
      },
      Laptop: {
        type: Number,
        default: 0,
      },
    },
    Medium: {
      Mobile: {
        type: Number,
        default: 0,
      },
      Laptop: {
        type: Number,
        default: 0,
      },
    },
  },
  SpaceHitScore: {
    type: Number,
    default: 0,
  },
});
const Racer = new mongoose.model("racer", LeaderboardSchema);
let playerIds = [];
async function setplayerIds() {
  const data = await Racer.find({}, "joinId");
  playerIds = data.map((player) => player.joinId);
}
setplayerIds();

function userJoin(id, username, wpm, avatar, userJoinId) {
  const user = {
    id,
    username,
    wpm,
    avatar,
    userJoinId,
    status: false,
    progress: 0,
    currWpm: 0,
  };
  users.push(user);
  return user;
}

function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getUserIndex(id) {
  return users.findIndex((user) => user.id === id);
}
function setWordspermin(id, score) {
  const index = getUserIndex(id);
  users[index].wpm = score;
}

function getRoomUsers() {
  return users.map((user) => user.username);
}

function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

function getUniqueId() {
  // console.log(playerIds);
  const randomId = Math.floor(100000 + Math.random() * 900000);
  if (playerIds.every((id) => id !== randomId)) {
    playerIds.push(randomId);
    return randomId;
  } else {
    return getUniqueId();
  }
}

module.exports = {
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
};
