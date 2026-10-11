// Opt-in, local-only object store for the shipment lifecycle browser regression.
// This fixture exercises uploads and downloads; it does not validate S3 signatures.
import { createServer } from "node:http";
import { createHash } from "node:crypto";

const objects = new Map();
const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://127.0.0.1").pathname;
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "*");
  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }
  if (path === "/healthz") {
    response.end("ready");
    return;
  }
  if (request.method === "PUT") {
    const chunks = [];
    let length = 0;
    for await (const chunk of request) {
      length += chunk.length;
      if (length > 10 * 1024 * 1024) {
        response.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const etag = `"${createHash("md5").update(body).digest("hex")}"`;
    objects.set(path, { body, etag, type: request.headers["content-type"] });
    response.setHeader("ETag", etag);
    response.writeHead(200).end();
    return;
  }
  const object = objects.get(path);
  if (object && ["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Content-Length", object.body.length);
    response.setHeader(
      "Content-Type",
      object.type ?? "application/octet-stream",
    );
    response.setHeader("ETag", object.etag);
    response
      .writeHead(200)
      .end(request.method === "HEAD" ? undefined : object.body);
    return;
  }
  response.writeHead(404).end();
});
server.listen(9214, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close());
