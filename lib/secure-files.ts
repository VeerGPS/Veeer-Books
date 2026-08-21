import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

export { calculateSubmissionCompleteness } from "@/lib/completeness";

export const UPLOAD_ROOT =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export const MAX_FILE_SIZE_BYTES = 2048 * 1024 * 1024; // 2GB buffer ceiling

export const ALLOWED_MANUSCRIPT_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".epub",
  ".txt",
  ".rtf",
];

export const ALLOWED_COVER_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

export function isAllowedManuscript(filename: string): boolean {
  const ext = path.extname(filename || "").toLowerCase();
  return ALLOWED_MANUSCRIPT_EXTENSIONS.includes(ext);
}

export function isAllowedCover(filename: string): boolean {
  const ext = path.extname(filename || "").toLowerCase();
  return ALLOWED_COVER_EXTENSIONS.includes(ext);
}

export async function saveSecureFile({
  file,
  folder,
  prefix = "file",
}: {
  file: File;
  folder: "manuscripts" | "covers" | "readers" | "books" | "profiles";
  prefix?: string;
}): Promise<{
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const rawExt = path.extname(file.name || "").toLowerCase();
  const safeExt = rawExt && rawExt.length <= 8 ? rawExt : ".bin";
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40);
  const uniqueName = `${safePrefix}-${Date.now()}-${randomUUID().slice(0, 8)}${safeExt}`;

  const targetDir = path.join(UPLOAD_ROOT, folder);
  await mkdir(targetDir, { recursive: true });

  const absoluteFilePath = path.join(targetDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absoluteFilePath, buffer);

  const storagePath = `${folder}/${uniqueName}`;

  return {
    originalName: file.name,
    storagePath,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  };
}
