# Soraban Engineering Project Quickstart Guide

## Notes

- Rails config/master.key is commited to Git for development purposes **ONLY**
- Be sure to use the start-dev.sh and stop-dev.sh scrips for sever management

- ![Demonstration GIF](Recordings/Soraban%20Engineering%20Project%20-%20Technical%20Demonstration%20-%20Simple.gif)

## Steps

### Clone the repository and start development containers
- git clone https://github.com/netuoso/soraban-engineering-project -d development
- cd Dockerfile
- ./start-dev.sh
- docker-compose logs -f

### React Application
- Navigate to http://localhost:3001
- Register a User account
- Login with User
- Navigate to http://localhost:3001/transactions

### Explore the Application and view the Dev Tools for performance metrics

### View the docker container logs for more development information metrics

### Stopping the development containers
- ./stop-dev.sh
