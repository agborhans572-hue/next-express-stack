import app from "../artifacts/api-server/src/app";

// Vercel invokes this catch-all function for every /api/* request. The Express
// application is exported instead of starting a listener so the platform owns
// the request lifecycle and can reuse warm instances safely.
export default app;
