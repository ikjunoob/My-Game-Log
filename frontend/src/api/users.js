// src/api/users.js
import api from "./axios";

export const login = async ({ username, password }) => {
    const { data } = await api.post("/api/users/login", { username, password });
    return data; // { message, token }
};

export const register = async ({ username, password }) => {
    const { data } = await api.post("/api/users/register", { username, password });
    return data; // { message, user }
};

export const me = async () => {
    const { data } = await api.get("/api/users/me");
    return data; // { id, username, role, ... }
};
