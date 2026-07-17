// Minimal OpenAPI 3.0 spec covering the public shape of the API.
// Extend per-route with JSDoc annotations or a fuller spec as the API grows.
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "LMS Platform API",
    version: "1.0.0",
    description: "REST API for the AI-powered Learning Management System",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/auth/register": { post: { summary: "Register a new user", responses: { "201": { description: "Created" } } } },
    "/auth/login": { post: { summary: "Login", responses: { "200": { description: "OK" } } } },
    "/auth/me": { get: { summary: "Get current user", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/courses": {
      get: { summary: "List courses (search/filter/sort/paginate)", responses: { "200": { description: "OK" } } },
      post: { summary: "Create course (instructor/admin)", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } },
    },
    "/courses/{id}": { get: { summary: "Get course by id", responses: { "200": { description: "OK" } } } },
    "/courses/{id}/enroll": { post: { summary: "Enroll in a course (student)", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } },
    "/lessons/{id}/complete": { post: { summary: "Mark lesson complete, recalculates progress", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/assignments/{id}/submit": { post: { summary: "Submit assignment (multipart file upload)", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } },
    "/grading/submissions/{id}": { patch: { summary: "Grade a submission", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/certificates/generate": { post: { summary: "Generate certificate when course is 100% complete", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } },
    "/analytics/dashboard": { get: { summary: "Role-aware dashboard analytics", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/ai/chat": { post: { summary: "Chat with the AI learning assistant", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
  },
};
