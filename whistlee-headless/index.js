import puppeteer from "puppeteer";
import { Patterns, receive } from "./comms.js";

const HEADLESS_PORT = 6767;
const HEADLESS_URL = `http://localhost:${HEADLESS_PORT}/whistlee-headless/`;

const log = (...args) => console.log(new Date().toString(), "|", ...args);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    args: ["--use-fake-ui-for-media-stream"],
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(HEADLESS_URL, ["microphone"]);

  const [page] = await browser.pages();

  page.on("console", (msg) => {
    const payload = msg.text();
    const message = receive(payload);

    if (message) {
      const [name, pattern] = message;
      log("match:", { name, pattern });
      return;
    }

    log(payload);
  });
  await page.goto(HEADLESS_URL);
})();
