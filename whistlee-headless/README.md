# Headless Whistlee

Start the root's `yarn dev` in a separate window.

Run `node index.js` to boot puppeteer and go to the site.

## Raspberry PI

First off, puppeteer doesn't work out of the box on the PI beacuse it doesn't ship with a ARM version of Chrome.
To get it to work with the built in browser, you've gotta give it the path to the chromium executable.

```js
puppeteer.launch({
  dumpio: true, // see more logs
  executablePath: "/usr/bin/chrome-browser",
  // ...
});
```

For reasons I don't fully understand, a/v isn't availalbe to a headless chromium process on the Pi.
Everything runs as expected, but `navigator.mediaDevices.getUserMedia({audio: true})` fails with a "Not supported" error.

The only way I found to get around that is to run the page using puppeteer but _with_ UI.

```js
puppeteer.launch({
  executablePath: "/usr/bin/chrome-browser",
  headless: false,
  // ...
});
```

Head-full mode will fail if the Pi's desktop environment isn't running though, so you can't start it using ssh.
Boot you Pi with a screen/keyboard, or login using VNC.

Open the terminal GUI, and start a tmux session.

Follow the instructions at the top in tmux.
When you run `node index.js` you should see Chromium boot up, navigate to http://localhost:3000/whistlee2/.

Detach from the tmux window and log out of the Pi.
The page should keep running in the background.
If you ssh in and reattach the tmux session, it should keep working.
