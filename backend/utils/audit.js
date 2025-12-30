import DeletionLog from "../models/DeletionLog.js";

const buildLogSnapshot = (log) => ({
    game: log?.game || "",
    date: log?.date || "",
    result: log?.result || "",
    isPublic: !!log?.isPublic,
    likes: log?.likes || 0,
    notesPreview: typeof log?.notes === "string" ? log.notes.slice(0, 200) : "",
});

const buildUserSnapshot = (user) => ({
    username: user?.username || "",
    role: user?.role || "",
});

export const recordDeletion = async ({ actorId, actorRole, targetType, target, meta }) => {
    try {
        const snapshot =
            targetType === "log"
                ? buildLogSnapshot(target)
                : targetType === "user"
                ? buildUserSnapshot(target)
                : undefined;

        await DeletionLog.create({
            actorId,
            actorRole: actorRole || "user",
            targetType,
            targetId: target?._id,
            snapshot,
            meta,
        });
    } catch {
        // Avoid blocking delete on audit failure.
    }
};
