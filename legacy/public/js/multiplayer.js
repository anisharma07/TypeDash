const socket = io();
const usersArr = [];
const urlParams = new URLSearchParams(window.location.search);
const readybutton = document.querySelector(".ready-btn");
// Get value for a specific parameter
const joinId = urlParams.get("join-id");
const username = urlParams.get("username");
const userAvatar = urlParams.get("image");
const userIdentity = urlParams.get("identity");
const userDevice = urlParams.get("Device");
//********************#1 Predefined objects***********************
// a. Constants and variables & event listeners
// 1. elements
const timeWatch = document.querySelector(".stopwatch");
const wordsCounter = document.querySelector("#wordsPerMinute");
const showWPM = document.querySelector(".showWpm");
const typingResults = document.querySelectorAll(".details");
const terminalAccuracy = document.querySelector("#terminal-accuracy");
const inpField = document.querySelector(".input-field");
const typingText = document.querySelector("#text-content");
const tryAgain = document.querySelector(".bx-reset");
const overlay = document.querySelector(".overlay");
const transparentOverlay = document.querySelector(".transparent-overlay");

const closeLeaderboard = document.querySelector(".close-leaderboard");
const LeaderboardModal = document.querySelector(".leader-board-menu");
const openLeaderboard = document.querySelector(".leaderboard-button");
const navbar = document.querySelector(".navbar");
const cursor = document.getElementById("cursor");
const contentDiv = document.querySelector(".text-content-div");
const letterContainer = document.querySelector(".container");
const CapsLock = document.querySelector(".caps-lock");
const difficulty = document.getElementById("DifficultySelect");
const logOut = document.querySelector(".leave-game");
const MediumButton = document.querySelector(".medium");
const EasyButton = document.querySelector(".easy");
const timeWarn = document.querySelector(".time-up-warn").classList;
let currentWord = document.querySelector(".word.current");
let currentLetter = document.querySelector(".letter.current");
// 2. variables
let correctSpans = 0;
let timer = 0;
let timeInc = 0;
let i = 0;
let isTyping = false;
let words;
let countCorrectChar = 0;
let wpm = 0;
let HighScore = 0;
let UserRank;
let previousLength = 0;
let typedChar;
let LettersArr = [];
let quoteLength = 0;
let timeTaken;
let mistakes = 0;
let counter = 0;
let progress = 0;
let quoteLevel = 0;
let joiningId;
//3. Adding event listener to input and check for keypresses
const currYear = new Date().getFullYear();
document.querySelector(".current-year").innerHTML = currYear;
MediumButton.addEventListener("click", function () {
  EasyButton.classList.remove("leaderboard-level-chosen");
  MediumButton.classList.add("leaderboard-level-chosen");
  easyDivToPopulate.classList.add("hidden");
  MediumDivToPopulate.classList.remove("hidden");
});
EasyButton.addEventListener("click", function () {
  EasyButton.classList.add("leaderboard-level-chosen");
  MediumButton.classList.remove("leaderboard-level-chosen");
  easyDivToPopulate.classList.remove("hidden");
  MediumDivToPopulate.classList.add("hidden");
});
inpField.disabled = true;
inpField.addEventListener("keydown", function (event) {
  if (event.getModifierState("CapsLock")) {
    CapsLock.classList.remove("hidden");
  } else {
    if (!CapsLock.classList.contains("hidden")) {
      CapsLock.classList.add("hidden");
    }
  }
  if (event.key === "Backspace" || event.key === 8) {
    event.preventDefault();
    backspacePressed();
  }

  if (
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "Home" ||
    event.key === "HomeLeft" ||
    event.key === "End" ||
    event.key === "EndRight"
  ) {
    event.preventDefault();
  }

  if (inpField.selectionStart !== inpField.selectionEnd) {
    inpField.selectionStart = inpField.selectionEnd;
  }
});

inpField.addEventListener("paste", function (event) {
  event.preventDefault();
});
//focus
document.addEventListener("keydown", () => inpField.focus());
typingText.addEventListener("click", () => inpField.focus());

