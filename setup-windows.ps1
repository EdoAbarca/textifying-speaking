# Define the list of service and folder name pairs
$services = @{
    "frontend" = "react-frontend"
    "backend" = "nest-backend"
    #"whisper" = "django-whisper"
    #"summarizer" = "django-summarizer"
}

# Define the database services to exclude from stopping
#$db_services = @("mongo", "mongo-express")

# Stop and remove non-database containers
Write-Host "Stopping and removing non-database containers..."
foreach ($service in $services.Keys) {
#    if ($db_services -notcontains $service) {
        Write-Host "Stopping and removing $service..."
        docker-compose rm -s -f $service
#    }
}

# Loop through each service and folder pair
foreach ($service in $services.Keys) {
    $folder = $services[$service]
    Write-Host "Processing $service in $folder..."

    # Change to the service directory
    Write-Host "Previously in: $(Get-Location)"
    Push-Location $folder
    Write-Host "Changed to: $(Get-Location)"

    # Get the image name from docker-compose.yml
    $image_name = docker-compose config | Select-String "image:" | ForEach-Object { $_.Line.Split(' ')[1] } | Where-Object { $_.Trim() -ne "" }

    if ($image_name) {
        # Remove the old image
        Write-Host "Removing old image $image_name..."
        docker rmi $image_name

        # Build the new image
        #Write-Host "Building new image for $service..."
        #docker build -t $image_name .
    } else {
        Write-Host "No image found for $service in docker-compose.yml"
    }

    # Go back to the parent directory
    Pop-Location
}

# Start the services
Write-Host "Starting the services..."
docker-compose up --build -d

Write-Host "All tasks completed successfully."
