import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import path from "node:path";
import pino from "pino";

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

let _rootLogger: pino.Logger | null = null;

export function initLogger(options?: { logDir?: string }): void {
  const level = process.env.LOG_LEVEL || "info";
  const loggerOptions: pino.LoggerOptions = {
    level,
    mixin() {
      const store = requestContext.getStore();
      return store ? { reqId: store.requestId } : { reqId: "-" };
    }
  };

  if (process.env.VERCEL === "1") {
    _rootLogger = pino(loggerOptions);
    return;
  }

  const targets: pino.TransportTargetOptions[] = [
    {
      target: "pino-pretty",
      level: "info",
      options: {
        colorize: true,
        singleLine: true,
        translateTime: false,
        ignore: "pid,hostname,time,req,res,reqId,responseTime,module",
        messageFormat: "[{module}] [{reqId}] {msg}"
      }
    }
  ];

  if (options?.logDir) {
    targets.push({
      target: "pino-roll",
      level: "debug",
      options: {
        file: path.join(options.logDir, "app.log"),
        frequency: "daily",
        dateFormat: "yyyy-MM-dd",
        mkdir: true
      }
    });
  }

  const transport = pino.transport({ targets });
  transport.on("error", (err: Error) => {
    console.error("Logger transport error:", err.message);
  });
  _rootLogger = pino(
    loggerOptions,
    transport
  );
}

export function createLogger(module: string): pino.Logger {
  if (!_rootLogger) {
    initLogger();
  }
  return _rootLogger!.child({ module });
}

export function getRootLogger(): pino.Logger {
  if (!_rootLogger) {
    initLogger();
  }
  return _rootLogger!;
}

export function randomReqId(): string {
  return crypto.randomUUID().slice(0, 8);
}