function keyBindsFunction(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    leaveGame();
  }
  if (e.key === "Enter") {
    e.preventDefault();
    onReadyBtnClick();
  }
  if (e.key === "`") {
    e.preventDefault();
    toggleLeaderboardFunction();
  }
  if (e.key === "Tab") {
    e.preventDefault();
    if (EasyButton.classList.contains("leaderboard-level-chosen")) {
      EasyButton.classList.remove("leaderboard-level-chosen");
      MediumButton.classList.add("leaderboard-level-chosen");

      easyDivToPopulate.classList.add("hidden");
      MediumDivToPopulate.classList.remove("hidden");
    } else {
      EasyButton.classList.add("leaderboard-level-chosen");
      MediumButton.classList.remove("leaderboard-level-chosen");
      MediumDivToPopulate.classList.add("hidden");
      easyDivToPopulate.classList.remove("hidden");
    }
  }
  if (e.ctrlKey && e.key === "Control") {
    e.preventDefault();
    populateLeaderboard(joiningId);
  }
  if (e.altKey && e.key === "Alt") {
    e.preventDefault();
    var select = document.getElementById("DifficultySelect");
    let option1 = select.options[0];
    let option2 = select.options[1];

    // Toggle the selected attribute of the options
    if (option1.selected) {
      option1.selected = false;
      option2.selected = true;
    } else {
      option1.selected = true;
      option2.selected = false;
    }
  }
}
function preventDefaultKeys(e) {
  const forbiddenKeys = [
    "Alt",
    "Control",
    "Fn",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "PrintScreen",
    "Insert",
    "Delete",
    "Tab",
  ];

  if (forbiddenKeys.includes(e.key)) {
    e.preventDefault();
  }
}

let keyBindingListener = 1;
document.addEventListener("keydown", keyBindsFunction);
function toggleEventListener() {
  if (keyBindingListener) {
    console.log("keyBinds Applied");
    document.removeEventListener("keydown", preventDefaultKeys);
    document.addEventListener("keydown", keyBindsFunction);
  } else {
    console.log("prevent default Applied");
    document.removeEventListener("keydown", keyBindsFunction);
    document.addEventListener("keydown", preventDefaultKeys);
  }
}

// b. functions:
//1. random Words

let noOfWords = 0;

function leaveGame() {
  const leaveRoom = confirm("Are you sure you want to leave the game?");
  if (leaveRoom) {
    window.location.href = "../index.html";
  }
}
// 2. display text
function fetchQuote(quoteFromServer) {
  let quoteArray = quoteFromServer.split(" ");
  noOfWords = quoteArray.length;
  LettersArr = quoteArray.flatMap((each) => each.split(""));
  quoteLength = LettersArr.length;
  const letters = quoteArray
    .map((each) =>
      each
        .split("")
        .map((letter) => `<letter class="letter">${letter}</letter>`)
        .join("")
    )
    .map((each) => `<div class = "word">${each}</div>`);
  document.querySelector("#text-content").innerHTML = letters.join("");
  addClass(document.querySelector(".word"), "current");
  addClass(document.querySelector(".letter"), "current");
}

function closeModalFunction() {
  if (!overlay.classList.contains("hidden")) {
    overlay.classList.add("hidden");
  }
  if (!LeaderboardModal?.classList.contains("hidden")) {
    LeaderboardModal?.classList.add("hidden");
  }
  if (!transparentOverlay.classList.contains("hidden")) {
    transparentOverlay.classList.add("hidden");
  }
}

function addClass(el, classname) {
  el.classList.add(classname);
}
function removeClass(el, name) {
  el.className = el.className.replace(name, "");
}

function showSummary() {
  showWPM.classList.remove("hidden");
  typingResults.forEach((element) => element.classList.remove("hidden"));
  let actualAccuracy = Math.floor(100 - (mistakes / quoteLength) * 100);
  terminalAccuracy.innerHTML = `${actualAccuracy > 0 ? actualAccuracy : "0"}%`;
  wordsCounter.innerHTML = wpm;
}

function endGame() {
  socket.emit("set leave match true");
  document.querySelector(".leave-match").classList.add("hidden");
  document.querySelector(".dummy-cursor").classList.add("hidden");
  keyBindingListener = 1;
  toggleEventListener();
  toggleLeaderboardFunction(); // twice cause problem
  clearInterval(timer); // twice cleared
  inpField.removeEventListener("input", initTyping);
  inpField.disabled = true;
  typingText.style.marginTop = "";
  cursor.classList.add("hidden");
  contentDiv.style.overflow = "auto";
  sendProgress();
  getWPM();
  showSummary();
  showOnGameEnd();
  const statuscircle = document.querySelectorAll(".status-circle");
  statuscircle.forEach(function (div) {
    if (div.classList.contains("hidden")) {
      div.classList.remove("hidden");
    }
  });
  socket.emit("user score", { wpm, quoteLevel, userDevice });
  socket.emit("get rank");
  const lettersMissed = [
    ...document.querySelectorAll(
      ".word .letter:not(.correctText):not(.incorrectText)"
    ),
  ];
  lettersMissed.forEach((letter) => {
    addClass(letter, "incorrectText");
  });
  if (timeInc === 0) {
    document.querySelector(".time-up-warn").classList.remove("hidden");
  }
}

