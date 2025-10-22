import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { presign, putToS3 } from "../../api/storage";
import { createLog } from "../../api/logs";
import LogForm from "./LogForm"; // 기존 폼 재사용 (image 파일 필드 포함)

export default function Create() {
    const nav = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // ⬇️ 질문에 준 코드가 바로 이 함수입니다
    async function handleCreate(form) {
        setSubmitting(true);
        try {
            let imageMeta = null;

            // form.image(또는 imageFile) : LogForm에서 넘겨주는 File 객체
            if (form.image) {
                const p = await presign(form.image.name, form.image.type);
                await putToS3(p.uploadUrl, form.image);
                imageMeta = { key: p.key, url: p.viewUrl }; // viewUrl 없으면 key만 저장
            }

            await createLog({
                game: form.game,
                date: form.date,
                result: form.result,
                notes: form.notes,
                image: imageMeta,
                isPublic: true,
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
