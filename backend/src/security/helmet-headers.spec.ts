import helmet from "helmet";
import * as request from "supertest";

// Jest/CommonJS: default export von express zuverlässig als Funktion
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require("express") as typeof import("express");

/** Spiegelt die Helmet-Konfiguration aus main.ts (ohne vollständigen Nest-Bootstrap). */
describe("Helmet (HTTP-Header)", () => {
  it("setzt X-Content-Type-Options: nosniff", async () => {
    const app = express();
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      }),
    );
    app.get("/", (_req: import("express").Request, res: import("express").Response) => {
      res.json({ ok: true });
    });
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
