FROM golang:latest as builder
WORKDIR /root/
COPY . .

# Install NodeJS (https://github.com/nodesource/distributions#installation-instructions)
RUN apt-get update
RUN apt-get install -y ca-certificates curl gnupg build-essential
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update
RUN apt-get -y install nodejs

# Enable Yarn via Corepack (bundled with Node.js)
RUN corepack enable
RUN corepack prepare yarn@1.22.22 --activate

# Build site
RUN cd embedg-site && yarn install && yarn build && cd ..

# Build app
RUN cd embedg-app && yarn install && yarn build && cd ..

# Build backend
RUN cd embedg-server && go build --tags "embedapp embedsite" && cd ..

FROM debian:stable-slim
WORKDIR /root/
COPY --from=builder /root/embedg-server/embedg-server .

RUN apt-get update
RUN apt-get install -y ca-certificates gnupg build-essential

EXPOSE 8080
CMD ./embedg-server migrate postgres up; ./embedg-server server