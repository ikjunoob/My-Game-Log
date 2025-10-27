// src/pages/Feed/index.jsx
import { useEffect, useState } from "react";
import { listPublicFeed } from "../../api/logs";

export default function Feed() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            setErr("");
            setLoading(true);
            try {
                const data = await listPublicFeed();
                setLogs(Array.isArray(data) ? data : []);
            } catch (e) {
                setErr(e?.response?.data?.message || "피드를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ padding: "2rem" }}>
                로딩...
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>공개 피드</h2>

            {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
            {!err && logs.length === 0 && <p>공개된 기록이 아직 없어요.</p>}

            <ul style={{ marginTop: "1rem", display: "grid", gap: 12 }}>
                {logs.map((l) => {
                    const author = l.userId?.username || l.username || "익명";
                    return (
                        <li key={l._id} className="card" style={{ padding: 12 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                {l.image?.url && (
                                    <img
                                        src={l.image.url}
                                        alt=""
                                        width={72}
                                        height={72}
                                        style={{ borderRadius: 8, objectFit: "cover" }}
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                )}

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <b>{l.game}</b>
                                        <span>·</span>
                                        <span>{l.date}</span>
                                        <span>·</span>
                                        <span>{l.result}</span>
                                        {/* 작성자 표시 */}
                                        <span style={{ marginLeft: 8, fontSize: 14, color: "var(--muted)" }}>
                                            by {author}
                                        </span>
                                    </div>
                                    {l.notes && (
                                        <p style={{ marginTop: 4, color: "var(--muted)" }}>{l.notes}</p>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
