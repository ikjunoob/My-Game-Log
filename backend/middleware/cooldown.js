const DEFAULT_WINDOW_MS = 10 * 1000;

const bucket = new Map();

const getKey = (req, keyFn) => {
    try {
        return keyFn ? keyFn(req) : req.ip;
    } catch {
        return req.ip;
    }
};

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
