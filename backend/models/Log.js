// backend/models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        game: { type: String, required: true, trim: true },
        date: { type: String, required: true, trim: true }, // YYYY-MM-DD (문자열)
        result: { type: String, required: true, trim: true },
        notes: { type: String, trim: true },
        image: {
            key: { type: String, trim: true },
            url: { type: String, trim: true },
        },
        isPublic: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// ✅ 검색용 텍스트 인덱스 (game / result / notes)
logSchema.index({ game: "text", result: "text", notes: "text" });
// ✅ 목록 정렬용 인덱스
logSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Log", logSchema);
