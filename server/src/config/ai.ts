export const aiConfig = {
  provider: process.env.AI_PROVIDER ?? "mock",
  apiKey: process.env.AI_API_KEY,
  isMock: (process.env.AI_PROVIDER ?? "mock") === "mock" || !process.env.AI_API_KEY,
};