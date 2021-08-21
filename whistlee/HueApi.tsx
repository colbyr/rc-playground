let didWarnAboutProd = false;

export const fetchHue = (path: any[], init?: RequestInit) => {
  // @ts-expect-error this works in vite dont worry
  if (import.meta.env.MODE === "development") {
    return fetch(`/hue-api/${path.join("/")}`, init).then((resp) =>
      resp.json()
    );
  }

  if (!didWarnAboutProd) {
    didWarnAboutProd = true;
    console.warn("hue unavailable in prod");
  }

  return Promise.resolve([{ error: "hue unavailable in prod" }]);
};

export const getHueLight = (lightId: number) => {
  return fetchHue(["lights", lightId]);
};

export const setHueLightState = (lightId: number, nextState = {}) => {
  return fetchHue(["lights", lightId, "state"], {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nextState),
  });
};
