// src/pages/Feed/index.jsx
import { useEffect, useState } from "react";
import { listPublicFeed } from "../../api/logs";

export default function Feed() {
    const [logs, setLogs] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await listPublicFeed();
                setLogs(data);
            } catch (e) {
                setErr(e?.response?.data?.message || "피드를 불러오지 못했습니다.");
            }
        })();
    }, []);

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>공개 피드</h2>
            {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
            {!err && logs.length === 0 && <p>공개된 기록이 아직 없어요.</p>}

            <ul style={{ marginTop: "1rem", display: "grid", gap: 12 }}>
                {logs.map((l) => (
                    <li key={l._id} className="card" style={{ padding: 12 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            {l.image?.url && (
                                <img src={l.image.url}
                                    alt=""
                                    width={72}
                                    height={72}
                                    style={{ borderRadius: 8, objectFit: "cover" }}
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <b>{l.game}</b> · <span>{l.date}</span> · <span>{l.result}</span>
                                {l.notes && <p style={{ marginTop: 4, color: "var(--muted)" }}>{l.notes}</p>}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

