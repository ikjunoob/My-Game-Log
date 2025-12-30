import mongoose from "mongoose";

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
