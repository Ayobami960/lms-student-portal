import app from "../app";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { prisma } from "../config/db";

const isVercelRuntime = process.env.VERCEL === "1";


// Persistent process entry point for standalone development execution
if (!isVercelRuntime) {
  async function main() {
    await prisma.$connect();
    app.listen(env.port, () => {
      logger.info("========================================");
      logger.info("🚀 Server is running successfully!");
      logger.info(`LMS API listening on port ${env.port} [${env.nodeEnv}]`);
      logger.info(`Swagger docs available at http://localhost:${env.port}/api-docs`);
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
