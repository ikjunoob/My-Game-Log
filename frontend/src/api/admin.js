// src/api/admin.js
import api from "./axios";

// ✅ 유저 검색/목록
export const adminSearchUsers = async ({ q, role, from, to } = {}) => {
    const p = new URLSearchParams();
    if (q) p.append("q", q);
    if (role) p.append("role", role);
    if (from) p.append("from", from);
    if (to) p.append("to", to);
    const url = `/api/admin/users${p.toString() ? `?${p.toString()}` : ""}`;
    return (await api.get(url)).data;
};

// ✅ 로그 검색/목록
export const adminSearchLogs = async ({ q, user, from, to, isPublic } = {}) => {
    const p = new URLSearchParams();
    if (q) p.append("q", q);
    if (user) p.append("user", user);
    if (from) p.append("from", from);
    if (to) p.append("to", to);
    if (typeof isPublic !== "undefined" && isPublic !== "") p.append("isPublic", String(isPublic));
    const url = `/api/admin/logs${p.toString() ? `?${p.toString()}` : ""}`;
    return (await api.get(url)).data;
};

// 삭제
export const adminDeleteLog = async (id) => (await api.delete(`/api/admin/logs/${id}`)).data;
