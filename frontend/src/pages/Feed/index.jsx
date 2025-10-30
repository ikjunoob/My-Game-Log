import { useEffect, useState } from "react";
import { listPublicFeed, toggleLike } from "../../api/logs";
import { GAME_OPTIONS } from "../../constants";

export default function Feed() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 검색 상태
    const [game, setGame] = useState(""); // ""=전체 or 게임명
    const [mode, setMode] = useState("title_content"); // title|content|title_content
    const [q, setQ] = useState("");
    const [author, setAuthor] = useState("");
    const [sort, setSort] = useState("latest"); // latest|likes

    const isAuthed = !!localStorage.getItem("token"); // ✅ 비로그인 시 좋아요 비활성화용

    async function fetchFeed() {
        setErr(""); setLoading(true);
        try {
            const data = await listPublicFeed({ game, mode, q, author, sort });
            // 초기엔 liked 정보가 없으므로 그대로 렌더(첫 토글 시 응답으로 상태 반영)
            setLogs(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.response?.data?.message || "피드를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchFeed(); }, []);

    const onSearch = async (e) => { e.preventDefault(); fetchFeed(); };
    const onReset = async () => {
        setGame(""); setMode("title_content"); setQ(""); setAuthor(""); setSort("latest");
        fetchFeed();
    };

    // ✅ 좋아요 버튼 상태/카운트 반영
    const onLike = async (id) => {
        try {
            const { liked, likes } = await toggleLike(id);
            setLogs((s) =>
                s.map((l) => (l._id === id ? { ...l, likes, _clientLiked: liked } : l))
            );
        } catch (e) {
            alert(e?.response?.data?.message || "로그인이 필요합니다.");
        }
    };

    if (loading) return <div className="container" style={{ padding: "2rem" }}>로딩...</div>;

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>공개 피드</h2>

            {/* 검색 폼 */}
            <form onSubmit={onSearch} className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select value={game} onChange={(e) => setGame(e.target.value)}>
                        <option value="">전체 게임</option>
                        {GAME_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value="title">제목(결과)</option>
                        <option value="content">내용(메모)</option>
                        <option value="title_content">제목+내용</option>
                    </select>

                    <input placeholder="검색어" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                    <input placeholder="작성자" value={author} onChange={(e) => setAuthor(e.target.value)} style={{ width: 160 }} />

                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="latest">최신순</option>
                        <option value="likes">좋아요순</option>
                    </select>

                    <button className="btn" type="submit">검색</button>
                    <button type="button" className="btn" onClick={onReset} style={{ background: "#374151" }}>초기화</button>
                </div>
            </form>

            {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
            {!err && logs.length === 0 && <p>조건에 맞는 공개 기록이 없습니다.</p>}

            <ul style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {logs.map((l) => (
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
                                    <b>{l.game}</b> · <span>{l.date}</span> · <span>{l.result}</span>
                                    {l.userId?.username && (
                                        <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>by {l.userId.username}</span>
                                    )}
                                </div>
                                {l.notes && <p style={{ marginTop: 4, color: "var(--muted)" }}>{l.notes}</p>}
                            </div>

                            {/* ❤️ 좋아요 (비로그인 비활성화 + 상태 토글 표시) */}
                            <button
                                className="btn"
                                disabled={!isAuthed}
                                onClick={() => onLike(l._id)}
                                title={isAuthed ? "좋아요" : "로그인 필요"}
                                style={{ display: "flex", alignItems: "center", gap: 6 }}
                            >
                                <span style={{ fontSize: 18, lineHeight: 1 }}>
                                    {(l._clientLiked ?? false) ? "♥" : "♡"}
                                </span>
                                <span>{l.likes || 0}</span>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
