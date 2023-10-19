# Embed Generator

[![Release](https://github.com/merlinfuchs/embed-generator/actions/workflows/release.yaml/badge.svg)](https://github.com/merlinfuchs/embed-generator/releases)
[![Docker image](https://github.com/merlinfuchs/embed-generator/actions/workflows/docker.yaml/badge.svg)](https://hub.docker.com/r/merlintor/embed-generator)

[![Release](https://img.shields.io/github/v/release/merlinfuchs/embed-generator)](https://github.com/merlinfuchs/embed-generator/releases/latest)
[![MIT License](https://img.shields.io/github/license/merlinfuchs/embed-generator)](LICENSE)
[![Discord Server](https://img.shields.io/discord/730045476459642900)](https://message.style/discord)

A powerful tool for creating rich-embed Discord messages using webhooks.

You will usually want to use the hosted version at https://message.style. There is not much benefit in hosting this
yourself.

## YouTube tutorial

[![Youtube Tutorial](./tutorial.png)](https://www.youtube.com/watch?v=DnFP0MRJPIg)

## Self Hosting

This describes the easiest way to self host an instance of Embed Generator by creating a single binary that contains
both the backend and frontend.

You can find prebuilt binaries of the server with the frontend files included [here](https://github.com/merlinfuchs/embed-generator/releases/latest).

### Build the app

You can download NodeJS and NPM from [nodejs.org](https://nodejs.org/en/download/).

```sh
# Switch to the embedg-app directory
cd embedg-app

# Install yarn globally
npm install -g yarn

# Install dependencies
yarn install

# Start the development server (optional)
yarn dev

# Build for production use
yarn build
```

### Build the site (home page & docs)

```sh
# Switch to the embedg-app directory
cd embedg-site

# Install yarn globally
npm install -g yarn

# Install dependencies
yarn install

# Start the development server (optional)
yarn start

# Build for production use
yarn build
```

### Build the server (backend)

Install Go `>=1.21` from [go.dev](https://go.dev/doc/install).

```sh
# Switch to the backend directory
cd embedg-server
# or if you are in the frontend directoy
cd ../embedg-server

# Configure the server (see steps below)

# Run database migrations
go run main.go migrate postgres up

# Start the development server (optional)
go run --tags "embedapp embedsite" main.go server

# Build and include the frontend files in the backend binary (build app and site first)
go build --tags  "embedapp embedsite"

# Build without including the frontend files in the backend binary (you need to serve yourself)
go build
```

### Install databases

Install PostgresQL on your device and create a user and database. I'm sure you can find instructions online!

### Configure the server

To configure the server you can create a file called `config.yaml` with the following fields:

```yaml
discord:
  client_id: ""
  client_secret: ""
  token: ""

openai:
  api_key: "" # for ChatGPT integration (optional)

postgres:
  host: "localhost"
  port: 5432
  dbname: "embedg"
  user: "postgres"
  password: ""

app:
  public_url: "http://localhost:5173/app"

api:
  # Make sure to add {public_url}/auth/callback to the OAuth2 Redirect URLs of your application in the Discord dev portal
  public_url: "http://localhost:5173/api"

  host: "localhost"
  port: 8080

log:
  use_json: false # Enable to this to have easily parsable JSON log messages (you usually don't want this)

# Here you can configure multiple tiers/plans which are linked to a Discord SKU
premium:
  plans:
    # The default plan that all users automatically have
    - id: default
      default: true
      features:
        max_saved_messages: 25
        max_actions_per_component: 2
        advanced_action_types: false
        ai_assistant: false
        is_premium: false
        custom_bot: false
        max_custom_commands: 0
    # An additional premium plan that will apply when the user or guild has the SKU
    - id: premium_server
      sku_id: "123"
      features:
        max_saved_messages: 100
        max_actions_per_component: 5
        advanced_action_types: true
        ai_assistant: true
        is_premium: true # This is used for handing out cosmetics like a role on the support server
        custom_bot: true
        max_custom_commands: 5
```

You can also set the config values using environment variables. For example `EMBEDG_DISCORD__TOKEN` will set the discord
token.

### Run the binary

You should now be able to run the binary and host your own instance of Embed Generator. You usually want to deploy this
behind a reverse proxy like Nginx and terminate TLS there.
