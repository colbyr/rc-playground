import {
  Accessory,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicValue,
  Service,
  uuid,
} from "hap-nodejs";

export {};

const accessoryId = uuid.generate("com.colbyr.test-light");
const light = new Accessory("Colby's cool light bulb", accessoryId);
const lightService = new Service.Lightbulb("Test Bulb");

const state = {
  on: false as CharacteristicValue,
  brightness: 100 as CharacteristicValue,
};

const onCharacteristic = lightService.getCharacteristic(Characteristic.On);
const brightnessCharacteristic = lightService.getCharacteristic(
  Characteristic.Brightness
);

onCharacteristic.on(CharacteristicEventTypes.GET, (callback) => {
  console.log("Queried current light state: " + state.on);
  callback(undefined, state.on);
});
onCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
  console.log("Setting light state to: " + value);
  state.on = value;
  callback();
});

brightnessCharacteristic.on(CharacteristicEventTypes.GET, (callback) => {
  console.log("Queried current brightness level: " + state.brightness);
  callback(undefined, state.brightness);
});
brightnessCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
  console.log("Setting brightness level to: " + value);
  state.brightness = value;
  callback();
});

light.addService(lightService);

light.publish({
  username: "17:51:07:F4:BC:8A",
  pincode: "678-90-876",
  port: 47129,
  category: Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
});

console.log("Accessory setup finished!");
