import { NextRequest } from "next/server";

export async function readTextFromMultipart(req: Request, field: string): Promise<string | null> {
  // For edge/runtime limitations, rely on web FormData
  // Next.js route handlers support request.formData()
  const form = await (req as NextRequest).formData();
  const file = form.get(field);
  if (!file || typeof file === "string") return null;
  const buf = await (file as File).arrayBuffer();
  return Buffer.from(buf).toString("utf-8");
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split(",").map(c => c.trim()));
  return { headers, rows };
}
