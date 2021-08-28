require("dotenv").config();

import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import PackageJson from "./package.json";

// https://vitejs.dev/config/
export default (options) => {
  var HUE_BRIDGE_ADDRESS = process.env.HUE_BRIDGE_ADDRESS;
  var HUE_USER_ID = process.env.HUE_USER_ID;
  var hueBridgeUrl = `http://${HUE_BRIDGE_ADDRESS}`;

  var entryPoints = {
    main: resolve(__dirname, "index.html"),
    ...PackageJson.publishedPages.reduce((entryPoints, pageName) => {
      entryPoints[pageName] = resolve(__dirname, `${pageName}/index.html`);
      return entryPoints;
    }, {}),
  };

  return defineConfig({
    build: {
      rollupOptions: {
        input: entryPoints,
      },
    },
    plugins: [reactRefresh()],
    server: {
      proxy: {
        "^/hue-api/?.*": {
          target: hueBridgeUrl,
          changeOrigin: true,
          rewrite: (originalPath) => {
            var path = originalPath.replace(
              /^\/hue-api\/?/,
              `/api/${HUE_USER_ID}/`
            );
            var fullUrl = `${hueBridgeUrl}${path}`;
            return fullUrl;
          },
        },
      },
    },
  });
};
