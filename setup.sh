#!/bin/bash

# Papaya Pulse - Automated Setup Script
# This script helps set up the development environment

echo "🍈 Papaya Pulse - Setup Script"
echo "=============================="
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js is installed: $NODE_VERSION"
else
    echo "❌ Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi

# Check MongoDB
echo "Checking MongoDB installation..."
if command -v mongod &> /dev/null
then
    MONGO_VERSION=$(mongod --version | head -n 1)
    echo "✅ MongoDB is installed: $MONGO_VERSION"
else
    echo "⚠️  MongoDB is not installed. Please install from https://www.mongodb.com/"
fi

echo ""
echo "Setting up Frontend..."
cd papayapulse
npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "Setting up Backend..."
cd ../backend
npm install
echo "✅ Backend dependencies installed"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit backend/.env with your configuration"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure Firebase credentials in papayapulse/config/firebase.ts"
echo "2. Place Firebase Admin SDK JSON in backend/config/"
echo "3. Edit backend/.env with your settings"
echo "4. Start MongoDB: mongod (or your system's command)"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd papayapulse && npm start"
echo ""
echo "📚 See SETUP_GUIDE.md for detailed instructions"
echo "=============================="
