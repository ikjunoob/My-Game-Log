import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listPublicFeed, toggleLike } from "../../api/logs";
import { GAME_OPTIONS } from "../../constants";
import Pagination from "../../components/Pagination";
import { ITEMS_PER_PAGE } from "../../constants/pagination";
import usePagination from "../../hooks/usePagination";
import "./Feed.scss"; // ✅ Feed 전용 SCSS

export default function Feed() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 검색 상태
    const [game, setGame] = useState("");
    const [mode, setMode] = useState("title_content");
    const [q, setQ] = useState("");
    const [author, setAuthor] = useState("");
    const [sort, setSort] = useState("latest");

    const { page, totalItems: totalLogs, setPagination: setFeedPagination } = usePagination();
    // URL 쿼리와 검색 상태를 동기화한다.
    const [searchParams, setSearchParams] = useSearchParams();

    // 현재 상태를 URL 파라미터로 변환한다.
    const buildSearchParams = (next) => {
        const p = new URLSearchParams();
        if (next.page && next.page !== 1) p.set("page", String(next.page));
        if (next.game) p.set("game", next.game);
        if (next.mode && next.mode !== "title_content") p.set("mode", next.mode);
        if (next.q) p.set("q", next.q);
        if (next.author) p.set("author", next.author);
        if (next.sort && next.sort !== "latest") p.set("sort", next.sort);
        return p;
    };

    // ✅ [수정] 로컬 스토리지에서 'user' 객체와 'userId'를 가져옵니다.
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    });
    const userId = user?._id; // 현재 로그인한 유저의 ID
    const isAuthed = !!localStorage.getItem("token");


    async function fetchFeed(requestedPage = 1, params) {
        const searchParams = params || { game, mode, q, author, sort };

        setErr(""); setLoading(true);

        // ✅ [수정] Map 로직(_clientLiked)을 모두 제거했습니다.

        try {
            const data = await listPublicFeed({
                ...searchParams,
                page: requestedPage,
                size: ITEMS_PER_PAGE
            });

            if (!data || !Array.isArray(data.logs)) {
                setLogs([]);
                setFeedPagination({ totalItems: 0 });
                return;
            }

            // ✅ [수정] API에서 받은 'likedBy' 배열과 'userId'를 비교합니다.
            const mergedLogs = data.logs.map(newLog => {
                // API 응답에 'likedBy' 배열이 있고, 그 배열에 'userId'가 포함되어 있는지 확인
                const isLikedByMe = newLog.likedBy?.some(id => id === userId);

                // 'liked' 라는 새 속성에 true/false를 저장합니다.
                return { ...newLog, liked: isLikedByMe };
            });

            setLogs(mergedLogs);
            setFeedPagination({ page: requestedPage, totalItems: data.total || 0 });

        } catch (e) {
            setErr(e?.response?.data?.message || "피드를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    // URL에서 상태를 읽고 서버 조회를 실행한다.
    useEffect(() => {
        const pageParam = parseInt(searchParams.get("page"), 10);
        const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
        const nextGame = searchParams.get("game") || "";
        const nextMode = searchParams.get("mode") || "title_content";
        const nextQ = searchParams.get("q") || "";
        const nextAuthor = searchParams.get("author") || "";
        const nextSort = searchParams.get("sort") || "latest";

        setGame(nextGame);
        setMode(nextMode);
        setQ(nextQ);
        setAuthor(nextAuthor);
        setSort(nextSort);

        fetchFeed(nextPage, {
            game: nextGame,
            mode: nextMode,
            q: nextQ,
            author: nextAuthor,
            sort: nextSort,
        });
    }, [searchParams]);

    // URL 업데이트가 곧 조회 트리거가 된다.
    const onSearch = (e) => {
        e.preventDefault();
        setSearchParams(
            buildSearchParams({ page: 1, game, mode, q, author, sort })
        );
    };

    const onReset = () => {
        const resetParams = {
            game: "",
            mode: "title_content",
            q: "",
            author: "",
            sort: "latest",
        };
        setGame(resetParams.game);
        setMode(resetParams.mode);
        setQ(resetParams.q);
        setAuthor(resetParams.author);
        setSort(resetParams.sort);
        setSearchParams(buildSearchParams({ page: 1, ...resetParams }));
    };

    const handlePageChange = (nextPage) => {
        setSearchParams(
            buildSearchParams({ page: nextPage, game, mode, q, author, sort })
        );
    };

    // ✅ [수정] onLike 함수가 '_clientLiked' 대신 'liked' 속성을 업데이트합니다.
    const onLike = async (id) => {
        try {
            // API 응답 (liked: true/false, likes: 3)
            const { liked, likes } = await toggleLike(id);
            setLogs((s) =>
                // API가 보내준 'liked'와 'likes' 값으로 state를 덮어씁니다.
                s.map((l) => (l._id === id ? { ...l, likes, liked } : l))
            );
        } catch (e) {
            alert(e?.response?.data?.message || "로그인이 필요합니다.");
        }
    };

    if (loading) {
        return <div className="container feed-page"><p className="empty-state">로딩...</p></div>;
    }

    return (
        <div className="container feed-page">
            <header className="feed-header">
                <h2 className="feed-title">공개 피드 ({totalLogs})</h2>
            </header>

            <form onSubmit={onSearch} className="card admin-search-form">
                <div className="admin-search-form__inner">
                    <select className="search-select" value={game} onChange={(e) => setGame(e.target.value)}>
                        <option value="">전체 게임</option>
                        {GAME_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select className="search-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value="title">제목(결과)</option>
                        <option value="content">내용(메모)</option>
                        <option value="title_content">제목+내용</option>
                    </select>
                    <input className="search-input" placeholder="검색어" value={q} onChange={(e) => setQ(e.target.value)} />
                    <input className="search-input-user" placeholder="작성자" value={author} onChange={(e) => setAuthor(e.target.value)} />
                    <select className="search-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="latest">최신순</option>
                        <option value="likes">좋아요순</option>
                    </select>
                    <button className="btn" type="submit">검색</button>
                    <button type="button" className="btn btn--reset" onClick={onReset}>초기화</button>
                </div>
            </form>

            {err && <p style={{ color: "var(--accent-danger)" }}>{err}</p>}

            <ul className="log-list">
                {logs.map((l) => (
                    <li key={l._id} className="card log-item">
                        <div className="log-item__inner">
                            {l.image?.url && (
                                <img
                                    className="log-item__image"
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
                                    {l.userId?.username && (
                                        <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                            by {l.userId.username}
                                        </span>
                                    )}
                                </div>
                                {l.notes && <p className="log-item__notes">{l.notes}</p>}
                            </div>

                            {/* ✅ [수정] '_clientLiked' 대신 'l.liked'를 사용합니다. */}
                            <button
                                className={`btn ${l.liked ? '' : 'btn--secondary'}`}
                                disabled={!isAuthed}
                                onClick={() => onLike(l._id)}
                                title={isAuthed ? "좋아요" : "로그인 필요"}
                                style={{ display: "flex", alignItems: "center", gap: 6, minWidth: '70px', justifyContent: 'center' }}
                            >
                                <span style={{ fontSize: 16, lineHeight: 1, color: l.liked ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                                    {(l.liked ?? false) ? "♥" : "♡"}
                                </span>
                                <span>{l.likes || 0}</span>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {logs.length === 0 && !loading && <p className="empty-state">조건에 맞는 공개 기록이 없습니다.</p>}

            <Pagination
                currentPage={page}
                totalItems={totalLogs}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
