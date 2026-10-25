socket.on("joining id", (userJoinId) => {
  joiningId = userJoinId;
  document.querySelector(".current-user-username").innerHTML = username;
  document.querySelector(".curr-user-id").innerHTML = userJoinId;
  populateLeaderboard(joiningId);
});
socket.on("joining by id", (IdJoin, usernamebyid) => {
  joiningId = IdJoin;
  document.querySelector(".current-user-username").innerHTML = usernamebyid;
  document.querySelector(".curr-user-id").innerHTML = IdJoin;
  populateLeaderboard(IdJoin);
});
document.querySelector(".filter-logo").addEventListener("click", function () {
  populateLeaderboard(joiningId);
});
if (joinId) {
  socket.emit("join by Id", joinId);
} else {
  socket.emit("join", { username, userAvatar, userIdentity });
}
function leaveMatchRequest() {
  socket.emit("leave match");
}
socket.on("end game on request", function () {
  endGame();
});
function sendProgress() {
  minutes = String(Math.trunc(timeInc / 60));
  secs = String(timeInc % 60);
  timeWatch.innerHTML = `${minutes.padStart(2, "0")}:${secs.padStart(2, "0")}`;
  const totalChar = quoteLength + noOfWords - 1;
  const the_value = Math.trunc((progress / totalChar) * 100);
  setWPM();
  socket.emit("progress", the_value, wpm);
}

function initTimer() {
  timeInc--;
  sendProgress();
  if (timeInc === 0) {
    endGame();
  }
}
function refreshProgressContainer(usersArr) {
  const progressContainer = document.querySelector(".progress-bar-container");
  progressContainer.innerHTML = "";
  usersArr.forEach((user) => {
    let progressHtml = `<div id="${user.id}progress-bar" class="progress-bar">
      <div class="status-circle" id ="${user.id}status"></div>
      <div id="${user.id}user-rank" class="user-rank-wpm"></div>
      <div class = "user-curr-wpm" id ="${user.id}wpm">
      0 wpm</div>
      <div id="${user.id}nameid"  class="player-name ${
      socket.id === user.id ? "player-you" : ""
    }">
      <p> ${socket.id === user.id ? "YOU" : user.username}</p> 
      </div>
      <img src="images/avatars/${user.avatar}.png" alt="avatar" id="${
      user.id
    }avatar" class="user-avatar">
      <img src="./images/dividerFigma@4x.png" alt="divider" class = "progress-path">
      </div>`;

    if (socket.id === user.id) {
      progressContainer.innerHTML = progressHtml + progressContainer.innerHTML;
    } else {
      progressContainer.innerHTML += progressHtml;
    }
  });
}
socket.on("set player rank", (object) => {
  // console.log(object.playerId, object.rank);
  const selected_element = document.getElementById(
    `${object.playerId}user-rank`
  );
  let html;
  if (object.rank == 1) {
    html = `1<sup>st</sup>`;
  } else if (object.rank == 2) {
    html = `2<sup>nd</sup>`;
  } else if (object.rank == 3) {
    html = `3<sup>rd</sup>`;
  } else {
    html = `${object.rank}<sup>th</sup>`;
  }
  selected_element.innerHTML = html;
});

socket.on("update user leaderboard", () => {
  populateLeaderboard(joiningId);
});
socket.on("add user progress", (users) => {
  refreshProgressContainer(users);
});
socket.on("wrong join id error", () => {
  document.querySelector(".wrong-id").classList.remove("hidden");
});
socket.on("remove user progress", (users) => {
  refreshProgressContainer(users);
});
socket.on("insufficient players", function () {
  const divInsuff = document.querySelector(".insuff-player");

  divInsuff.classList.remove("hidden");
  setTimeout(() => {
    divInsuff.classList.add("hidden");
  }, 5000);
});

socket.on("user progress", (users) => {
  const sortedUser = users.sort((a, b) => b.currWpm - a.currWpm);
  let currOrder = 2;
  sortedUser.forEach((user) => {
    const currUserProgress = document.getElementById(`${user.id}progress-bar`);
    if (user.id === socket.id) {
      currUserProgress.style.order = 1;
    } else {
      currUserProgress.style.order = currOrder;
      currOrder++;
    }
  });

  users.forEach((user) => {
    const gotProgress = user.progress * 0.89;
    const userAvatarName = document.getElementById(`${user.id}avatar`);
    const userCurrWpm = document.getElementById(`${user.id}wpm`);

    userCurrWpm.innerHTML = `${user.currWpm} wpm`;
    userAvatarName.style.left = gotProgress + "%";
  });
});

