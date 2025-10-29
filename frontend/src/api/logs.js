// src/api/logs.js
import api from "./axios";

export const listLogs = async () => (await api.get("/api/logs")).data;
export const createLog = async (body) => (await api.post("/api/logs", body)).data;
export const updateLog = async (id, body) => (await api.patch(`/api/logs/${id}`, body)).data;
export const deleteLog = async (id) => (await api.delete(`/api/logs/${id}`)).data;

// 공개 피드
export const listPublicFeed = async () => (await api.get("/api/logs/public/feed")).data;

// ✅ 내 로그 검색
export const searchMyLogs = async ({ q, from, to } = {}) => {
    const p = new URLSearchParams();
    if (q) p.append("q", q);
    if (from) p.append("from", from);
    if (to) p.append("to", to);
    const qs = p.toString();
    const url = qs ? `/api/logs/search?${qs}` : "/api/logs/search";
    return (await api.get(url)).data;
};
