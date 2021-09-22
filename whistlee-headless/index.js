const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    args: ["--use-fake-ui-for-media-stream"],
  });
  const context = browser.defaultBrowserContext();
  try {
    await context.overridePermissions("http://localhost:3000", ["microphone"]);
  } catch (error) {
    console.error("FAIL", error);
    browser.close();
  }
  const page = await browser.newPage();
  page.on("console", (msg) => console.log(msg.text()));
  await page.goto("http://localhost:3000/whistlee2/");

  // await browser.close();
})();
