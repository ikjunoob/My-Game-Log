import api from "./axios"; // (기존 import 경로)

export const adminSearchUsers = async ({ q, role, from, to, page, size } = {}) => {
    const p = new URLSearchParams();
    if (q) p.append("q", q);
    if (role) p.append("role", role);
    if (from) p.append("from", from);
    if (to) p.append("to", to);

    // ✅ [수정] page와 size 파라미터를 쿼리에 추가
    if (page) p.append("page", page);
    if (size) p.append("size", size);

    return (await api.get(`/api/admin/users?${p.toString()}`)).data;
};

export const adminDeleteUser = async (id) =>
    (await api.delete(`/api/admin/users/${id}`)).data;

export const adminSearchLogs = async ({ q, user, from, to, isPublic, page, size } = {}) => {
    const p = new URLSearchParams();
    if (q) p.append("q", q);
    if (user) p.append("user", user);
    if (from) p.append("from", from);
    if (to) p.append("to", to);
    if (isPublic !== "" && isPublic !== undefined) p.append("isPublic", isPublic);

    // ✅ [수정] page와 size 파라미터를 쿼리에 추가
    if (page) p.append("page", page);
    if (size) p.append("size", size);

    return (await api.get(`/api/admin/logs?${p.toString()}`)).data;
};

export const adminDeleteLog = async (id) =>
    (await api.delete(`/api/admin/logs/${id}`)).data;