// 짧은 시간 내 반복 요청을 막는 간단한 쿨다운.
const DEFAULT_WINDOW_MS = 10 * 1000;

const bucket = new Map();

const getKey = (req, keyFn) => {
    try {
        return keyFn ? keyFn(req) : req.ip;
    } catch {
        return req.ip;
    }
};

// 일정 시간 내 요청을 차단하는 미들웨어.
export const cooldown = (options = {}) => {
    const { windowMs = DEFAULT_WINDOW_MS, keyFn, message } = options;
    return (req, res, next) => {
        const key = getKey(req, keyFn);
        const now = Date.now();
        const last = bucket.get(key) || 0;

        if (now - last < windowMs) {
            return res.status(429).json({
                message: message || "Too many requests. Please slow down.",
            });
        }

        bucket.set(key, now);
        next();
    };
};
