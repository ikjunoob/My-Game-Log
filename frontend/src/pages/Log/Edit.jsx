import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateLog } from "../../api/logs";
import LogForm from "./LogForm";

export default function Edit() {
    const { id } = useParams();
    const nav = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (f) => {
        setSubmitting(true);
        try {
            // 간단판: 이미지 교체는 다음 단계에서 (백엔드 PATCH 멀티파트 필요)
            await updateLog(id, { game: f.game, date: f.date, result: f.result, notes: f.notes });
            nav("/dashboard", { replace: true });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>기록 수정</h2>
            <LogForm onSubmit={handleSubmit} submitting={submitting} />
            <p style={{ color: "var(--muted)", marginTop: "8px" }}>※ 이미지 변경은 다음 단계에서 추가</p>
        </div>
    );
}
