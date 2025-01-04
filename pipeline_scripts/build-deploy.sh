# !/usr/bin/env bash

source ~/.bashrc

echo "Removing previous archive..."
rm deploy.zip
echo "Preparing dependencies..."
pip install -r requirements.txt -t deploy/
echo "Copying application source..."
cp -r src/ ./deploy/src
cd deploy/
echo "Creating new archive..."
zip -rq ../deploy.zip
cd ..
rm -rf deploy/ 