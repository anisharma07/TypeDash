const easyDivToPopulate = document.querySelector(".player-rankings-easy");
const MediumDivToPopulate = document.querySelector(".player-rankings-medium");

let MobileEasy = [];
let MobileMedium = [];
let LaptopEasy = [];
let LaptopMedium = [];
let EasyRehtaHai = [];
let MediumRehtaHai = [];

const populateLeaderboard = function (joiningID) {
  fetch("/get-users-leaderboard", {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      MobileEasy = data
        .filter((player) => player.highScore.Easy.Mobile !== 0)
        .map((player) => {
          return {
            joinId: player.joinId,
            username: player.username,
            userAvatar: player.userAvatar,
            Highscore: player.highScore.Easy.Mobile,
            device: "iphone",
          };
        });
      LaptopEasy = data
        .filter((player) => player.highScore.Easy.Laptop !== 0)
        .map((player) => {
          return {
            joinId: player.joinId,
            username: player.username,
            userAvatar: player.userAvatar,
            Highscore: player.highScore.Easy.Laptop,
            device: "computer",
          };
        });
      MobileMedium = data
        .filter((player) => player.highScore.Medium.Mobile !== 0)
        .map((player) => {
          return {
            joinId: player.joinId,
            username: player.username,
            userAvatar: player.userAvatar,
            Highscore: player.highScore.Medium.Mobile,
            device: "iphone",
          };
        });
      LaptopMedium = data
        .filter((player) => player.highScore.Medium.Laptop !== 0)
        .map((player) => {
          return {
            joinId: player.joinId,
            username: player.username,
            userAvatar: player.userAvatar,
            Highscore: player.highScore.Medium.Laptop,
            device: "computer",
          };
        });

      EasyRehtaHai = MobileEasy.concat(LaptopEasy).sort(
        (a, b) => b.Highscore - a.Highscore
      );
      MediumRehtaHai = MobileMedium.concat(LaptopMedium).sort(
        (a, b) => b.Highscore - a.Highscore
      );

      easyDivToPopulate.innerHTML = "";
      EasyRehtaHai.forEach((player) => {
        const html = ` <div class="rank-card ${
          player.joinId == joiningID ? "me-rank-card" : ""
        }">
                              <img
        src="images/avatars/${player.userAvatar}.png"
        alt="user-avatar"
        class="leaderboard-avatar"
      />
      <p class="rank-player-name">
        ${player.username}<span class="player-user-id">#${player.joinId}</span>
      </p>
      <p class="rank-player-wpm">${player.Highscore} wpm</p>
      <img src="images/${player.device}.png" alt="device" class="device-icon" />
      </div>`;
        easyDivToPopulate.innerHTML += html;
      });

      MediumDivToPopulate.innerHTML = "";
      MediumRehtaHai.forEach((player) => {
        const html = ` <div class="rank-card ${
          player.joinId == joiningID ? "me-rank-card" : ""
        }">
        <img
src="images/avatars/${player.userAvatar}.png"
alt="user-avatar"
class="leaderboard-avatar"
/>
<p class="rank-player-name">
${player.username}<span class="player-user-id">#${player.joinId}</span>
</p>
<p class="rank-player-wpm">${player.Highscore} wpm</p>
<img src="images/${player.device}.png" alt="device" class="device-icon" />
</div>`;
        MediumDivToPopulate.innerHTML += html;
      });
    });
};
