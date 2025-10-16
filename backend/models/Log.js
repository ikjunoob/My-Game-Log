import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
    game: { type: String, required: true },
    date: { type: String, required: true },
    result: { type: String, required: true },
    notes: { type: String },
    imageUrl: { type: String }
});

export default mongoose.model("Log", logSchema);
