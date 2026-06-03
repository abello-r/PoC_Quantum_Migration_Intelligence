import cors from "@fastify/cors";
import Fastify from "fastify";
import { prisma } from "./lib/prisma.js";
import { registerScanRoutes } from "./routes/scanRoutes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });

  app.get("/health", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      service: "backend"
    };
  });

  app.get("/api/health", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      service: "api"
    };
  });

  app.register(registerScanRoutes, {
    prefix: "/api"
  });

  return app;
}
