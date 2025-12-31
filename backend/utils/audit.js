import DeletionLog from "../models/DeletionLog.js";

// 전체 문서 대신 최소 정보만 저장한다.
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

// 삭제 기록은 베스트 에포트로 남기고 실패해도 삭제는 막지 않는다.
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
