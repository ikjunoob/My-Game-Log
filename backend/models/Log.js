// backend/models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        game: { type: String, required: true, trim: true },
        date: { type: String, required: true, trim: true }, // YYYY-MM-DD
        result: { type: String, required: true, trim: true }, // 제목/태그처럼 사용
        notes: { type: String, trim: true },                  // 내용

        image: {
            key: { type: String, trim: true },
            url: { type: String, trim: true },
        },

        isPublic: { type: Boolean, default: true },

        // 👍 좋아요
        likes: { type: Number, default: 0, index: true },
        likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// 검색 인덱스
logSchema.index({ game: "text", result: "text", notes: "text" });
logSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Log", logSchema);
