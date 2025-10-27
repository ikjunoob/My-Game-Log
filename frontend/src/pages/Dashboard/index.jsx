// src/pages/Dashboard/index.jsx
import { useEffect, useState } from "react";
import { listLogs, deleteLog } from "../../api/logs";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const fetchLogs = async () => {
        setErr("");
        setLoading(true);
        try {
            const data = await listLogs();
            setLogs([...data].reverse()); // 최신이 위로
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

    if (loading) {
        return <div className="container" style={{ padding: "2rem" }}>로딩...</div>;
    }
    if (err) {
        return <div className="container" style={{ padding: "2rem", color: "var(--danger)" }}>{err}</div>;
    }

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>내 기록</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={fetchLogs}>새로고침</button>
                    <Link className="btn" to="/logs/new">새 기록</Link>
                </div>
            </div>

            {logs.length === 0 ? (
                <p style={{ marginTop: "1rem" }}>기록이 없어요. “새 기록”을 눌러 추가해보세요.</p>
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
                                    <b>{l.game}</b> · <span>{l.date}</span> · <span>{l.result}</span>
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
