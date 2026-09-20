FROM golang:latest AS builder
WORKDIR /root/
COPY . .

# Install NodeJS (https://github.com/nodesource/distributions#installation-instructions)
RUN apt-get update
RUN apt-get install -y ca-certificates curl gnupg build-essential
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update
RUN apt-get -y install nodejs

# Enable pnpm via Corepack (bundled with Node.js)
RUN corepack enable
RUN corepack prepare pnpm@12.5.1 --activate

# Build site
RUN cd embedg-site && pnpm install --frozen-lockfile && pnpm build && cd ..

# Build app
RUN cd embedg-app && pnpm install --frozen-lockfile && pnpm build && cd ..

# Build backend
RUN cd embedg-service && go build --tags "embedapp embedsite" && cd ..

FROM debian:stable-slim
WORKDIR /root/
COPY --from=builder /root/embedg-service/embedg-service .

RUN apt-get update
RUN apt-get install -y ca-certificates

EXPOSE 8080
CMD ./embedg-service database migrate postgres up; ./embedg-service server