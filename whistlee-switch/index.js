const {
  Accessory,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicValue,
  NodeCallback,
  Service,
  uuid,
} = require("hap-nodejs");

const whistleeUuid = uuid.generate("colbyr.whistlee.test.v0");
const whistleeAccessory = new Accessory("Whitlee Test v0", whistleeUuid);

const onSwitchName = "One Three Five";
const switchService = new Service.StatelessProgrammableSwitch(onSwitchName);
const change = switchService.getCharacteristic(
  Characteristic.ProgrammableSwitchEvent
);
console.info(change);
change
  .on(CharacteristicEventTypes.CHANGE, (...args) => {
    console.info(CharacteristicEventTypes.CHANGE, ...args);
    // callback(1);
  })
  .on(CharacteristicEventTypes.CHARACTERISTIC_WARNING, (callback) => {
    console.info(CharacteristicEventTypes.CHARACTERISTIC_WARNING);
    callback();
  });

whistleeAccessory.addService(switchService);

setInterval(() => {
  console.info("press once");
  switchService
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .sendEventNotification(Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
}, 5000);

// setTimeout(() => {
//   console.info("press twice");
//   change.updateValue(Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS);
// }, 10000);

// setTimeout(() => {
//   console.info("press thrice");
//   change.updateValue(Characteristic.ProgrammableSwitchEvent.LONG_PRESS);
// }, 15000);

// once everything is set up, we publish the accessory. Publish should always be the last step!
whistleeAccessory.publish({
  username: "17:51:07:F4:BC:8E",
  pincode: "678-90-876",
  port: 47129,
  category: Categories.PROGRAMMABLE_SWITCH, // value here defines the symbol shown in the pairing screen
});
