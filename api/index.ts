import type { IncomingMessage, ServerResponse } from "node:http";

import { app, initializeBackend } from "../apps/backend/src/index.js";
import { createLogger, initLogger } from "../apps/backend/src/utils/log.js";

initLogger();

const log = createLogger("Vercel");

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await initializeBackend();
    app(req, res);
  } catch (error) {
    log.error({ err: error }, "Failed to handle Vercel request");
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
    }
    res.end(JSON.stringify({ error: "Backend initialization failed" }));
  }
}
