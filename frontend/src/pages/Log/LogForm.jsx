import { useState, useEffect } from "react";

export default function LogForm({ initial, onSubmit, submitting }) {
    const [form, setForm] = useState({
        game: "", date: "", result: "", notes: "", image: null, isPublic: true,
    });

    useEffect(() => {
        if (initial) {
            setForm((s) => ({
                ...s,
                ...initial,
                image: null,
                // 초기값에 isPublic이 없으면 true로 기본
                isPublic: typeof initial.isPublic === "boolean" ? initial.isPublic : true,
            }));
        }
    }, [initial]);

    const change = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    const onFile = (e) => setForm((s) => ({ ...s, image: e.target.files?.[0] || null }));
    const onTogglePublic = (e) => setForm((s) => ({ ...s, isPublic: e.target.checked }));

    const submit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={submit} className="card" style={{ padding: "1rem", maxWidth: 580 }}>
            <label>게임명</label>
            <input name="game" value={form.game} onChange={change} required />
            <label>날짜</label>
            <input name="date" value={form.date} onChange={change} placeholder="YYYY-MM-DD" required />
            <label>결과</label>
            <input name="result" value={form.result} onChange={change} required />
            <label>메모</label>
            <textarea name="notes" value={form.notes} onChange={change} rows={3} />
            <label>이미지</label>
            <input type="file" accept="image/*" onChange={onFile} />

            {/* 공개 여부 */}
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input type="checkbox" checked={form.isPublic} onChange={onTogglePublic} />
                공개 피드에 노출
            </label>

            <button className="btn" disabled={submitting} style={{ marginTop: "1rem" }}>
                {submitting ? "저장 중..." : "저장"}
            </button>
        </form>
    );
}
