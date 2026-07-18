import 'dotenv/config'
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// 1. Conditionally build your options configuration
const options: pino.LoggerOptions = {
  level: isProduction ? "info" : "debug",
};

// 2. Conditionally pass the transport based on the environment
export const logger = isProduction
  ? pino(options)
  : pino(
      options,
      pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      })
    );