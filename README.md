# Embed Generator

A powerful tool for creating rich-embed Discord messages using webhooks.

You will usually want to use the hosted version at https://message.style. There is not much benefit in hosting this
yourself.

## YouTube tutorial
[![IMAGE ALT TEXT HERE](./tutorial.png)](https://www.youtube.com/watch?v=DnFP0MRJPIg)

## Project Structure

### backend

The backend is written in Rust and provides API endpoints for the frontend to use. It handles authentication, saving
messages, and interacting with the discord API. It also connects to the Discord gateway to receive events and build up a
cache of guilds, channels, roles, emojis, and stickers.

### frontend

The frontend is written in React and provides the user interface. It interacts with the backend over HTTP(s).

## Self Hosting

This describes the easiest way to self host an instance of Embed Generator by creating a single binary that contains
both the backend and frontend.

### Build the frontend

You can download NodeJS and NPM from [nodejs.org](https://nodejs.org/en/download/).
Instead of NPM you can also use Yarn.

```sh
# Switch to the frontend directory
cd frontend

# Install the dependencies
npm install
# or 
yarn install

# Start the development server (optional)
npm run start --legacy-peer-deps
# or
yarn start

# Build for production use
npm run build
# or
yarn build
```

### Build the backend

Use [rustup.rs](https://rustup.rs/) to install rust. The minimum supported rust version is 1.5.6.

```sh
# Switch to the backend directory
cd backend
# or if you are in the frontend directoy
cd ../backend

# Start the development server (optional)
RUST_LOG=info cargo run

# Build and include the frontend files in the backend binary (recommended)
cargo build --release
# Or build without the frontend files
# You will need a HTTP server like Nginx to serve the frontend
cargo build --release --no-default-features
```

### Install databases

Install MongoDB and Redis on your device. I'm sure you can find instructions online!

### Configure the server

To configure the server you can create a file called `Config.toml` with the following fields:

```toml
jwt_secret = "1234567890" # The secret for tokens (should be unguessable)

host = "127.0.0.1" # The host to bind the API to (optional; default = "127.0.0.1")
port = 8080 # The port to bind the API to (optional; default = 8080)

mongo_url = "mongodb://127.0.0.1" # The URL to your MongoDB insance (optional; default = "mongodb://127.0.0.1")
redis_url = "redis://127.0.0.1" # The URL to your redis instance (optional; default = "redis://127.0.0.1")


[discord]
token = "" # the discord token of your bot
oauth_client_id = "" # the client / application id of your bot
oauth_client_secret = "" # the oauth client secret of your bot
oauth_redirect_uri = "" # the public url where the frontend will be available (must be added on Discord as the oauth redirect uri)
shard_count = 1 # the shard count (optional; default = 1)

[limits]
max_messages_per_user = 25 # the max count of messages each user can have (optional; default = 25)
max_message_size = 1000000 # the max size of a saved messages (optional; default = ~1MB)

[links]
discord_invite = "" # the invite url to your discord server
source = "" # the url to the github page (optional)
```

You can also set the config values using environment variables. For example `EMBEDG_DISCORD__TOKEN` will set the discord
token and `EMBEDG_JWT_SECRET` will set the jwt secret.

### Run the binary

You should now be able to run the binary and host your own instance of Embed Generator. You usually want to deploy this
behind a reverse proxy like Nginx and terminate TLS there.
