import jwt from "jsonwebtoken";

// ✅ 로그인 사용자만 접근
export const protect = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "인증 토큰이 없습니다" });
    }

    const token = auth.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError")
            return res.status(401).json({ message: "토큰이 만료되었습니다" });
        res.status(401).json({ message: "유효하지 않은 토큰입니다" });
    }
};

// ✅ 관리자 전용
export const adminOnly = (req, res, next) => {
    if (req.user?.role === "admin") return next();
    res.status(403).json({ message: "관리자만 접근할 수 있습니다" });
};
