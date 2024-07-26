Sure! Here is an updated README file with details about the `main.ts` and `app.module.ts` files:

````markdown
# Bageera API App

The Bageera API App exposes a comprehensive set of endpoints that facilitate efficient data interaction and management. Whether your data resides in CSV files, SQL databases like MySQL, or data warehouses such as BigQuery, enabling you to harness the full potential of your data for insightful decision-making and business growth.

## Table of Contents

- [Installation](#installation)
- [Running the app](#running-the-app)
- [Docker commands](#docker-commands)
- [Test](#test)
- [Main and App Files](#main-and-app-files)
- [License](#license)

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Docker commands

```bash
# Build image
$ docker build -t bageera-api-app-local .

# List all images
$ docker images

# Create and run a new container from an image
$ docker run -p80:3000 -d bageera-api-app

# List containers
$ docker container ls

# Stop one or more running containers
$ docker container stop ${container_id}

# Stops and removes all running containers
$ docker rm -f $(docker ps -aq)

# Remove one or more images
$ docker image rm bageera-api-app
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Main and App Files

### `main.ts`

The `main.ts` file is the entry point of the application. It is responsible for bootstrapping the NestJS application.

### `app.module.ts`

The `app.module.ts` file is the root module of the application. It imports and organizes the application's modules and providers.

The `AppModule` imports other modules like `UserModule`, `ChatModule`, and `CsvDataSourceModule`.

Each of the Modules have controller responsible for handling incoming requests and returning responses to the client like user.controller.ts, chat.controller.ts etc.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

```

This README provides a comprehensive overview of the project, explaining the structure, how to set up and use the application, key features like authentication and logging, and details about the main and app files to help engineers understand the application flow.
```
````
