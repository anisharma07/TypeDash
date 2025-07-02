const genderToggle = document.getElementById("name-toggler");
const randomDice = document.querySelector(".random-name-dice");
const usernameField = document.getElementById("username");
const contactField = document.getElementById("identity");
const allAvatar = document.querySelectorAll(".avatar-select-input");
const deviceType = document.querySelector(".Device-logged-in");
const windowWidthOnLoad = window.innerWidth;
const logInForm = document.querySelector(".log-in");

if (windowWidthOnLoad < 500) {
  deviceType.value = "mobile";
  document.querySelector(".rules-modal").classList.add("hidden");
} else {
  deviceType.value = "laptop";
}
const randomAvatarNumber = Math.floor(Math.random() * 15);
allAvatar.forEach((checkbox, index) => {
  checkbox.checked = index === randomAvatarNumber;
});
usernameField.focus();
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "Control") {
    event.preventDefault();
    genderToggle.checked = !genderToggle.checked;
  }
  if (event.altKey && event.key === "Alt") {
    getRandomName();
    const warningPara = document.querySelector(".max-char-warning");
    if (!warningPara.classList.contains("hidden")) {
      warningPara.classList.add("hidden");
    }
    event.preventDefault(); // Prevent default behavior of the Alt key
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    const currentIndex = Array.from(allAvatar).findIndex(
      (checkbox) => checkbox.checked
    );
    if (currentIndex === 14) {
      allAvatar[currentIndex].checked = false;
      allAvatar[0].checked = true;
    } else {
      allAvatar[currentIndex].checked = false;
      allAvatar[currentIndex + 1].checked = true;
    }
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const currentIndex = Array.from(allAvatar).findIndex(
      (checkbox) => checkbox.checked
    );
    if (currentIndex === 0) {
      allAvatar[currentIndex].checked = false;
      allAvatar[14].checked = true;
    } else {
      allAvatar[currentIndex].checked = false;
      allAvatar[currentIndex - 1].checked = true;
    }
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const currentIndex = Array.from(allAvatar).findIndex(
      (checkbox) => checkbox.checked
    );
    if (currentIndex <= 7) {
      allAvatar[currentIndex].checked = false;
    }
    switch (currentIndex) {
      case 0:
        allAvatar[8].checked = true;
        break;
      case 1:
        allAvatar[8].checked = true;
        break;
      case 2:
        allAvatar[9].checked = true;
        break;
      case 3:
        allAvatar[10].checked = true;
        break;
      case 4:
        allAvatar[11].checked = true;
        break;
      case 5:
        allAvatar[12].checked = true;
        break;
      case 6:
        allAvatar[13].checked = true;
        break;
      case 7:
        allAvatar[14].checked = true;
        break;
      default:
        console.log("use up arrow to go up");
    }
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    const currentIndex = Array.from(allAvatar).findIndex(
      (checkbox) => checkbox.checked
    );
    if (currentIndex > 7) {
      allAvatar[currentIndex].checked = false;
    }
    switch (currentIndex) {
      case 8:
        allAvatar[1].checked = true;
        break;
      case 9:
        allAvatar[2].checked = true;
        break;
      case 10:
        allAvatar[3].checked = true;
        break;
      case 11:
        allAvatar[4].checked = true;
        break;
      case 12:
        allAvatar[5].checked = true;
        break;
      case 13:
        allAvatar[6].checked = true;
        break;
      case 14:
        allAvatar[7].checked = true;
        break;
      default:
        console.log("use down arrow to go down");
    }
  }
  if (event.key === "Tab") {
    event.preventDefault();
    if (document.activeElement === usernameField) {
      contactField.focus();
    } else {
      usernameField.focus();
    }
  }
  if (event.key === "=") {
    event.preventDefault();
  }
  if (event.key === "`") {
    event.preventDefault();
    document.getElementById("user-join-id").focus();
  }
});
usernameField.addEventListener("input", function () {
  if (usernameField.value.length === 10) {
    const warningPara = document.querySelector(".max-char-warning");
    if (warningPara.classList.contains("hidden")) {
      warningPara.classList.remove("hidden");
    }
  } else {
    const warningPara = document.querySelector(".max-char-warning");
    if (!warningPara.classList.contains("hidden")) {
      warningPara.classList.add("hidden");
    }
  }
});

document.querySelector(".question-mark").addEventListener("click", toggleInfo);
randomDice.addEventListener("click", getRandomName);
function toggleInfo() {
  document.querySelector(".rules-modal").classList.toggle("hidden");
}
const currYear = new Date().getFullYear();
document.querySelector(".current-year").innerHTML = currYear;
