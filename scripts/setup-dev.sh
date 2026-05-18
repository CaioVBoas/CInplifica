#!/bin/bash

# CInplifica - Unified Development Setup Script
# This script automates the setup for the backend and database.

set -e # Exit on error

echo "🚀 Starting CInplifica setup..."

# 1. Environment Variable Validation
echo "📁 Checking environment variables..."
if [ ! -f apps/api/.env ]; then
  echo "⚠️  apps/api/.env not found. Creating from .env.example..."
  cp apps/api/.env.example apps/api/.env
  echo "✅ apps/api/.env created. Please review it if you have custom settings."
else
  echo "✅ apps/api/.env already exists."
fi

# 2. Dependency Installation
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed."

# 3. DB Initialization
echo "🐳 Checking Docker and starting database..."
if ! command -v docker &> /dev/null; then
    echo "❌ Error: 'docker' command not found. Please install Docker to run the database."
    exit 1
fi

# Try 'docker compose' first, then 'docker-compose'
DOCKER_COMPOSE_CMD="docker compose"
if ! $DOCKER_COMPOSE_CMD version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    if ! $DOCKER_COMPOSE_CMD version &> /dev/null; then
        echo "❌ Error: Neither 'docker compose' nor 'docker-compose' was found."
        exit 1
    fi
fi

echo "🔄 Starting database container with $DOCKER_COMPOSE_CMD..."
$DOCKER_COMPOSE_CMD up -d db

echo "⏳ Waiting for PostgreSQL to be ready..."
# We use a simple loop to wait for the port to be open
MAX_RETRIES=30
RETRY_COUNT=0
while ! nc -z localhost 5432; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Error: Database did not start in time."
    exit 1
  fi
  sleep 1
done
echo "✅ Database is ready."

# 4. Prisma Sync
echo "💎 Running Prisma synchronization..."
cd apps/api
npx prisma generate
echo "🔄 Applying database migrations..."
npx prisma migrate dev --name init
echo "🌱 Running seed script..."
npx prisma db seed
cd ../..

echo "✨ Setup complete! You can now start the services:"
echo "   - Backend: npm run api"
echo "   - Frontend: npm run web"
