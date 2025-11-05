// src/pages/Dashboard/index.jsx
import { useEffect, useState, useRef } from "react";
import { listLogs, deleteLog, searchMyLogs } from "../../api/logs";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 검색 폼 상태
    const [q, setQ] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // 👇 2. 두 개의 날짜 input을 가리킬 ref 생성
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);

    const fetchLogs = async () => {
        setErr(""); setLoading(true);
        try {
            const data = await listLogs();
            setLogs([...data].reverse());
        } catch (e) {
            setErr(e?.response?.data?.message || "불러오기 실패");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const onDelete = async (id) => {
        if (!confirm("삭제할까요?")) return;
        await deleteLog(id);
        setLogs((s) => s.filter((v) => v._id !== id));
    };

    const onSearch = async (e) => {
        e?.preventDefault?.();
        setErr(""); setLoading(true);
        try {
            const result = await searchMyLogs({ q, from, to });
            setLogs(result);
        } catch (e) {
            setErr(e?.response?.data?.message || "검색 실패");
        } finally {
            setLoading(false);
        }
    };

    const onReset = async () => {
        setQ(""); setFrom(""); setTo("");
        await fetchLogs();
    };

    // 👇 3. 각 input을 클릭할 때 캘린더를 여는 핸들러 함수 생성
    const handleFromDateClick = () => {
        if (fromInputRef.current?.showPicker) {
            fromInputRef.current.showPicker();
        }
    };

    const handleToDateClick = () => {
        if (toInputRef.current?.showPicker) {
            toInputRef.current.showPicker();
        }
    };

    if (loading) {
        return <div className="container" style={{ padding: "2rem" }}>로딩...</div>;
    }
    if (err) {
        return <div className="container" style={{ padding: "2rem", color: "var(--danger)" }}>{err}</div>;
    }

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h2>내 기록</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={fetchLogs}>새로고침</button>
                    <Link className="btn" to="/logs/new">새 기록</Link>
                </div>
            </div>

            {/* ✅ 검색 폼 */}
            <form onSubmit={onSearch} className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                        placeholder="게임명/결과/메모 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ flex: 1, minWidth: 220 }}
                    />
                    <label style={{ color: "var(--muted)" }}>날짜</label>
                    {/* 👇 4. 'from' 날짜 input에 ref와 onClick 추가 */}
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} ref={fromInputRef}
                        onClick={handleFromDateClick} />
                    <span style={{ color: "var(--muted)" }}>~</span>
                    {/* 👇 5. 'to' 날짜 input에 ref와 onClick 추가 */}
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        ref={toInputRef}
                        onClick={handleToDateClick}
                    />
                    <button className="btn" type="submit">검색</button>
                    <button type="button" className="btn" onClick={onReset} style={{ background: "#374151" }}>
                        초기화
                    </button>
                </div>
                <small style={{ color: "var(--muted)" }}>
                    ※ 키워드는 게임명/결과/메모를 대상으로 부분 일치로 검색합니다. 날짜는 YYYY-MM-DD 범위를 사용합니다.
                </small>
            </form>

            {logs.length === 0 ? (
                <p style={{ marginTop: "1rem" }}>조건에 맞는 기록이 없어요.</p>
            ) : (
                <ul style={{ marginTop: "1rem", display: "grid", gap: "12px" }}>
                    {logs.map((l) => (
                        <li key={l._id} className="card" style={{ padding: "12px" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                {l.image?.url && (
                                    <img
                                        src={l.image.url}
                                        alt=""
                                        width={72}
                                        height={72}
                                        style={{ objectFit: "cover", borderRadius: 8 }}
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <b>{l.game}</b> · <span>{l.date}</span> · <span>{l.result}</span>
                                        <span style={{ marginLeft: 8, fontSize: 12, color: l.isPublic ? "#60a5fa" : "#98a2b3" }}>
                                            {l.isPublic ? "공개" : "비공개"}
                                        </span>
                                    </div>
                                    {l.notes && <p style={{ marginTop: 4, color: "var(--muted)" }}>{l.notes}</p>}
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Link className="btn" to={`/logs/${l._id}/edit`} state={{ log: l }}>수정</Link>
                                    <button className="btn" onClick={() => onDelete(l._id)}>삭제</button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
