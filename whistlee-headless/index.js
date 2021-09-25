import puppeteer from "puppeteer";
import { Patterns, receive } from "./comms.js";
import {
  Accessory,
  Categories,
  Characteristic,
  Service,
  uuid,
} from "hap-nodejs";

const HEADLESS_PORT = 6767;
const HEADLESS_URL = `http://localhost:${HEADLESS_PORT}/whistlee-headless/`;

const whistleeUuid = uuid.generate(process.env.WHISTLEE_SWITCH_ID);
const whistleeAccessory = new Accessory("Whistlee v0", whistleeUuid);

const callbacks = Object.entries(Patterns).reduce(
  (acc, [name, pattern], index) => {
    const switchService = new Service.StatelessProgrammableSwitch(
      `Whistlee ${name}`,
      name
    );

    switchService.getCharacteristic(Characteristic.Name).setValue(name);

    switchService
      .getCharacteristic(Characteristic.ServiceLabelIndex)
      .setValue(index + 1);

    whistleeAccessory.addService(switchService);

    acc[name] = () => {
      log(`trigger match for ${name} (${pattern.toString()})`);
      switchService
        .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
        .sendEventNotification(
          Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
        );
    };
    return acc;
  },
  {}
);

// once everything is set up, we publish the accessory. Publish should always be the last step!
whistleeAccessory.publish({
  username: process.env.WHISTLEE_SWITCH_USERNAME,
  pincode: process.env.WHISTLEE_SWITCH_PIN,
  port: process.env.WHISTLEE_SWITCH_PORT,
  category: Categories.PROGRAMMABLE_SWITCH, // value here defines the symbol shown in the pairing screen
});

const log = (...args) => console.log(new Date().toString(), "|", ...args);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
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
      callbacks[name]();
      return;
    }

    log(payload);
  });
  await page.goto(HEADLESS_URL);
})();
