import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { BookModel } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Types } from "mongoose";

export const runtime = "nodejs";

const MAX_HTML_CONTENT_BYTES = 1024 * 1024;
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

function sanitizeReaderHtml(html: string) {
  if (!html) return html;
  let s = String(html);
  s = s.replace(/<div[^>]*id=["']?toolbar["']?[^>]*>[\s\S]*?<\/div>/gi, "");
  s = s.replace(/<div[^>]*id=["']?thumb-strip["']?[^>]*>[\s\S]*?<\/div>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/ on[a-zA-Z]+=(\"[^\"]*\"|\'[^\']*\'|[^\s>]+)/gi, "");
  return s;
}

async function persistHtmlContent(htmlContent: string, slug: string) {
  if (!htmlContent || htmlContent.startsWith("/api/uploads/")) {
    return htmlContent;
  }

  const maybeSanitized = sanitizeReaderHtml(htmlContent);
  const sizeInBytes = Buffer.byteLength(maybeSanitized, "utf8");
  if (sizeInBytes <= MAX_HTML_CONTENT_BYTES) {
    return maybeSanitized;
  }

  const htmlDir = path.join(UPLOAD_ROOT, "html");
  await mkdir(htmlDir, { recursive: true });

  const safeFileName = `${slug || randomUUID()}-${Date.now()}.html`;
  const filePath = path.join(htmlDir, safeFileName);
  await writeFile(filePath, maybeSanitized, "utf8");
  return `/api/uploads/html/${safeFileName}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const books = await BookModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Admin list books error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, any> = {};
    let formData: FormData | null = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await req.formData();
      body = Object.fromEntries(formData.entries());

      const readerFile = formData.get("readerFile") as File | null;
      if (!body.htmlContent && readerFile) {
        try {
          body.htmlContent = await readerFile.text();
        } catch (error) {
          console.error("Unable to read uploaded reader HTML file:", error);
          return NextResponse.json({ error: "Invalid reader HTML file" }, { status: 400 });
        }
      }
    } else {
      const rawBody = await req.text();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch (error) {
          console.error("Invalid admin book JSON payload:", error);
          return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
        }
      }
    }

    const {
      title,
      author,
      slug,
      actualPrice,
      sellingPrice,
      description,
      htmlContent,
      color,
      accent,
      genre,
      pages,
      cover,
      reader,
      pdf,
      highlights,
      coverFileName,
      pdfFileName,
      readerFileName,
    } = body;

    if (!title || !author || !description || !htmlContent) {
      return NextResponse.json({ error: "Missing required fields (title, author, description, htmlContent)" }, { status: 400 });
    }

    const safeSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await BookModel.findOne({ slug: safeSlug });
    if (existing) {
      return NextResponse.json({ error: "A book with this slug already exists" }, { status: 400 });
    }

    const latestBook = await BookModel.findOne({}).sort({ id: -1 }).lean();
    const nextId = (latestBook?.id ?? 0) + 1;
    const price = Number(sellingPrice || actualPrice || 0);
    const actual = Number(actualPrice || price || 0);
    if (!price || price <= 0) {
      return NextResponse.json({ error: "Selling price / actual price must be greater than ₹0" }, { status: 400 });
    }

    const persistedHtmlContent = await persistHtmlContent(String(htmlContent || ""), safeSlug);

    const uploadFile = async (file: File | null, folder: string, fallbackPath: string) => {
      if (!file) {
        return fallbackPath && fallbackPath !== "/images/default-book.png" ? fallbackPath : (folder === "covers" ? "/images/default-book.svg" : fallbackPath);
      }

      const ext = path.extname(file.name || "") || ".bin";
      const fileName = `${safeSlug || randomUUID()}-${Date.now()}${ext}`;
      const uploadDir = path.join(UPLOAD_ROOT, folder);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      if (folder === "readers" || path.extname(file.name || "").toLowerCase() === ".html") {
        const text = fileBuffer.toString("utf8");
        const sanitized = sanitizeReaderHtml(text);
        await writeFile(filePath, sanitized, "utf8");
      } else {
        await writeFile(filePath, fileBuffer);
      }
      return `/api/uploads/${folder}/${fileName}`;
    };

    const coverFile = formData?.get("coverFile") as File | null;
    const pdfFile = formData?.get("pdfFile") as File | null;
    const readerFile = formData?.get("readerFile") as File | null;

    const coverPath = await uploadFile(coverFile, "covers", cover || coverFileName || "/images/default-book.svg");
    const pdfPath = await uploadFile(pdfFile, "books", pdf || pdfFileName || "/books/default-book.pdf");
    const readerPath = await uploadFile(readerFile, "readers", reader || readerFileName || "/readers/default-reader.html");

    const book = await BookModel.create({
      id: nextId,
      title,
      author,
      slug: safeSlug,
      actualPrice: actual,
      sellingPrice: price,
      price,
      description,
      htmlContent: persistedHtmlContent,
      color: color || "#2c3e50",
      accent: accent || "#1a252f",
      genre: genre || "General",
      pages: Number(pages || 0),
      cover: coverPath,
      reader: readerPath,
      pdf: pdfPath,
      highlights: Array.isArray(highlights) ? highlights : [],
      isActive: true,
    });

    return NextResponse.json({ book, message: "Book added successfully" });
  } catch (error) {
    console.error("Admin create book error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save book" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, any> = {};
    let formData: FormData | null = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      const readerFile = formData.get("readerFile") as File | null;
      if (!body.htmlContent && readerFile) {
        try {
          body.htmlContent = await readerFile.text();
        } catch {
          /* ignore */
        }
      }
    } else {
      const rawBody = await req.text();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          /* ignore */
        }
      }
    }

    const {
      id,
      title,
      author,
      slug,
      actualPrice,
      sellingPrice,
      description,
      htmlContent,
      genre,
      pages,
      color,
      accent,
      isActive,
      cover,
      reader,
      pdf,
    } = body;

    if (!id || !title || !author || !description) {
      return NextResponse.json({ error: "Missing required book data (id, title, author, description)" }, { status: 400 });
    }

    const safeSlug = String(slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const price = Number(sellingPrice || actualPrice || 0);
    const actual = Number(actualPrice || price || 0);

    if (!safeSlug || price <= 0) {
      return NextResponse.json({ error: "Selling price / actual price must be greater than ₹0" }, { status: 400 });
    }

    const findQuery = Types.ObjectId.isValid(String(id))
      ? { _id: id }
      : { id: Number(id) };

    const duplicateQuery = Types.ObjectId.isValid(String(id))
      ? { slug: safeSlug, _id: { $ne: id } }
      : { slug: safeSlug, id: { $ne: Number(id) } };

    const duplicate = await BookModel.findOne(duplicateQuery).lean();
    if (duplicate) {
      return NextResponse.json({ error: "Another book already uses this slug" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      title,
      author,
      slug: safeSlug,
      actualPrice: actual,
      sellingPrice: price,
      price,
      description,
      genre: genre || "General",
      pages: Number(pages || 0),
      color: color || "#2c3e50",
      accent: accent || "#1a252f",
      isActive: isActive !== "false" && isActive !== false,
    };

    if (typeof htmlContent === "string" && htmlContent.trim()) {
      updates.htmlContent = await persistHtmlContent(htmlContent, safeSlug);
    }

    const uploadFile = async (file: File | null, folder: string, existingPath?: string) => {
      if (!file) return existingPath;
      const ext = path.extname(file.name || "") || ".bin";
      const fileName = `${safeSlug || randomUUID()}-${Date.now()}${ext}`;
      const uploadDir = path.join(UPLOAD_ROOT, folder);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      if (folder === "readers" || path.extname(file.name || "").toLowerCase() === ".html") {
        const text = fileBuffer.toString("utf8");
        const sanitized = sanitizeReaderHtml(text);
        await writeFile(filePath, sanitized, "utf8");
      } else {
        await writeFile(filePath, fileBuffer);
      }
      return `/api/uploads/${folder}/${fileName}`;
    };

    if (formData) {
      const coverFile = formData.get("coverFile") as File | null;
      const pdfFile = formData.get("pdfFile") as File | null;
      const readerFile = formData.get("readerFile") as File | null;

      if (coverFile) updates.cover = await uploadFile(coverFile, "covers", cover as string);
      if (pdfFile) updates.pdf = await uploadFile(pdfFile, "books", pdf as string);
      if (readerFile) updates.reader = await uploadFile(readerFile, "readers", reader as string);
    } else {
      if (cover) updates.cover = cover as string;
      if (reader) updates.reader = reader as string;
      if (pdf) updates.pdf = pdf as string;
    }

    const book = await BookModel.findOneAndUpdate(findQuery, updates, { new: true, runValidators: true });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ book, message: "Book updated successfully" });
  } catch (error) {
    console.error("Admin update book error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update book" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    await connectDB();
    const findQuery = Types.ObjectId.isValid(String(id))
      ? { _id: id }
      : { id: Number(id) };

    const book = await BookModel.findOneAndDelete(findQuery);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Admin delete book error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete book" }, { status: 500 });
  }
}
