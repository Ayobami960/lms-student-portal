import dotenv from "dotenv";
dotenv.config();

function getRequired(name: string): string {
  const value = process.env[name];
  // Only throw an error if we are running in production/Vercel
  if (!value && (process.env.NODE_ENV === "production" || process.env.VERCEL === "1")) {
    throw new Error(`❌ Missing mandatory environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  // Safe default for local development, but strictly enforced on Vercel
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/lms_platform",
  
  // Enforce these strictly on production
  jwtAccessSecret: getRequired("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getRequired("JWT_REFRESH_SECRET"),
  
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  storageApiKey: process.env.STORAGE_API_KEY ?? "",
  storageApiSecret: process.env.STORAGE_API_SECRET ?? "",
  storageBucket: process.env.STORAGE_BUCKET ?? "lms-uploads",
  aiProvider: process.env.AI_PROVIDER ?? "mock",
  aiApiKey: process.env.AI_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
};
