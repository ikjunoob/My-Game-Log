// 개발 모드에서만 성능 측정을 기록한다.
const isDev = import.meta.env.DEV;

const getStore = () => {
    if (!isDev) return null;
    if (!window.__mglPerf) window.__mglPerf = [];
    return window.__mglPerf;
};

export const startPerf = (label) => {
    if (!isDev) return;
    performance.mark(`${label}:start`);
};

export const endPerf = (label, meta = {}) => {
    if (!isDev) return;
    const start = `${label}:start`;
    const end = `${label}:end`;
    performance.mark(end);
    try {
        performance.measure(label, start, end);
        const entries = performance.getEntriesByName(label);
        const entry = entries[entries.length - 1];
        if (entry) {
            const store = getStore();
            const record = {
                label,
                durationMs: Math.round(entry.duration * 100) / 100,
                meta,
                at: new Date().toISOString(),
            };
            store?.push(record);
            console.log("[perf]", record);
        }
    } catch { }
    performance.clearMarks(start);
    performance.clearMarks(end);
    performance.clearMeasures(label);
};
