// src/api/axios.js
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "", // 프록시 쓰면 빈 문자열로도 동작
    withCredentials: false,
});

// 토큰 자동 첨부
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 401이면 토큰 정리 후 로그인으로
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(err);
    }
);

export default api;
