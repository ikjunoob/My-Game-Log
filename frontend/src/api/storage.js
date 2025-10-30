// src/api/storage.js
import api from "./axios";

// 1) 서버에서 presign URL 발급
export async function presign(filename, contentType) {
    const { data } = await api.post("/api/storage/presign", { filename, contentType });
    return data; // { key, uploadUrl, viewUrl }
}

// 2) 브라우저 → S3 직접 PUT
export async function putToS3(uploadUrl, file) {
    await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
    });
}

