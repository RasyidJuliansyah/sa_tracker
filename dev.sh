#!/bin/bash

# Start backend and frontend in parallel
set -m  # Enable job control

echo "🚀 Starting SA Visit Tracker Dev Server..."
echo ""

# Get Node 24 in PATH
export PATH="/opt/homebrew/bin:$PATH"

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "⏹️  Stopping all services..."
  kill %1 %2 2>/dev/null
  exit 0
}

trap cleanup EXIT INT TERM

# Start backend
cd "$(dirname "$0")/backend"
fnm exec --using=24 npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) on port 3011"

# Start frontend
cd "$(dirname "$0")/frontend"
fnm exec --using=24 npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID) on port 3010"

echo ""
echo "📱 Access at:"
echo "  Localhost: http://localhost:3010"
echo "  Network:   http://<your-ip>:3010"
echo ""
echo "🔐 Login:"
echo "  Email: admin@skolla.education"
echo "  Pass:  SkollaEdu"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background jobs
wait
