#!/bin/sh
trap "kill 0" EXIT

echo "🚧 building assets..."
yarn build > /dev/null 2>&1

echo "📡 starting temporary server..."
yarn http-server --port 6767 dist > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5 && echo "🏁 shutting down temporary server..." && kill $SERVER_PID &

echo "🦾 starting puppeteer!"
node whistlee-headless/index.js


