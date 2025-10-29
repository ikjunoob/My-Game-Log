// src/pages/Log/LogForm.jsx
import { useState, useEffect } from "react";
import { GAME_OPTIONS, RESULT_OPTIONS } from "../../constants";

export default function LogForm({ initial, onSubmit, submitting }) {
    const [form, setForm] = useState({
        game: GAME_OPTIONS[0],
        date: "",
        result: RESULT_OPTIONS[0],
        notes: "",
        image: null,
        isPublic: true,
    });

    useEffect(() => {
        if (initial) {
            setForm((s) => ({
                ...s,
                ...initial,
                image: null,
                isPublic: typeof initial.isPublic === "boolean" ? initial.isPublic : true,
            }));
        }
    }, [initial]);

    const change = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    const togglePublic = (e) => setForm((s) => ({ ...s, isPublic: e.target.checked }));
    const onFile = (e) => setForm((s) => ({ ...s, image: e.target.files?.[0] || null }));

    const submit = (e) => { e.preventDefault(); onSubmit(form); };

    return (
        <form onSubmit={submit} className="card" style={{ padding: "1rem", maxWidth: 580 }}>
            <label>게임</label>
            <select name="game" value={form.game} onChange={change}>
                {GAME_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            <label>날짜</label>
            <input name="date" value={form.date} onChange={change} placeholder="YYYY-MM-DD" required />

            <label>결과(제목/태그)</label>
            <select name="result" value={form.result} onChange={change}>
                {RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <label>메모</label>
            <textarea name="notes" value={form.notes} onChange={change} rows={3} />

            <label>이미지</label>
            <input type="file" accept="image/*" onChange={onFile} />

            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input type="checkbox" checked={form.isPublic} onChange={togglePublic} /> 공개 피드에 노출
            </label>

            <button className="btn" disabled={submitting} style={{ marginTop: "1rem" }}>
                {submitting ? "저장 중..." : "저장"}
            </button>
        </form>
    );
}
