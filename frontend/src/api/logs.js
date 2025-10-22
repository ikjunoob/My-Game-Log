// src/api/logs.js
import api from "./client";

export const listLogs = async () => (await api.get("/api/logs")).data;
export const createLog = async (body) => (await api.post("/api/logs", body)).data;      // JSON(meta)
export const updateLog = async (id, body) => (await api.patch(`/api/logs/${id}`, body)).data;
export const deleteLog = async (id) => (await api.delete(`/api/logs/${id}`)).data;

// ✅ 공개 피드
export const listPublicFeed = async () => (await api.get("/api/logs/public/feed")).data;

