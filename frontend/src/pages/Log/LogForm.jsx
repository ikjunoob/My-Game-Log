import { useState, useEffect, useRef } from "react";
import { GAME_OPTIONS, RESULT_OPTIONS } from "../../constants";
import "./LogForm.scss"; // ✅ 1. 새로 만든 SCSS 파일 임포트

export default function LogForm({ initial, onSubmit, submitting }) {
    const [form, setForm] = useState({
        game: GAME_OPTIONS[0],
        date: "",
        result: RESULT_OPTIONS[0],
        notes: "",
        image: null,
        isPublic: true,
    });

    const dateInputRef = useRef(null);

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

    const handleDateClick = () => {
        if (dateInputRef.current?.showPicker) {
            dateInputRef.current.showPicker();
        }
    };

    return (
        // ✅ 2. className 및 인라인 스타일 제거
        <form onSubmit={submit} className="card log-form-card">
            <label>게임</label>
            <select name="game" value={form.game} onChange={change}>
                {GAME_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            <label>날짜</label>
            <input
                type="date"
                name="date"
                value={form.date}
                onChange={change}
                required
                ref={dateInputRef}
                onClick={handleDateClick}
            />
            <label>결과(제목/태그)</label>
            <select name="result" value={form.result} onChange={change}>
                {RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <label>메모</label>
            <textarea name="notes" value={form.notes} onChange={change} rows={3} />

            <label>이미지</label>
            <input type="file" accept="image/*" onChange={onFile} />

            {/* ✅ 3. 커스텀 체크박스 HTML 구조로 변경 */}
            <label className="checkbox-label">
                <input type="checkbox" checked={form.isPublic} onChange={togglePublic} />
                <span className="checkbox-box"></span>
                <span>공개 피드에 노출</span>
            </label>

            {/* ✅ 4. 버튼 인라인 스타일 제거 */}
            <button className="btn" disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
            </button>
        </form>
    );
}