import { z } from "zod";

export const ImageAttachmentSchema = z.object({
  url: z.string().regex(/^\/api\/media\/[0-9a-f-]+$/),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]),
  fileName: z.string().trim().min(1).max(160),
});

export type ImageAttachment = z.infer<typeof ImageAttachmentSchema>;
