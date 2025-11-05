import { useEffect, useState, useRef } from "react";
import { listLogs, deleteLog, searchMyLogs } from "../../api/logs";
import { Link } from "react-router-dom";
import "./Dashboard.scss"; // ✅ SCSS 파일 임포트

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 검색 폼 상태
    const [q, setQ] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

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
        // 로딩 컴포넌트도 .container로 감싸서 일관성 유지
        return <div className="container" style={{ padding: "2rem" }}>로딩...</div>;
    }
    if (err) {
        return <div className="container" style={{ padding: "2rem", color: "var(--danger)" }}>{err}</div>;
    }

    return (
        // ✅ .container와 .dashboard-page 클래스 적용
        <div className="container dashboard-page">
            {/* ✅ 페이지 헤더 */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">내 기록</h2>
                <div className="dashboard-actions">
                    <button className="btn" onClick={fetchLogs}>새로고침</button>
                    <Link className="btn" to="/logs/new">새 기록</Link>
                </div>
            </div>

            {/* ✅ 검색 폼 (.card 유지 + .search-form 추가) */}
            <form onSubmit={onSearch} className="card search-form">
                <div className="search-form__inner">
                    <input
                        className="search-input" // ✅ 클래스 적용
                        placeholder="게임명/결과/메모 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <label style={{ color: "var(--muted)" }}>날짜</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} ref={fromInputRef}
                        onClick={handleFromDateClick} />
                    <span style={{ color: "var(--muted)" }}>~</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        ref={toInputRef}
                        onClick={handleToDateClick}
                    />
                    <button className="btn" type="submit">검색</button>
                    {/* ✅ .btn--secondary 클래스 적용 */}
                    <button type="button" className="btn btn--secondary" onClick={onReset}>
                        초기화
                    </button>
                </div>
                <small className="search-hint"> {/* ✅ 클래스 적용 */}
                    ※ 키워드는 게임명/결과/메모를 대상으로 부분 일치로 검색합니다. 날짜는 YYYY-MM-DD 범위를 사용합니다.
                </small>
            </form>

            {logs.length === 0 ? (
                // ✅ .empty-state 클래스 적용
                <p className="empty-state">조건에 맞는 기록이 없어요.</p>
            ) : (
                // ✅ .log-list 클래스 적용
                <ul className="log-list">
                    {logs.map((l) => (
                        // ✅ .log-item 클래스 적용
                        <li key={l._id} className="card log-item">
                            <div className="log-item__inner">
                                {l.image?.url && (
                                    <img
                                        className="log-item__image" // ✅ 클래스 적용
                                        src={l.image.url}
                                        alt=""
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                )}
                                <div className="log-item__content">
                                    <div className="log-item__meta">
                                        <b>{l.game}</b>
                                        <span>{l.date}</span>
                                        <span>{l.result}</span>
                                        {/* ✅ 공개/비공개 배지 스타일 적용 */}
                                        <span className={`status-badge ${l.isPublic ? "is-public" : "is-private"}`}>
                                            {l.isPublic ? "공개" : "비공개"}
                                        </span>
                                    </div>
                                    {l.notes && <p className="log-item__notes">{l.notes}</p>}
                                </div>
                                <div className="log-item__actions">
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