import "dotenv/config";
import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
// import pinoHttp from "pino-http";

import { logger } from "./utils/logger.js";
// import { storage } from "./config/storage.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app: Application = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const NODE_ENV = process.env.NODE_ENV ?? "development";

// Middleware => security, parsing, etc.
app.use(helmet());                                                                                                                                                                                                                                                                                                                                                                                                        
app.options(/.*/, cors({ origin: true, credentials: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(pinoHttp({ logger }));
app.use(generalLimiter);

// Static file serving for locally-stored uploads (avatars, submissions, certificates)
// app.use("/uploads", express.static(storage.uploadDir));

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});

// Routes
app.use("/api/v1", routes);

// 404 + global error handler
app.use(notFoundHandler);
app.use(errorHandler);

const isVercelRuntime = process.env.VERCEL === "1";

// Persistent process entry point for standalone development execution
if (!isVercelRuntime) {
  app.listen(PORT, async () => {
    logger.info("========================================");
    logger.info("🚀 Server is running successfully!");
    logger.info(`LMS API listening on port ${PORT} [${NODE_ENV}]`);
    logger.info("========================================");

    // Lazy import so dotenv/config has fully loaded env vars first
    const { prisma } = await import("./config/db.js");
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info("✅ Database connected successfully");
    } catch (err: any) {
      logger.error({ err }, "❌ DB connection failed");
    }
  });

  process.on("SIGINT", async () => {
    const { prisma } = await import("./config/db.js");
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default app;