function newGame() {
  timeWarn.contains("hidden") ? "" : timeWarn.add("hidden");
  document.querySelector(".leave-match").classList.remove("hidden");
  keyBindingListener = null;
  toggleEventListener();
  progress = 0;
  contentDiv.style.overflow = "hidden";
  addClass(document.querySelector(".word"), "current");
  addClass(document.querySelector(".letter"), "current");
  timeInc = 60;
  timer = 0;
  wpm = 0;
  timeWatch.innerText = `01:00`;
  i = 0;
  counter = 0;
  mistakes = 0;
  isTyping = false;
  inpField.value = "";
  timeWatch.style.color = null;
  typingResults.forEach((element) => element.classList.add("hidden"));
  contentDiv.style.overflow = "hidden";
  previousLength = 0;
  typingText.style.marginTop = "";
}

function getWPM() {
  // timeTaken = new Date() - timeTaken;
  // wpm = Math.round((counter / 5) * (60000 / timeTaken));

  setWPM();
  if (wpm > HighScore) {
    HighScore = wpm;
  }
}
function setWPM() {
  const timepassed = 60 - timeInc;
  wpm = Math.round((counter / 5) * (60 / timepassed));
}
function spacePressed() {
  const isFirstLetter = currentLetter === currentWord.firstChild;
  inpField.value = "";
  i = 0;
  const currentWordLetters = [
    ...document.querySelectorAll(".word.current .letter"),
  ];
  if (
    currentWordLetters.every((letter) =>
      letter.classList.contains("correctText")
    )
  ) {
    if (!isFirstLetter) {
      let expectedEl = currentLetter?.innerHTML ?? " ";
      if (expectedEl !== " ") {
        const lettersMissed = [
          ...document.querySelectorAll(
            ".word.current .letter:not(.correctText):not(.incorrectText)"
          ),
        ];
        lettersMissed.forEach((letter) => {
          addClass(letter, "missed");
          progress++;
        });
      }
      if (currentWord.nextSibling) {
        removeClass(currentWord, "current");
        addClass(currentWord.nextSibling, "current");
        progress++;
        if (currentLetter) {
          removeClass(currentLetter, "current");
        } else {
          counter++;
        }
        addClass(currentWord.nextSibling.firstChild, "current");
      } else {
        endGame();
      }
      cursor.style.transition = "top 0.08s linear, left 0.08s linear";
      getLineAndCursor();
      checkIfInspected();
    }
  }
}

function backspacePressed() {
  currentWord = document.querySelector(".word.current");
  currentLetter = document.querySelector(".letter.current");
  inpField.value = "";
  i = 0;
  const previousWord = currentWord.previousSibling;
  const isFirstLetter = currentLetter === currentWord.firstChild;
  if (previousWord || !isFirstLetter) {
    // playSound();
  }
  if (currentLetter && isFirstLetter) {
    // if (previousWord) {
    //   removeClass(currentWord, "current");
    //   removeClass(currentLetter, "current");
    //   addClass(previousWord, "current");
    //   currentWord = document.querySelector(".current");
    //   progress--;
    //   if (!previousWord.lastChild.classList.contains("missed")) {
    //     counter--;
    //   }
    // }
  }
  if (currentLetter && !isFirstLetter) {
    if (currentLetter.previousSibling.classList.contains("correctText")) {
      counter--;
    }
    removeClass(currentLetter, "current");
    addClass(currentLetter.previousSibling, "current");
    removeClass(currentLetter.previousSibling, "incorrectText");
    removeClass(currentLetter.previousSibling, "correctText");
    removeClass(currentLetter.previousSibling, "missed");
    progress--;
  }

  if (!currentLetter) {
    addClass(currentWord.lastChild, "current");
    if (currentWord.lastChild.classList.contains("correctText")) {
      counter--;
    }
    removeClass(currentWord.lastChild, "incorrectText");
    removeClass(currentWord.lastChild, "correctText");
    removeClass(currentWord.lastChild, "missed");
    if (currentWord.lastChild.classList.contains("extra")) {
      currentWord.lastChild.remove();
    } else {
      progress--;
    }
  }
  cursor.style.transition = "";
  getLineAndCursor();
}

