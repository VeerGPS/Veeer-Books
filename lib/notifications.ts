import { connectDB } from "@/lib/mongoose";
import { Notification } from "@/models";
import { Types } from "mongoose";

export type InAppNotificationPayload = {
  recipientUserId: Types.ObjectId | string;
  recipientRole: "author" | "admin";
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
};

export async function createInAppNotification(payload: InAppNotificationPayload) {
  try {
    await connectDB();
    const notification = await Notification.create({
      recipientUserId: new Types.ObjectId(payload.recipientUserId),
      recipientRole: payload.recipientRole,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      metadata: payload.metadata,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
    return null;
  }
}
