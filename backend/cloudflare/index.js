import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

export class TcmBackend extends Container {
  defaultPort = 5000;
  sleepAfter = "15m";
  envVars = {
    PORT: "5000",
    CLIENT_ORIGIN: env.CLIENT_ORIGIN || "*",
    MONGODB_URI: env.MONGODB_URI,
    JWT_SECRET: env.JWT_SECRET,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
  };
}

export default {
  async fetch(request, _env) {
    const container = getContainer(env.TCM_BACKEND_CONTAINER, "tcm-backend");
    return container.fetch(request);
  },
};
