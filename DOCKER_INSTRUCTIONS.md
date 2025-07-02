# Docker Instructions for Type Dash

This document provides instructions for running Type Dash using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Running the Application with Docker

1. Build and start the containers:

```bash
cd /path/to/Type-Dash
docker-compose up -d
```

2. Access the application:

   - Open your browser and navigate to http://localhost:3000

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

- `MONGODB_URI`: MongoDB connection URI. Default: `mongodb://mongo:27017/type-dash` (when using Docker)

## Data Persistence

MongoDB data is persisted in a Docker volume named `mongo-data`. This ensures that your data will survive container restarts.

## Rebuilding the Application

If you make changes to your code, rebuild the Docker image:

```bash
docker-compose build
docker-compose up -d
```
