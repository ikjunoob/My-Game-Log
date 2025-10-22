import api from "./axios";

export const listLogs = async () => (await api.get("/api/logs")).data;
export const createLog = async (formData) => (await api.post("/api/logs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
})).data;
export const updateLog = async (id, body) => (await api.patch(`/api/logs/${id}`, body)).data;
export const deleteLog = async (id) => (await api.delete(`/api/logs/${id}`)).data;
