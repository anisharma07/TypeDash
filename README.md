<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://speed-type-wnz9.onrender.com">
    <img src="https://res.cloudinary.com/dwwajleyo/image/upload/v1711745709/posters_and_assets/typedash_idsujz.png" alt="Logo" width="80">
  </a>

  <h3 align="center">Type Dash</h3>

  <p align="center">
    A 1v1 or group typing challenge game, created for conducting live Typing Race Events in an Exhibition or a Competition
    <br />
    <br />
    <a href="https://youtu.be/lEh0KG50AsI?si=DnHKlQqClXtbN8BN">View Demo</a>
    ·
    <a href="https://github.com/anisharma07/TypeDash/issues">Report Bug</a>
    ·
    <a href="https://github.com/anisharma07/TypeDash/issues">Request Feature</a>
    ·
    <a href="https://www.figma.com/design/PLxbmlfXFbZ33MHcqdyLHC/Type-Dash?node-id=0-1&t=BZFaK7r2I1Tiyvcj-1">UI Link</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

Type Dash is a dynamic real-time multiplayer typing competition platform designed for conducting live typing race events in exhibitions, competitions, and casual gaming. Whether you're organizing a 1v1 duel or a group tournament, Type Dash provides an engaging space-themed environment where players can compete, improve their typing skills, and climb the leaderboard.

<img src="/public/images/github.png" alt="Logo">

### Use Cases

**1v1 or 1vn Competition**: Players compete in real-time group typing competitions with instant results and rewards for winning players. Perfect for live events and competitions.

**All Players Competition**: Players compete in group competitions by registering with their unique Player ID. Type Dash stores the highest score for each registered user, allowing rewards to be distributed based on leaderboard rankings at the end of typing events.

### Key Features

🚀 **Real-Time Typing Challenges** - Compete with friends, family, or groups in live typing races

📊 **Leaderboard Rankings** - Stores and displays the highest scores for each player

🎮 **Easy Login System** - Quick player registration using unique Player ID from the home page

👨‍🚀 **Avatar Selection** - Choose from various avatars for better user experience with a space-like theme

⚡ **Live WPM Updates** - Real-time words per minute tracking and avatar movements on the race track

⌨️ **Shortcut Keys** - Complete mouseless experience with keyboard shortcuts

🎯 **Two Difficulty Levels** - Different sentence types to test typing performance on various characters (dots, commas, simple letters)

🚦 **Traffic Light Timer** - Countdown indicator before starting matches to ensure all users are ready

🎲 **Random Avatar Names** - Quick sign-up with a variety of randomly generated avatar names

📈 **Performance Analytics** - Shows WPM and accuracy statistics after completing matches

✨ **Optimized TsParticles** - Beautiful space-themed background with twinkling stars and particle effects

Checkout the live link [here](https://speed-type-wnz9.onrender.com) (Note: It might take few minutes to load due to server inactivity).

### Built With

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-0db7ed?style=for-the-badge&logo=docker&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)
![Adobe Illustrator](https://img.shields.io/badge/Adobe%20Illustrator-FF9A00?style=for-the-badge&logo=adobe%20illustrator&logoColor=white)

<!-- GETTING STARTED -->

## Getting Started

Type Dash can be set up in multiple ways depending on your needs. Choose the setup method that works best for your environment:

### 🚀 Quick Setup Options

#### Option 1: Docker Setup (Recommended)

Perfect for production and easy deployment with all dependencies included. View Complete Guide at [DOCKER_INSTRUCTIONS.md](DOCKER_INSTRUCTIONS.md)

```bash
# Clone the repository
git clone https://github.com/anisharma07/TypeDash
cd Type-Dash

# Start with Docker (includes MongoDB)
chmod +x scripts/start.sh
./scripts/start.sh

# Access the application
# Local: http://localhost:2360
# Network: http://YOUR_IP:2360
```

#### Option 2: Manual Development Setup

Best for development and customization. See [DEVSETUP.md](DEVSETUP.md) for detailed instructions.

```bash
# Clone the repository
git clone https://github.com/anisharma07/TypeDash
cd Type-Dash

# Install dependencies
npm install

# Configure environment (.env file)
MONGODB_URI=mongodb://localhost:27017/TypeDash

# Start the application
npm start

# Access the application
# Local: http://localhost:2360
# Network: http://YOUR_IP:2360
```

### Prerequisites

**For Docker Setup:**

- Docker & Docker Compose
- Git

**For Manual Setup:**

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Environment Configuration

Create a `.env` file in the root directory:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/TypeDash

# For local development with docker (default)
MONGODB_URI=mongodb://mongo:27017/TypeDash

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/TypeDash

# Optional configuration
NODE_ENV=development
PORT=3000
```

## Playing Suggestions

### 1. Local Network Hosting

- Copy the Network Ip from your computer, also logged when you run the application
- Share the ip with your devices running the same wifi network.
- Access the app on http://<your_ip_address>:2360

### 2. NGROK

- Install [ngrok](https://ngrok.com) and create a temporary link to the port where app is running...
- share the link with your friends and enjoy typing...
  <img src="/public/images/ng-rok.png" alt="ng-rok">

### 3. Host on Cloud Service:

- Use Aws or any other cloud service to host the application
- Use the public Ip or domain from service provider to access the application online.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/othneildrew/Best-README-Template/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/othneildrew/Best-README-Template/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge
[issues-url]: https://github.com/othneildrew/Best-README-Template/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com
