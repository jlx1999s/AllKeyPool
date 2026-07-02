import { buildApp } from "./app.js";
import { loadConfig } from "./config/load-config.js";

const config = await loadConfig();
const app = await buildApp({ config });

try {
  await app.listen({
    host: config.server.host,
    port: config.server.port
  });
} catch (error) {
  app.log.error(error, "Failed to start KeyPool API");
  process.exit(1);
}

