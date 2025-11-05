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

    async function fetchFeed(params) {
        // 파라미터가 있으면 그 값을, 없으면 현재 state 값을 사용
        const searchParams = params || { game, mode, q, author, sort };

        setErr(""); setLoading(true);

        /*
         * ✅ [수정] 1. 검색 직전에 '현재 좋아요 상태'를 Map으로 저장합니다.
         * (setLogs의 함수형 업데이트를 사용해 'logs'의 최신 상태를 보장합니다.)
         */
        let likedStatusMap = new Map();
        setLogs(currentLogs => {
            currentLogs.forEach(log => {
                if (log._clientLiked !== undefined) {
                    likedStatusMap.set(log._id, log._clientLiked);
                }
            });
            return currentLogs; // (state를 변경하지 않고 현재 상태만 읽음)
        });


        try {
            // 2. API 호출
            const data = await listPublicFeed(searchParams);

            if (!Array.isArray(data)) {
                setLogs([]); // 비정상 응답 처리
                return;
            }

            /*
             * ✅ [수정] 3. API에서 받은 새 데이터(data)에 저장해둔 '좋아요 상태'를 합칩니다.
             */
            const mergedLogs = data.map(newLog => {
                const existingLikedStatus = likedStatusMap.get(newLog._id);

                // 맵에 '좋아요' 기록이 있다면, 새 데이터에 _clientLiked 속성을 다시 추가합니다.
                if (existingLikedStatus !== undefined) {
                    return { ...newLog, _clientLiked: existingLikedStatus };
                }
                return newLog; // 기록이 없으면 새 데이터 그대로 사용
            });

            // 4. '좋아요' 상태가 합쳐진 새 배열로 state를 업데이트합니다.
            setLogs(mergedLogs);

        } catch (e) {
            setErr(e?.response?.data?.message || "피드를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchFeed(); }, []);

    const onSearch = async (e) => { e.preventDefault(); fetchFeed(); };

    const onReset = async () => {
        // 폼 UI를 초기화 (state 업데이트)
        setGame("");
        setMode("title_content");
        setQ("");
        setAuthor("");
        setSort("latest");

        // fetchFeed에 초기화된 값을 "직접" 전달
        fetchFeed({
            game: "",
            mode: "title_content",
            q: "",
            author: "",
            sort: "latest",
        });
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