function getLineAndCursor() {
  const containerDivRect = letterContainer.getBoundingClientRect();
  const nextLetter = document.querySelector(".letter.current");
  const nextWord = document.querySelector(".word.current");
  const nextWordRect = nextWord.getBoundingClientRect();
  const parentDivRect = contentDiv.getBoundingClientRect();
  const parentRelativeTop = nextWordRect.top - parentDivRect.top;
  const relativeTop = nextWordRect.top - containerDivRect.top;
  cursor.style.top =
    (nextLetter || nextWord).getBoundingClientRect().top -
    containerDivRect.top +
    2 +
    "px";
  cursor.style.left =
    (nextLetter || nextWord).getBoundingClientRect()[
      nextLetter ? "left" : "right"
    ] -
    containerDivRect.left -
    3 +
    "px";
  const hbythree = parentDivRect.height / 3;

  if (parentDivRect.width > 600) {
    if (parentRelativeTop > 90) {
      const margin = parseFloat(typingText.style.marginTop || "0px");
      typingText.style.marginTop = `${margin - 2 * hbythree}px`;
      cursor.style.top = `${relativeTop - 2 * hbythree}px`;
    }
  } else {
    if (parentRelativeTop > 60) {
      const margin = parseFloat(typingText.style.marginTop || "0px");
      typingText.style.marginTop = `${margin - hbythree}px`;
      cursor.style.top = `${relativeTop - hbythree}px`;
    }
  }

  if (parentRelativeTop < 0) {
    const margin = parseFloat(typingText.style.marginTop || "0px");
    typingText.style.marginTop = `${margin + 36.1}px`;
    cursor.style.top = `${relativeTop + 36.1}px`;
  }
}

function checkIfInspected() {
  const currentLetter = document.querySelector(".letter.current");
  if (currentLetter) {
    const allLetters = document.querySelectorAll(".word .letter");
    const position = Array.from(allLetters).indexOf(currentLetter) + 1;
    const extras = [...document.querySelectorAll(".word .extra")];

    const actualPositiontoCheck = position - extras.length;
    if (currentLetter.innerHTML !== LettersArr[actualPositiontoCheck - 1]) {
      currentLetter.innerHTML = LettersArr[actualPositiontoCheck - 1];
    }
  }
}

function initTyping() {
  document.querySelector(".dummy-cursor").classList.add("hidden");
  cursor.classList.remove("hidden");
  currentWord = document.querySelector(".word.current");
  currentLetter = document.querySelector(".letter.current");
  typedChar = inpField.value.split("")[i];
  i++;
  if (typedChar == " ") {
    spacePressed();
  } else if (typedChar == null) {
    backspacePressed();
  } else if (currentLetter) {
    if (currentLetter.innerText !== typedChar) {
      mistakes++;
      // playWrong();
    } else {
      counter++;
      // playSound();
    }
    progress++;
    addClass(
      currentLetter,
      currentLetter.innerText == typedChar ? "correctText" : "incorrectText"
    );
    removeClass(currentLetter, "current");
    if (!currentLetter.nextSibling && !currentWord.nextElementSibling) {
      endGame();
    }
    if (currentLetter.nextSibling) {
      addClass(currentLetter.nextSibling, "current");
    }
    checkIfInspected();
  } else {
    // playWrong();
    const incorrectLetter = document.createElement("letter");
    incorrectLetter.innerHTML = typedChar;
    incorrectLetter.className = "letter incorrectText extra";
    currentWord.appendChild(incorrectLetter);
    mistakes++;
  }
  cursor.style.transition = "top 0.08s linear, left 0.08s linear";
  getLineAndCursor();
}

//******************** MODALS***********************
function toggleLeaderboardFunction() {
  LeaderboardModal.classList.toggle("hidden");
}
overlay.addEventListener("click", closeModalFunction);
transparentOverlay.addEventListener("click", closeModalFunction);
closeLeaderboard?.addEventListener("click", function () {
  toggleLeaderboardFunction();
  closeModalFunction();
});
openLeaderboard?.addEventListener("click", function () {
  toggleLeaderboardFunction();
});

logOut.addEventListener("click", () => {
  leaveGame();
});