// get status update
function onReadyBtnClick() {
  if (readybutton.innerHTML == "Get Ready") {
    playerReady();
    LeaderboardModal.classList.add("hidden");
  } else if (readybutton.innerHTML == "Ready") {
    notReady();
    LeaderboardModal.classList.remove("hidden");
  }
}
function playerReady() {
  readybutton.innerHTML = "Ready";
  readybutton.style.background = "rgb(0 82 3)";
  readybutton.style.color = "white";
  const userLevel = difficulty.value;
  socket.emit("ready status", userLevel);
}

socket.on("sendStatusReady", (msg) => {
  const playerStatus = document.getElementById(`${msg}status`);
  playerStatus.style.backgroundColor = "#03ca0b";
});
socket.on("sendStatusNotReady", (msg) => {
  const playerStatus = document.getElementById(`${msg}status`);
  playerStatus.style.backgroundColor = "#ff4848";
});

function notReady() {
  readybutton.innerHTML = "Get Ready";
  readybutton.style.background = "#1c1c1c";
  readybutton.style.color = "white";
  socket.emit("not ready");
}

// start match algorithm
const countering = document.querySelector(".countdown-number");
const counterdiv = document.querySelector(".countdown");
function showOnGameEnd() {
  document.querySelector(".player-status").classList.remove("hidden");
}

counterValue = 9;
let counting;

function countCounter() {
  countering.innerHTML = counterValue;
  const countOver = document.querySelector(".countdown-over");
  const redCircle = document.querySelector(".red-circle");
  const yellowCircle = document.querySelector(".yellow-circle");
  const greenCircle = document.querySelector(".green-circle");

  if (counterValue === 0) {
    greenCircle.style.transform = "scale(1)";
    redCircle.style.backgroundColor = "#03ca0b";
    yellowCircle.style.backgroundColor = "#03ca0b";
    counterdiv.classList.add("hidden");
    countOver.classList.remove("hidden");
    setTimeout(() => {
      redCircle.style.backgroundColor = "green";
      yellowCircle.style.backgroundColor = "green";
      greenCircle.style.backgroundColor = "green";
    }, 1000);
    setTimeout(() => {
      redCircle.style.backgroundColor = "#03ca0b";
      yellowCircle.style.backgroundColor = "#03ca0b";
      greenCircle.style.backgroundColor = "#03ca0b";
    }, 2000);
    setTimeout(() => {
      redCircle.style.backgroundColor = "green";
      yellowCircle.style.backgroundColor = "green";
      greenCircle.style.backgroundColor = "green";
    }, 3000);
    setTimeout(() => {
      redCircle.style.backgroundColor = "#ff0000";
      yellowCircle.style.backgroundColor = "#ffd505";
      greenCircle.style.backgroundColor = "#03ca0b";
      countOver.classList.add("hidden");
    }, 4000);
  } else if (counterValue % 3 === 0) {
    redCircle.style.transform = "scale(1.4)";
    yellowCircle.style.transform = "scale(1)";
    greenCircle.style.transform = "scale(1)";
  } else if (counterValue % 3 === 2) {
    redCircle.style.transform = "scale(1)";
    yellowCircle.style.transform = "scale(1.4)";
    greenCircle.style.transform = "scale(1)";
  } else {
    redCircle.style.transform = "scale(1)";
    yellowCircle.style.transform = "scale(1)";
    greenCircle.style.transform = "scale(1.4)";
  }
  counterValue--;
  switch (counterValue) {
  }
  if (counterValue === -1) {
    clearInterval(counting);
    counterValue = 9;
    countering.innerHTML = "10";
    document.querySelector(".dummy-cursor").classList.remove("hidden");
  }
}

socket.on("start game", function (quoteObject) {
  document
    .querySelectorAll(".user-rank-wpm")
    .forEach((Element) => (Element.innerHTML = ""));
  document
    .querySelectorAll(".user-curr-wpm")
    .forEach((Element) => (Element.innerHTML = "0 wpm"));
  document
    .querySelectorAll(".user-avatar")
    .forEach((Element) => (Element.style.left = "0%"));
  cursor.style.top = "53px";
  cursor.style.left = "23px";
  quoteLevel = quoteObject.levelOfQuote;
  closeModalFunction();
  counterdiv.classList.remove("hidden");
  counting = setInterval(countCounter, 1000);
  setTimeout(startMatchCountdown, 10000);
  fetchQuote(quoteObject.quoteFromServer);
  newGame();
  notReady();
  const statuscircle = document.querySelectorAll(".status-circle");
  statuscircle.forEach(function (div) {
    if (!div.classList.contains("hidden")) {
      div.classList.add("hidden");
    }
  });
  counterdiv.classList.remove("hidden");
  document.querySelector(".player-status").classList.add("hidden");
});

//11. start match
function startMatchCountdown() {
  inpField.disabled = false;
  timer = setInterval(initTimer, 1000);
  inpField.addEventListener("input", initTyping);
  isTyping = true;
  timeWatch.style.color = "#e2b714";
  timeTaken = new Date();
  counterdiv.classList.add("hidden");
}
