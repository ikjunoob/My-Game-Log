import express from "express";
import { presignPut } from "../src/s3.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE || "";

router.post("/presign", protect, async (req, res) => {
    try {
        const { filename, contentType } = req.body;
        if (!filename || !contentType)
            return res.status(400).json({ message: "filename, contentType 필요" });
        if (!ALLOWED_MIMES.has(contentType))
            return res.status(400).json({ message: "이미지 파일만 허용" });

        const safeName = filename.replace(/[\\/:*?"<>|]/g, "");
        const key = `${req.user.id}/${Date.now()}-${safeName}`;
        const uploadUrl = await presignPut(key, contentType, 300);
        const viewUrl = PUBLIC_BASE ? `${PUBLIC_BASE}/${encodeURI(key)}` : null;

        res.json({ key, uploadUrl, viewUrl });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
