#!/bin/bash
set -e

echo "🚀 Starting Lean_RPG Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Setup database if needed
echo "🗄️ Setting up database..."
npm run prisma:migrate || true
npm run prisma:seed || true

# Start the server
echo "✅ Starting server on port 4000..."
npm start
