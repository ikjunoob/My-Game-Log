import mongoose from "mongoose";

// 삭제 이력 최소 기록.
const deletionLogSchema = new mongoose.Schema(
    {
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        actorRole: { type: String, default: "user" },
        targetType: { type: String, enum: ["log", "user"], required: true },
        targetId: { type: mongoose.Schema.Types.ObjectId },
        snapshot: { type: mongoose.Schema.Types.Mixed },
        meta: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

export default mongoose.model("DeletionLog", deletionLogSchema);
