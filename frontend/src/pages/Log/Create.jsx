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
                isPublic: form.isPublic, // ✅ 폼 값 사용
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
