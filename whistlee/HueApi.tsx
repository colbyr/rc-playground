export const fetchHue = (path: any[], init?: RequestInit) => {
  if (import.meta.env.MODE !== "development") {
    return Promise.reject(new Error("Hue unavailabile in production mode"));
  }

  return fetch(`/hue-api/${path.join("/")}`, init).then((resp) => resp.json());
};

export const fetchHueLight = (lightId: number) => {
  return fetchHue(["lights", lightId]);
};
