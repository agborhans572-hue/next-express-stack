// The application source is bundled during `vercel-build` before Vercel traces
// this function. Importing the generated ESM bundle avoids Vercel applying its
// NodeNext TypeScript defaults to the workspace's bundler-mode source tree.
export { default } from "../artifacts/api-server/dist/vercel.mjs";
