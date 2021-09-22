#!/bin/sh
trap "kill 0" EXIT

yarn build

yarn http-server --port 6767 &
SERVER_PID=$!
sleep 5 && kill $SERVER_PID &

node whistlee-headless/index.js


