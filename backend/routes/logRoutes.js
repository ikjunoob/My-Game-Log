import express from "express";
import multer from "multer";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// 기록 추가
router.post("/", protect, upload.single("image"), async (req, res) => {
    try {
        const newLog = await Log.create({
            game: req.body.game,
            date: req.body.date,
            result: req.body.result,
            notes: req.body.notes,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null
        });
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 전체 기록 조회
router.get("/", protect, async (req, res) => {
    const logs = await Log.find();
    res.json(logs);
});

// 수정
router.patch("/:id", protect, async (req, res) => {
    const updated = await Log.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

// 삭제
router.delete("/:id", protect, async (req, res) => {
    await Log.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
});

export default router;
