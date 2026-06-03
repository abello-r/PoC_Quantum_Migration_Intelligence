import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ScanService } from "../services/scanService.js";

const scanService = new ScanService();
const repositoryScanSchema = z.object({
  repositoryUrl: z.string().url().refine((value) => value.startsWith("https://github.com/"), {
    message: "Only public GitHub repository URLs are supported in this PoC"
  })
});

export async function registerScanRoutes(app: FastifyInstance) {
  app.post("/scans", async (request, reply) => {
    const parsed = repositoryScanSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid repository URL",
        details: parsed.error.flatten()
      });
    }

    try {
      return await scanService.createRepositoryScan(parsed.data.repositoryUrl);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Repository metadata could not be loaded"
      });
    }
  });

  app.get("/scans", async () => {
    return scanService.listScans();
  });

  app.get("/scans/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const scan = await scanService.getScan(id);

    if (!scan) {
      return reply.status(404).send({
        error: "Scan not found"
      });
    }

    return scan;
  });

  app.get("/scans/:id/findings", async (request) => {
    const { id } = request.params as { id: string };

    return scanService.getFindings(id);
  });

  app.get("/scans/:id/migration-plan", async (request) => {
    const { id } = request.params as { id: string };

    return scanService.getMigrationPlan(id);
  });
}
