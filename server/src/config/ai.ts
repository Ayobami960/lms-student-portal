import { env } from "./env";

export const aiConfig = {
  provider: env.aiProvider,
  apiKey: env.aiApiKey,
  isMock: env.aiProvider === "mock" || !env.aiApiKey,
};
