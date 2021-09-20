const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
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
