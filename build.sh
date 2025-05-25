#!/bin/bash

echo "Installing Node.js dependencies..."
cd backend && npm install

echo "Installing Python dependencies..."
cd ../AI/Models && python3 -m pip install -r requirements.txt

echo "Build completed successfully"