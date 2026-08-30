import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const archivePath = path.join("/home/user", "tianshiqiao-source.zip");
  const file = await readFile(archivePath);

  return new Response(file, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="tianshiqiao-source.zip"',
      "Cache-Control": "no-store",
    },
  });
}
