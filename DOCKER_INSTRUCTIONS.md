# Docker Instructions for Type Dash

This document provides instructions for running Type Dash using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Running the Application with Docker

### Quick Setup (Recommended)

**Easiest way - Automated start with auto-detection:**

```bash
cd /path/to/Type-Dash
./scripts/start.sh
```

**Interactive setup for database configuration:**

```bash
cd /path/to/Type-Dash
./scripts/start.sh --setup
```

**Other useful commands:**

```bash
# Check application status
./scripts/status.sh

# Stop the application
./scripts/stop.sh
```

### Manual Setup Options

### Option 1: With Local MongoDB (Default)

1. Build and start the containers with local database:

```bash
cd /path/to/Type-Dash
docker-compose --profile local-db up -d
```

### Option 2: With MongoDB Atlas (Cloud Database)

1. Set up MongoDB Atlas (see Environment Variables section below)

2. Create `.env` file with your Atlas connection string

3. Start only the application (no local database):

```bash
cd /path/to/Type-Dash
docker-compose --profile atlas up -d
```

### General Usage

2. Access the application:

   - Open your browser and navigate to http://localhost:2360

3. View logs:

```bash
docker-compose logs -f
```

4. Stop the application:

```bash
docker-compose down
```

## Environment Variables

The application uses the following environment variables:

- `MONGODB_URI`: MongoDB connection URI. Options:
  - **Local Docker Database (default)**: `mongodb://mongo:27017/type-dash`
  - **MongoDB Atlas (cloud)**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

### Setting up MongoDB Atlas (Cloud Database)

1. **Create a MongoDB Atlas account** at https://www.mongodb.com/atlas
2. **Create a free cluster**
3. **Get your connection string** from Atlas dashboard
4. **Create a `.env` file** in your project root:
   ```bash
   cp .env.example .env
   ```
5. **Edit `.env` file** and replace the MONGODB_URI:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/type-dash?retryWrites=true&w=majority
   ```
6. **Run with Atlas** (without local MongoDB):
   ```bash
   docker-compose --profile atlas up -d
   ```

### Using Local Database vs Cloud Database

**For Local Database (current setup):**

```bash
# Starts both app and local MongoDB
docker-compose --profile local-db up -d
```

**For MongoDB Atlas (cloud database):**

```bash
# Only starts the app, uses Atlas for database
docker-compose --profile atlas up -d
```

## Data Persistence

MongoDB data is persisted in a Docker volume named `mongo-data`. This ensures that your data will survive container restarts.

## Script Usage Summary

| Command                      | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| `./scripts/start.sh`         | Auto-detect configuration and start the application |
| `./scripts/start.sh --setup` | Interactive database setup and start                |
| `./scripts/status.sh`        | Check application and service status                |
| `./scripts/stop.sh`          | Stop all application containers                     |

## Rebuilding the Application

If you make changes to your code, the easiest way is to restart:

```bash
./scripts/stop.sh
./scripts/start.sh
```

Or rebuild manually:

```bash
docker-compose build
docker-compose --profile local-db up -d  # for local DB
# OR
docker-compose --profile atlas up -d     # for Atlas
```
