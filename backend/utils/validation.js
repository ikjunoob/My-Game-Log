export const trimString = (value, maxLength) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (typeof maxLength === "number" && maxLength > 0) {
        return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
    }
    return trimmed;
};

export const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const normalizePagination = (page, size, defaults = {}) => {
    const { defaultSize = 10, maxSize = 50 } = defaults;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.min(
        maxSize,
        Math.max(1, parseInt(size, 10) || defaultSize)
    );
    return { page: pageNum, size: sizeNum };
};

export const coerceBoolean = (value, fallback) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        if (value.toLowerCase() === "true") return true;
        if (value.toLowerCase() === "false") return false;
    }
    return fallback;
};
