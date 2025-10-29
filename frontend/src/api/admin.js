// src/api/admin.js
import api from "./axios";

// 유저(비번 제외)
export const adminListUsers = async () => (await api.get("/api/admin/users")).data;

// 전체 로그
export const adminListLogs = async () => (await api.get("/api/admin/logs")).data;

// 특정 로그 삭제 (관리자 강제 삭제)
export const adminDeleteLog = async (id) => (await api.delete(`/api/admin/logs/${id}`)).data;
