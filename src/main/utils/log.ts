import path from "node:path";
import fs from "node:fs";
import pino from "pino";

let rootLogger: pino.Logger | null = null;

export function initLogger(options?: { logDir?: string; pretty?: boolean }): void {
  if (options?.logDir && !options.pretty) {
    fs.mkdirSync(options.logDir, { recursive: true });
    const destination = pino.destination({
      dest: path.join(options.logDir, "app.log"),
      sync: false
    });
    rootLogger = pino({ level: process.env.LOG_LEVEL || "info" }, destination);
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
        ignore: "pid,hostname,time,module",
        messageFormat: "[{module}] {msg}"
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
  rootLogger = pino({ level: process.env.LOG_LEVEL || "info" }, transport);
}

export function createLogger(module: string): pino.Logger {
  if (!rootLogger) initLogger();
  return rootLogger!.child({ module });
}

export function getRootLogger(): pino.Logger {
  if (!rootLogger) initLogger();
  return rootLogger!;
}
