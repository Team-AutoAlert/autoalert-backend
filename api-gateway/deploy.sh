#!/bin/bash

# ----------------------
# KUDU Deployment Script
# ----------------------

# Installs dependencies
echo "Installing dependencies..."
eval npm install

# Build the application
echo "Building the application..."
eval npm run build

# Copy startup script
echo "Copying startup script..."
cp startup.sh /home/site/wwwroot/

echo "Finished successfully." 