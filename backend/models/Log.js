import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        game: { type: String, required: true, trim: true },
        date: { type: String, required: true },
        result: { type: String, required: true },
        notes: { type: String, trim: true },
        // 단일 이미지라면 imageUrl/String, 여러 장이면 배열
        image: {
            key: { type: String, trim: true },   // S3 object key
            url: { type: String, trim: true }    // 퍼블릭 URL 또는 서명 GET URL
        },
        isPublic: { type: Boolean, default: true } // 공개 여부(나중에 옵션화)
    },
    { timestamps: true } // ✅ createdAt/updatedAt 자동
);

export default mongoose.model("Log", logSchema);