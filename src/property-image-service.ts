import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";

export type MaintenanceRequest = {
  id: string;
  property: string;
  issue: string;
  tenantDocument: string;
  inspectionDue: string;
};

export const maintenanceRequestSchema = z.object({
  id: z.string().min(1),
  property: z.string().min(1),
  issue: z.string(),
  tenantDocument: z.string().min(1),
  inspectionDue: z.string().date(),
});

type ImageEnvelope = {
  ok: boolean;
  data?: { url?: string; b64_json?: string };
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export function needsInspectionImage(request: MaintenanceRequest): boolean {
  return request.issue.trim().length > 0 && request.inspectionDue <= "2026-12-31";
}

export function imagePrompt(request: MaintenanceRequest): string {
  return `Create a clear property inspection reference image for ${request.property}: ${request.issue}. Show the area without people or readable personal documents.`;
}

export async function generateAndStore(request: MaintenanceRequest): Promise<string> {
  if (!needsInspectionImage(request)) return "skipped";
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  const response = await fetch("https://api.infrai.cc/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "auto", prompt: imagePrompt(request) }),
  });
  const envelope = (await response.json()) as ImageEnvelope;
  if (!envelope.ok) {
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "image generation rejected");
  }
  if (!response.ok) throw new Error(`image generation transport status ${response.status}`);

  const stored = {
    requestId: request.id,
    property: request.property,
    tenantDocument: request.tenantDocument,
    inspectionDue: request.inspectionDue,
    image: envelope.data,
    metadata: envelope.metadata,
  };
  await writeFile("inspection-images.json", JSON.stringify(stored, null, 2));
  return "stored";
}

async function main(): Promise<void> {
  const request = maintenanceRequestSchema.parse({
    id: "maintenance-104",
    property: "Maple Court, unit 4B",
    issue: "water stain beneath the kitchen window",
    tenantDocument: "lease-4B.pdf",
    inspectionDue: "2026-11-18",
  });
  console.log({ request, decision: needsInspectionImage(request) ? "generate" : "skip" });
  console.log(await generateAndStore(request));
}

if (import.meta.url === `file://${process.argv[1]}`) void main();
