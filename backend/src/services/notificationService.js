import Notification from "../models/Notification.js";

export const createNotification = async ({ userId, type, title, message = "", resourceType = "", resourceId = "", dedupeKey = "" }) => {
  try {
    if (dedupeKey) {
      return await Notification.findOneAndUpdate(
        { userId, dedupeKey },
        { $setOnInsert: { userId, type, title, message, resourceType, resourceId, read: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
    }
    return await Notification.create({ userId, type, title, message, resourceType, resourceId });
  } catch (error) {
    // Notifications enrich the workspace and must never interrupt a primary action.
    if (error?.code !== 11000) console.warn("[Notifications] Unable to create notification", error?.message);
    return null;
  }
};
