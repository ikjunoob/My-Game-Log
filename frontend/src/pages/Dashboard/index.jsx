import { useEffect, useRef, useState } from "react";
import { listLogs, deleteLog, searchMyLogs } from "../../api/logs";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../components/Pagination";
import { ITEMS_PER_PAGE } from "../../constants/pagination";
import usePagination from "../../hooks/usePagination";
import { endPerf, startPerf } from "../../utils/perf";
import "./Dashboard.scss"; // ✅ SCSS 파일 임포트

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 검색 폼 상태
    const [q, setQ] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // ✅ 페이지네이션 state 추가
    const { page, totalItems: totalLogs, setPagination: setLogsPagination } = usePagination();
    // URL 쿼리와 검색 상태를 동기화한다.
    const [searchParams, setSearchParams] = useSearchParams();
    // ??? ?? ??? ????.
    const perfRef = useRef(null);

    // 현재 상태를 URL 파라미터로 변환한다.
    const buildSearchParams = (next) => {
        const p = new URLSearchParams();
        if (next.page && next.page !== 1) p.set("page", String(next.page));
        if (next.q) p.set("q", next.q);
        if (next.from) p.set("from", next.from);
        if (next.to) p.set("to", next.to);
        return p;
    };
    // ✅ 검색 모드인지 일반 모드인지 확인
    const [isSearching, setIsSearching] = useState(false);

    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);

    // ✅ [수정] fetchLogs (초기 로드 / 리셋용)
    const fetchLogs = async (requestedPage = 1) => {
        setErr(""); setLoading(true);
        try {
            // ✅ listLogs에 page, size 전달
            const data = await listLogs({
                page: requestedPage,
                size: ITEMS_PER_PAGE
            });
            // ✅ 백엔드 응답이 { logs, total } 객체
            // ✅ [수정] .reverse() 제거 (백엔드가 이미 최신순으로 정렬)
            setLogs(data.logs);
            setLogsPagination({ page: requestedPage, totalItems: data.total || 0 });
        } catch (e) {
            setErr(e?.response?.data?.message || "불러오기 실패");
        } finally {
            setLoading(false);
            if (perfRef.current) {
                endPerf(perfRef.current.label, perfRef.current.meta);
                perfRef.current = null;
            }
        }
    };

    // 검색 전용 API 호출을 분리해 재사용한다.
    const runSearch = async (requestedPage = 1, params) => {
        const searchParams = params || { q, from, to };
        setErr(""); setLoading(true);
        try {
            const data = await searchMyLogs({
                ...searchParams,
                page: requestedPage,
                size: ITEMS_PER_PAGE
            });
            setLogs(data.logs);
            setLogsPagination({ page: requestedPage, totalItems: data.total || 0 });
        } catch (e) {
            setErr(e?.response?.data?.message || "검색 실패");
        } finally {
            setLoading(false);
            if (perfRef.current) {
                endPerf(perfRef.current.label, perfRef.current.meta);
                perfRef.current = null;
            }
        }
    };

    // ✅ [수정] useEffect (1페이지 호출)
    // URL에서 상태를 읽고 목록/검색을 결정한다.
    useEffect(() => {
        const pageParam = parseInt(searchParams.get("page"), 10);
        const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
        const nextQ = searchParams.get("q") || "";
        const nextFrom = searchParams.get("from") || "";
        const nextTo = searchParams.get("to") || "";

        setQ(nextQ);
        setFrom(nextFrom);
        setTo(nextTo);

        const searching = Boolean(nextQ || nextFrom || nextTo);
        setIsSearching(searching);

        const label = searching ? "dashboard:search" : "dashboard:list";
        startPerf(label);
        perfRef.current = {
            label,
            meta: { page: nextPage },
        };

        if (searching) {
            runSearch(nextPage, { q: nextQ, from: nextFrom, to: nextTo });
        } else {
            fetchLogs(nextPage);
        }
    }, [searchParams]);

    const onDelete = async (id) => {
        if (!confirm("??????")) return;
        await deleteLog(id);
        if (isSearching) {
            runSearch(page, { q, from, to });
        } else {
            fetchLogs(page);
        }
    };

    // URL 업데이트가 곧 조회 트리거가 된다.
    const onSearch = (e) => {
        e?.preventDefault?.();
        setSearchParams(buildSearchParams({ page: 1, q, from, to }));
    };

    const onReset = () => {
        setQ("");
        setFrom("");
        setTo("");
        setSearchParams(buildSearchParams({ page: 1 }));
    };

    const handlePageChange = (nextPage) => {
        setSearchParams(buildSearchParams({ page: nextPage, q, from, to }));
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
        return <div className="container dashboard-page"><p className="empty-state">로딩...</p></div>;
    }
    if (err) {
        return <div className="container dashboard-page"><p className="empty-state" style={{ color: "var(--accent-danger)" }}>{err}</p></div>;
    }

    return (
        <div className="container dashboard-page">
            <div className="dashboard-header">
                {/* ✅ 총 기록 개수 표시 */}
                <h2 className="dashboard-title">내 기록 ({totalLogs})</h2>
                <div className="dashboard-actions">
                    {/* ✅ 새로고침 버튼 로직 수정 */}
                    <button className="btn btn--secondary" onClick={() => handlePageChange(page)}>
                        새로고침
                    </button>
                    <Link className="btn" to="/logs/new">새 기록</Link>
                </div>
            </div>

            {/* ✅ onSearch 핸들러 수정 */}
            <form onSubmit={onSearch} className="card search-form">
                <div className="search-form__inner">
                    <input
                        className="search-input"
                        placeholder="게임명/결과/메모 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <label>날짜</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} ref={fromInputRef}
                        onClick={handleFromDateClick} />
                    <span>~</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        ref={toInputRef}
                        onClick={handleToDateClick}
                    />
                    <button className="btn" type="submit">검색</button>
                    <button type="button" className="btn btn--reset" onClick={onReset}>
                        초기화
                    </button>
                </div>
                <small className="search-hint">
                    ※ 키워드는 게임명/결과/메모를 대상으로 부분 일치로 검색합니다.
                </small>
            </form>

            {logs.length === 0 ? (
                <p className="empty-state">조건에 맞는 기록이 없어요.</p>
            ) : (
                <> {/* ✅ Pagination을 위해 Fragment로 감싸기 */}
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
                                            <span className={`status-badge ${l.isPublic ? "is-public" : "is-private"}`}>
                                                {l.isPublic ? "공개" : "비공개"}
                                            </span>
                                        </div>
                                        {l.notes && <p className="log-item__notes">{l.notes}</p>}
                                    </div>
                                    <div className="log-item__actions">
                                        {/* ✅ 버튼 스타일 수정 */}
                                        <Link className="btn btn--secondary" to={`/logs/${l._id}/edit`} state={{ log: l }}>수정</Link>
                                        <button className="btn btn--danger" onClick={() => onDelete(l._id)}>삭제</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* ✅ 페이지네이션 렌더링 */}
                    <Pagination
                        currentPage={page}
                        totalItems={totalLogs}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}
