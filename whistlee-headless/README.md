# Headless Whistlee

Run `./rc-playground/bin/start-headless.sh`.

## Allow recording audio

With the default configs, audio recording won't work in the headless process.
We can pass a flag to Chrome to skip the "Allow this site to use your microphone" dialog.

```js
puppeteer.launch({
  args: ["--use-fake-ui-for-media-stream"],
  // ...
});
```

Once the browser session starts, we also need to override the the microphone permission.

```js
const context = browser.defaultBrowserContext();
await context.overridePermissions(HEADLESS_URL, ["microphone"]);
```

## Raspberry PI

Puppeteer doesn't work out of the box on the PI beacuse it doesn't ship with a ARM version of Chromium.
To get it to work with the built in browser, you've gotta give it the path to the chromium executable.

```js
puppeteer.launch({
  executablePath: "/usr/bin/chrome-browser",
  // ...
});
```
