// src/pages/Log/Edit.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listLogs, updateLog, updateLogForm } from "../../api/logs";
import LogForm from "./LogForm";

export default function Edit() {
    const { id } = useParams();
    const { state } = useLocation();          // 대시보드에서 넘긴 { log }
    const nav = useNavigate();

    const [initial, setInitial] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // 1) state.log가 있으면 그대로 사용
    useEffect(() => {
        if (state?.log) {
            const { game, date, result, notes } = state.log;
            setInitial({ game, date, result, notes });
            return;
        }
        // 2) 없으면 목록에서 찾아서 채우기 (간단한 fallback)
        (async () => {
            try {
                const all = await listLogs();
                const found = all.find((v) => v._id === id);
                if (found) {
                    const { game, date, result, notes } = found;
                    setInitial({ game, date, result, notes });
                }
            } catch (e) {
                // 실패해도 폼은 비어 있지만 PATCH 자체는 가능
            }
        })();
    }, [id, state]);

    const handleSubmit = async (f) => {
        setSubmitting(true);
        try {
            if (f.image) {
                const fd = new FormData();
                ["game", "date", "result", "notes"].forEach(k => fd.append(k, f[k] || ""));
                fd.append("image", f.image);
                await updateLogForm(id, fd);
            } else {
                await updateLog(id, { game: f.game, date: f.date, result: f.result, notes: f.notes });
            }
            nav("/dashboard", { replace: true });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>기록 수정</h2>
            <LogForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
            <p style={{ color: "var(--muted)", marginTop: "8px" }}>※ 이미지 변경은 다음 단계에서 추가</p>
        </div>
    );
}
