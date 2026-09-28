// Vercel owns the HTTP server lifecycle. Export the Express application as a
// separate bundle so the platform does not execute the long-running server
// bootstrap used by the traditional Node deployment.
export { default } from "./app";
