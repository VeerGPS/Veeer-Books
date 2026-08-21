import { connectDB } from "@/lib/mongoose";
import { PublishingAuditLog } from "@/models";
import { Types } from "mongoose";

export type AuditLogPayload = {
  submissionId?: Types.ObjectId | string;
  submissionCode?: string;
  bookId?: number;
  actorUserId?: Types.ObjectId | string;
  actorRole: "admin" | "author" | "system";
  actorName: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  metadata?: Record<string, any>;
};

export async function logPublishingAudit(payload: AuditLogPayload) {
  try {
    await connectDB();
    const log = await PublishingAuditLog.create({
      submissionId: payload.submissionId ? new Types.ObjectId(payload.submissionId) : undefined,
      submissionCode: payload.submissionCode,
      bookId: payload.bookId,
      actorUserId: payload.actorUserId ? new Types.ObjectId(payload.actorUserId) : undefined,
      actorRole: payload.actorRole,
      actorName: payload.actorName,
      action: payload.action,
      previousStatus: payload.previousStatus,
      newStatus: payload.newStatus,
      notes: payload.notes || "",
      metadata: payload.metadata,
      timestamp: new Date(),
    });
    return log;
  } catch (error) {
    console.error("Failed to write publishing audit log:", error);
    return null;
  }
}
