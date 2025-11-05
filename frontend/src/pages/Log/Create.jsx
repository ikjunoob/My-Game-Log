// src/pages/Log/Create.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { presign, putToS3 } from "../../api/storage";
import { createLog } from "../../api/logs";
import LogForm from "./LogForm";

export default function Create() {
    const nav = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(form) {
        setSubmitting(true);
        try {
            // ✅ 이미지 검증(타입/2MB)
            if (form.image) {
                if (!/^image\//.test(form.image.type)) {
                    throw new Error("이미지 파일만 업로드 가능합니다.");
                }
                if (form.image.size > 2 * 1024 * 1024) {
                    throw new Error("이미지는 2MB 이하만 허용합니다.");
                }
            }

            let imageMeta = null;

            if (form.image) {
                const p = await presign(form.image.name, form.image.type);
                await putToS3(p.uploadUrl, form.image);
                imageMeta = { key: p.key, url: p.viewUrl || null };
            }

            await createLog({
                game: form.game,
                date: form.date,
                result: form.result,
                notes: form.notes,
                image: imageMeta,
                isPublic: form.isPublic,
            });

            nav("/dashboard", { replace: true });
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "저장 실패");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>새 기록</h2>
            <LogForm onSubmit={handleCreate} submitting={submitting} />
        </div>
    );
}
