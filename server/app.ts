import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { logger } from "./utils/logger";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { storage } from "./config/storage";
import routes from "./routes";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

// Static file serving for locally-stored uploads (avatars, submissions, certificates)
app.use("/uploads", express.static(storage.uploadDir));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
