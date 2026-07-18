import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./config/db";
import { storage } from "./config/storage";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app: Application = express();

// Middleware => security, parsing, etc.
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

// Static file serving for locally-stored uploads (avatars, submissions, certificates)
app.use("/uploads", express.static(storage.uploadDir));

// Routes
app.use("/api/v1", routes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the backend!");
});

// 404 + global error handler
app.use(notFoundHandler);
app.use(errorHandler);

const isVercelRuntime = process.env.VERCEL === "1";

// Persistent process entry point for standalone development execution
if (!isVercelRuntime) {
  async function main() {
    await prisma.$connect();
    app.listen(env.port, () => {
      logger.info("========================================");
      logger.info("🚀 Server is running successfully!");
      logger.info(`LMS API listening on port ${env.port} [${env.nodeEnv}]`);
      logger.info("========================================");
    });
  }

  main().catch((err) => {
    logger.error({ err }, "Failed to start server process");
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default app;