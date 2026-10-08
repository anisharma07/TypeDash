# TypeDash - Development Setup Guide

A comprehensive guide for setting up TypeDash locally for development using Node.js and MongoDB.

## 📋 Prerequisites

Before setting up TypeDash, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v22 or higher; required by the React/Vite client toolchain)

  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version` and `npm --version`

- **MongoDB** (v5.0 or higher)

  - **Option 1**: Local MongoDB installation
    - **macOS**: `brew install mongodb-community`
    - **Ubuntu/Debian**: `sudo apt install mongodb`
    - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
  - **Option 2**: MongoDB Atlas (Cloud) - Recommended for production
    - Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)

- **Git**
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

### Optional

- **Docker & Docker Compose** (for containerized development)

  - Docker Desktop: [docker.com](https://www.docker.com/products/docker-desktop/)
  - Verify installation: `docker --version` and `docker-compose --version`

- **Code Editor**
  - VS Code (recommended): [code.visualstudio.com](https://code.visualstudio.com/)
  - Or any editor of your choice

## 🚀 Manual Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd TypeDash

# Or if you already have the code
cd /path/to/your/TypeDash/project
```

### Step 2: Install Dependencies

```bash
# Install server dependencies (repo root)
npm install

# Install client dependencies (React + Vite, in client/)
npm run client:install
```

### Step 3: Database Setup

Choose one of the following database options:

#### Option A: Local MongoDB Setup

1. **Start MongoDB service**:

   ```bash
   # macOS (if installed via Homebrew)
   brew services start mongodb-community

   # Ubuntu/Debian
   sudo systemctl start mongod
   sudo systemctl enable mongod

   # Windows
   net start MongoDB
   ```

2. **Verify MongoDB is running**:

   ```bash
   # Check if MongoDB is listening on port 27017
   netstat -an | grep :27017

   # Or connect using MongoDB shell
   mongosh
   ```

3. **Create database** (optional - will be created automatically):
   ```bash
   mongosh
   > use TypeDash
   > db.createCollection("users")
   > exit
   ```

#### Option B: MongoDB Atlas (Cloud) Setup

1. **Create MongoDB Atlas account**:

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier available)

2. **Configure network access**:

   - Go to "Network Access" in Atlas dashboard
   - Add your IP address or `0.0.0.0/0` for development

3. **Create database user**:

   - Go to "Database Access"
   - Create a new user with read/write permissions
   - Remember the username and password

4. **Get connection string**:
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string

### Step 4: Environment Configuration

1. **Create environment file**:

   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

2. **Edit `.env` file**:

   ```bash
   # For local MongoDB
   MONGODB_URI=mongodb://localhost:27017/TypeDash

   # For MongoDB Atlas (replace with your actual connection string)
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/TypeDash?retryWrites=true&w=majority

   # Other environment variables
   NODE_ENV=development
   PORT=3000
   ```

### Step 5: Run the Application

**Development (two terminals, hot reload):**

```bash
# Terminal 1 - Node server (Socket.IO + API + MongoDB) on port 2360
npm run dev

# Terminal 2 - Vite dev server on port 5173
npm run client:dev
```

Open `http://localhost:5173`. Vite proxies `/socket.io` and `/get-users-leaderboard`
to the Node server on port 2360, so the Node server must be running.

**Production-style (single process on port 2360):**

```bash
npm run build   # npm ci in client/ + build into client/dist
npm start       # node app.js serves client/dist
```

Open `http://localhost:2360`. If `client/dist` is missing the server logs a warning
and answers `GET /` with a 503 telling you to run `npm run build`.

### Step 6: Verify Setup

1. **Check application**:

   - Open your browser and visit: `http://localhost:5173` (dev) or `http://localhost:2360` (production build)
   - You should see the TypeDash homepage

2. **Check database connection**:

   - Look for database connection success message in the console
   - No MongoDB timeout errors should appear

3. **Test basic functionality**:
   - Try creating a game or accessing different pages
   - Check browser console for any JavaScript errors

## 🛠️ Development Tools & Scripts

### Available NPM Scripts

```bash
# Start the application
npm start

# Development mode with auto-restart
npm run dev

# Production server (serves client/dist)
npm start

# Client dev server (Vite, port 5173)
npm run client:dev

# Install client deps / build the client
npm run client:install
npm run client:build
npm run build          # both of the above

# Run the client tests (vitest)
npm test
```

### Useful Development Commands

```bash
# Check Node.js and npm versions
node --version
npm --version

# List installed packages
npm list

# Update dependencies
npm update

# Install new packages
npm install <package-name>

# MongoDB operations
mongosh                           # Connect to local MongoDB
mongosh "mongodb://localhost:27017/TypeDash"  # Connect to specific database
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues

**Error**: `MongooseError: Operation buffering timed out`

**Solutions**:

- Ensure MongoDB is running: `mongosh` or check system services
- Verify connection string in `.env` file
- Check firewall settings (allow port 27017)
- For Atlas: verify IP whitelist and credentials

#### 2. Node.js Module Issues

**Error**: `Module not found` or `Cannot find module`

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <process-id>

# Or use different port
PORT=3001 npm start
```

#### 4. Permission Issues

**Error**: `EACCES: permission denied`

**Solutions**:

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Or use npm with specific user
npm config set user 0
npm config set unsafe-perm true
```

### Database Troubleshooting

```bash
# Check MongoDB status
sudo systemctl status mongod    # Linux
brew services list | grep mongo # macOS

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log  # Linux
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS

# Test connection
mongosh --eval "db.adminCommand('ping')"
```

## 📁 Project Structure

```
TypeDash/
├── app.js                 # Main application file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
├── .env.example         # Environment template
├── client/              # React + TypeScript + Vite frontend
│   ├── index.html       # Home page entry (src/home/main.tsx)
│   ├── multiplayer.html # Game page entry (src/game/main.tsx)
│   ├── src/
│   ├── public/images/
│   └── dist/            # Build output served by app.js (git-ignored)
├── legacy/public/       # Original vanilla frontend (reference only)
├── utils/               # Utility functions
│   ├── functions.js
│   ├── quotes.js
│   └── usernames.js
├── scripts/             # Deployment scripts
│   ├── start.sh
│   ├── stop.sh
│   └── status.sh
└── README.md           # Project documentation
```

## 🌐 Network Access

### Local Development

- **Local**: `http://localhost:2360` (or `:5173` with the Vite dev server)
- **Network**: `http://YOUR_LOCAL_IP:2360`

### Find Your Network IP

```bash
# Linux/macOS
hostname -I
ifconfig | grep inet

# Windows
ipconfig
```

## 📚 Additional Resources

- **Node.js Documentation**: [nodejs.org/docs](https://nodejs.org/docs/)
- **MongoDB Documentation**: [docs.mongodb.com](https://docs.mongodb.com/)
- **React**: [react.dev](https://react.dev/) and **Vite**: [vite.dev](https://vite.dev/)
- **Express.js Guide**: [expressjs.com](https://expressjs.com/)
- **Socket.io Documentation**: [socket.io/docs](https://socket.io/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Description of changes"`
6. Push: `git push origin feature-name`
7. Create a Pull Request

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Search existing issues on GitHub
3. Create a new issue with detailed information:
   - Operating system
   - Node.js version
   - MongoDB version
   - Error messages
   - Steps to reproduce

---

**Happy coding! 🚀**
