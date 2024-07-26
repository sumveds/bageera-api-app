# Build image
docker build -t bageera-api-app-local .

# List all images
docker images

# Create and run a new container from an image
docker run -p80:3000 -d bageera-api-app

# List containers
docker container ls

# Stop one or more running containers
docker container stop ${container_id}

# Stops and removes all running containers
docker rm -f $(docker ps -aq)

# Remove one or more images
docker image rm bageera-api-app
