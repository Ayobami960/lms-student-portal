import pino from "pino";
import { env } from "../config/env";

// 1. Conditionally build your options configuration
const options: pino.LoggerOptions = {
  level: env.isProduction ? "info" : "debug",
};

// 2. Conditionally pass the stream parameter based on the environment
export const logger = env.isProduction
  ? pino(options)
  : pino(
      options,
      // Pass the module stream dynamically to bypass Bun's worker thread string bug
      require("pino-pretty")({
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      })
    );
