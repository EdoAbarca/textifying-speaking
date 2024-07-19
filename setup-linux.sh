#!/bin/bash

# Define the list of service and folder name pairs
declare -A services
services=(
  ["frontend"]="react-frontend"
  ["backend"]="nest-backend"
  ["whisper"]="django-whisper"
  ["summarizer"]="django-summarizer"
)

# Define the database services to exclude from stopping
db_services=("mongo" "mongo-express")

# Stop and remove non-database containers
echo "Stopping and removing non-database containers..."
for service in "${!services[@]}"; do
  if [[ ! " ${db_services[@]} " =~ " ${service} " ]]; then
    docker-compose rm -s -f $service
  fi
done

# Loop through each service and folder pair
for service in "${!services[@]}"; do
  folder=${services[$service]}
  echo "Processing $service in $folder..."

  # Change to the service directory
  cd $folder

  # Get the image name from docker-compose.yml
  image_name=$(docker-compose config | grep "image:" | awk '{print $2}')

  if [ ! -z "$image_name" ]; then
    # Remove the old image
    echo "Removing old image $image_name..."
    docker rmi $image_name

    # Build the new image
    echo "Building new image for $service..."
    docker build -t $image_name .
  else
    echo "No image found for $service in docker-compose.yml"
  fi

  # Go back to the parent directory
  cd ..
done

# Start the services
echo "Starting the services..."
docker-compose up -d

echo "All tasks completed successfully."
