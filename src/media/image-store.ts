import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ImageAttachmentSchema, type ImageAttachment } from "./contracts";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export interface ImageStore {
  save(file: File): Promise<ImageAttachment>;
  read(id: string): Promise<{ bytes: Uint8Array; attachment: ImageAttachment }>;
}

export class FileSystemImageStore implements ImageStore {
  constructor(private readonly rootDirectory: string) {}

  async save(file: File): Promise<ImageAttachment> {
    if (!allowedMimeTypes.has(file.type)) {
      throw new Error("unsupported image type");
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      throw new Error("image must be between 1 byte and 8 MB");
    }
    const id = randomUUID();
    const attachment = ImageAttachmentSchema.parse({
      url: `/api/media/${id}`,
      mimeType: file.type,
      fileName: file.name || "image",
    });
    await mkdir(this.rootDirectory, { recursive: true });
    await Promise.all([
      writeFile(resolve(this.rootDirectory, `${id}.bin`), new Uint8Array(await file.arrayBuffer())),
      writeFile(resolve(this.rootDirectory, `${id}.json`), JSON.stringify(attachment)),
    ]);
    return attachment;
  }

  async read(id: string) {
    if (!/^[0-9a-f-]+$/.test(id)) throw new Error("image not found");
    const [bytes, metadata] = await Promise.all([
      readFile(resolve(this.rootDirectory, `${id}.bin`)),
      readFile(resolve(this.rootDirectory, `${id}.json`), "utf8"),
    ]);
    return {
      bytes: new Uint8Array(bytes),
      attachment: ImageAttachmentSchema.parse(JSON.parse(metadata)),
    };
  }
}
