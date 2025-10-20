import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "토큰이 주어지지 않았습니다" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "유효하지 않은 토큰입니다" });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user?.role === "admin") next();
    else res.status(403).json({ message: "접근이 거부되었습니다" });
};
