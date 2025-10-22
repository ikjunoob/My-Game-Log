// backend/models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        game: { type: String, required: true, trim: true },
        date: { type: String, required: true, trim: true },
        result: { type: String, required: true, trim: true },
        notes: { type: String, trim: true },

        // S3 메타 (단일 이미지 기준)
        image: {
            key: { type: String, trim: true },
            url: { type: String, trim: true }, // 퍼블릭 버킷이면 이걸 그대로 <img src>로 사용
        },

        isPublic: { type: Boolean, default: true }, // 공개 피드 노출 여부
    },
    { timestamps: true }
);

export default mongoose.model("Log", logSchema);

