#!/bin/bash

# Define the S3 bucket name
BUCKET_NAME="<your-bucket-name>"

# Upload the index.html file to the S3 bucket
aws s3 cp templates/index.html s3://$BUCKET_NAME/templates/index.html --acl public-read