const { spawn } = require("child_process");
const path = require("path");
const puppeteer = require("puppeteer");

const HEADLESS_PORT = 6767;
const HEADLESS_URL = `http://localhost:${HEADLESS_PORT}/whistlee-headless`;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    args: ["--use-fake-ui-for-media-stream"],
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(HEADLESS_URL, ["microphone"]);

  const [page] = await browser.pages();
  page.on("console", (msg) => console.log(msg.text()));
  await page.goto(HEADLESS_URL);

  // await browser.close();
})();
