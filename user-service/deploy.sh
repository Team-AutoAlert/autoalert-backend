#!/bin/bash

# ----------------------
# KUDU Deployment Script
# ----------------------

# Installs dependencies
echo "Installing dependencies..."
eval npm install

# Build the application (if needed)
echo "Building the application..."
eval npm run build

# Copy web.config (will create this next)
echo "Copying web.config..."
cp web.config /home/site/wwwroot/

# Start the application
echo "Starting the application..."
echo "Finished successfully." 