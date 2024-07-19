@echo off
setlocal enabledelayedexpansion

:: Define the list of service and folder name pairs
set "services=frontend react-frontend backend nest-backend whisper django-whisper summarizer django-summarizer"

:: Define the database services to exclude from stopping
set "db_services=mongo mongo-express"

:: Convert services string to an array
set i=0
for %%s in (%services%) do (
    set /A i+=1
    set service_folder[!i!]=%%s
)

:: Convert db_services string to an array
set j=0
for %%d in (%db_services%) do (
    set /A j+=1
    set db_service[!j!]=%%d
)

:: Function to check if a service is a database service
:IS_DB_SERVICE
set "is_db_service=false"
for /L %%k in (1,1,%j%) do (
    if "%1"=="!db_service[%%k]!" (
        set "is_db_service=true"
    )
)
goto :EOF

:: Stop and remove non-database containers
echo Stopping and removing non-database containers...
for /L %%i in (1,2,%i%) do (
    set "service=!service_folder[%%i]!"
    call :IS_DB_SERVICE !service!
    if "!is_db_service!"=="false" (
        docker-compose rm -s -f !service!
    )
)

:: Loop through each service and folder pair
for /L %%i in (1,2,%i%) do (
    set "service=!service_folder[%%i]!"
    set "folder=!service_folder[%%i+1]!"
    echo Processing !service! in !folder!...

    :: Change to the service directory
    cd !folder!

    :: Get the image name from docker-compose.yml
    for /f "tokens=2 delims= " %%j in ('docker-compose config ^| findstr "image:"') do (
        set "image_name=%%j"
    )

    if not "%image_name%"=="" (
        :: Remove the old image
        echo Removing old image %image_name%...
        docker rmi %image_name%

        :: Build the new image
        echo Building new image for %service%...
        docker build -t %image_name% .
    ) else (
        echo No image found for %service% in docker-compose.yml
    )

    :: Go back to the parent directory
    cd ..
)

:: Start the services
echo Starting the services...
docker-compose up -d

echo All tasks completed successfully.