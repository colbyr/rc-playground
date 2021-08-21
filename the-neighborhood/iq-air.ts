require("dotenv").config();

// here's a fake temperature sensor device that we'll expose to HomeKit
import {
  Accessory,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicValue,
  NodeCallback,
  Service,
  uuid,
} from "hap-nodejs";
import { throttle } from "lodash";
import fetch from "node-fetch";

const FAKE_SENSOR = {
  aqi: 0,
  currentTemperature: 50,
};

const updateAirInfo = throttle(() => {
  const url = new URL("http://api.airvisual.com/v2/city");
  url.search = new URLSearchParams({
    key: process.env.IQ_AIR_API_KEY,
    country: "USA",
    state: "Massachusetts",
    city: "Boston",
  }).toString();
  return fetch(url, { method: "GET" })
    .then((response) => response.json())
    .then(({ status, data }) => {
      if (status !== "success") {
        throw new Error("AQ fetch failed!");
      }

      const tempC = data.current.weather.tp as number;
      const tempF = (9 * tempC + 32 * 5) / 5;
      FAKE_SENSOR.currentTemperature = tempC;
      console.info(`updated temperature to ${tempC}°C (${tempF}°F)`);

      const aqi = data.current.pollution.aqius as number;
      const simpleAqi =
        aqi <= 50 ? 1 : aqi <= 100 ? 2 : aqi <= 150 ? 3 : aqi <= 200 ? 4 : 5;
      FAKE_SENSOR.aqi = simpleAqi;
      console.info(`updated Air Quality to ${simpleAqi}`);

      return data;
    })
    .catch(console.error);
}, 600_000);

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
const sensorUUID = uuid.generate("com.colbyr.boston.iq-air");

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
const BostonAirSensor = new Accessory("IQ Air", sensorUUID);

export { BostonAirSensor };

// Add the actual TemperatureSensor Service.
BostonAirSensor.addService(Service.TemperatureSensor)!
  .getCharacteristic(Characteristic.CurrentTemperature)!
  .on(
    CharacteristicEventTypes.GET,
    (callback: NodeCallback<CharacteristicValue>) => {
      // return our current value
      updateAirInfo().then(() => {
        callback(null, FAKE_SENSOR.currentTemperature);
      });
    }
  );

BostonAirSensor.addService(Service.AirQualitySensor)!
  .getCharacteristic(Characteristic.AirQuality)!
  .on(
    CharacteristicEventTypes.GET,
    (callback: NodeCallback<CharacteristicValue>) => {
      updateAirInfo().then(() => {
        callback(null, FAKE_SENSOR.aqi);
      });
    }
  );

updateAirInfo().then(() => {
  BostonAirSensor.getService(Service.TemperatureSensor)!.setCharacteristic(
    Characteristic.CurrentTemperature,
    FAKE_SENSOR.currentTemperature
  );
});

// randomize our temperature reading every 3 seconds
setInterval(
  function () {
    updateAirInfo().then(() => {
      // update the characteristic value so interested iOS devices can get notified
      BostonAirSensor.getService(Service.TemperatureSensor)!.setCharacteristic(
        Characteristic.CurrentTemperature,
        FAKE_SENSOR.currentTemperature
      );
    });
  },
  600_000 // 15 minutes
);

BostonAirSensor.publish({
  username: "C3:5D:3A:AE:5E:FA",
  pincode: "231-45-154",
  port: 40002,
  category: Categories.SENSOR,
});
