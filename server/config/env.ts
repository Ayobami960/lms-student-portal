import dotenv from "dotenv";
dotenv.config();

function get(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  databaseUrl: get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lms_platform"),
  jwtAccessSecret: get("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  jwtRefreshSecret: get("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  accessTokenExpiresIn: get("ACCESS_TOKEN_EXPIRES_IN", "15m"),
  refreshTokenExpiresIn: get("REFRESH_TOKEN_EXPIRES_IN", "7d"),
  corsOrigin: get("CORS_ORIGIN", "http://localhost:3000"),
  storageProvider: get("STORAGE_PROVIDER", "local"),
  storageApiKey: get("STORAGE_API_KEY", ""),
  storageApiSecret: get("STORAGE_API_SECRET", ""),
  storageBucket: get("STORAGE_BUCKET", "lms-uploads"),
  aiProvider: get("AI_PROVIDER", "mock"),
  aiApiKey: get("AI_API_KEY", ""),
  isProduction: process.env.NODE_ENV === "production",
};
