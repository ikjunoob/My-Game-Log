import api from "./axios";

// ✅ [수정] params 객체를 받도록 변경
export const listLogs = async (params = {}) => {
    const p = new URLSearchParams(params);
    return (await api.get(`/api/logs?${p.toString()}`)).data;
};

export const createLog = async (body) => (await api.post("/api/logs", body)).data;
export const updateLog = async (id, body) => (await api.patch(`/api/logs/${id}`, body)).data;
export const deleteLog = async (id) => (await api.delete(`/api/logs/${id}`)).data;

// 공개 피드
export const listPublicFeed = async (params = {}) => {
    const p = new URLSearchParams(params);
    return (await api.get(`/api/logs/public/feed?${p.toString()}`)).data;
};

export const toggleLike = async (id) =>
    (await api.post(`/api/logs/${id}/like`)).data;

// ✅ [수정] params 객체를 받도록 변경 (page, size 포함)
export const searchMyLogs = async (params = {}) => {
    const p = new URLSearchParams();

    // 기존 파라미터
    if (params.q) p.append("q", params.q);
    if (params.from) p.append("from", params.from);
    if (params.to) p.append("to", params.to);

    // 페이지네이션 파라미터
    if (params.page) p.append("page", params.page);
    if (params.size) p.append("size", params.size);

    const qs = p.toString();
    const url = qs ? `/api/logs/search?${qs}` : "/api/logs/search";
    return (await api.get(url)).data;
};