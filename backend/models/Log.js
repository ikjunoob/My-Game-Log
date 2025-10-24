import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        game: { type: String, required: true, trim: true },
        date: { type: String, required: true, trim: true },
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

export default mongoose.model("Log", logSchema);
