import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({
  host: "0.0.0.0",
  port
});
