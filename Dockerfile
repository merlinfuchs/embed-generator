FROM node:slim
WORKDIR /root/
COPY . .

# Build frontend
RUN cd embedg-app && npm install -g yarn && yarn install && yarn build && cd ..

# Build backend
RUN apt-get update
RUN apt-get install -y build-essential curl
RUN curl -OL https://golang.org/dl/go1.20.4.linux-amd64.tar.gz
RUN sudo tar -C /usr/local -xvf go1.20.4.linux-amd64.tar.gz
ENV PATH=$PATH:/usr/local/go/bin
RUN cd embedg-server && go build && cd ..

FROM debian:bullseye-slim
WORKDIR /root/
COPY --from=0 /root/embedg-server/embedg-server ./
EXPOSE 8080
CMD ["./embedg-server"]