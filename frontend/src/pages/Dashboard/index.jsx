import { useEffect, useState, useRef } from "react";
import { listLogs, deleteLog, searchMyLogs } from "../../api/logs";
import { Link } from "react-router-dom";
import "./Dashboard.scss"; // ✅ SCSS 파일 임포트

// ✅ 페이지네이션을 위한 상수 (테스트용 2개)
const ITEMS_PER_PAGE = 2;

// ✅ 페이지네이션 컴포넌트
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems === 0) return null;

    const handlePageClick = (page) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        onPageChange(page);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        const start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        const end = Math.min(Math.max(1, totalPages), start + maxPagesToShow - 1);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <nav className="pagination-controls">
            <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>
                이전
            </button>
            {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        className={page === currentPage ? 'active' : ''}
                        onClick={() => handlePageClick(page)}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="page-info">...</span>
                )
            )}
            <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages}>
                다음
            </button>
        </nav>
    );
}


export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 검색 폼 상태
    const [q, setQ] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // ✅ 페이지네이션 state 추가
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
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
            setTotalLogs(data.total || 0);
            setPage(requestedPage);
        } catch (e) {
            setErr(e?.response?.data?.message || "불러오기 실패");
        } finally {
            setLoading(false);
        }
    };

    // ✅ [수정] useEffect (1페이지 호출)
    useEffect(() => { fetchLogs(1); }, []);

    const onDelete = async (id) => {
        if (!confirm("삭제할까요?")) return;
        await deleteLog(id);
        // ✅ [수정] 삭제 후 현재 페이지 다시 로드
        if (isSearching) {
            onSearch(null, page); // 검색 중이었으면 검색 API 호출
        } else {
            fetchLogs(page); // 아니면 기본 API 호출
        }
    };

    // ✅ [수정] onSearch (검색용)
    const onSearch = async (e, requestedPage = 1) => {
        e?.preventDefault?.(); // 폼 제출 이벤트 방지
        setErr(""); setLoading(true);
        try {
            const data = await searchMyLogs({
                q,
                from,
                to,
                page: requestedPage,
                size: ITEMS_PER_PAGE
            });
            // ✅ 백엔드 응답이 { logs, total } 객체
            setLogs(data.logs);
            setTotalLogs(data.total || 0);
            setPage(requestedPage);
            setIsSearching(true); // ✅ 검색 모드 활성화
        } catch (e) {
            setErr(e?.response?.data?.message || "검색 실패");
        } finally {
            setLoading(false);
        }
    };

    // ✅ [수정] onReset (초기화용)
    const onReset = async () => {
        setQ(""); setFrom(""); setTo("");
        setIsSearching(false); // ✅ 검색 모드 비활성화
        fetchLogs(1); // 1페이지의 전체 목록 다시 로드
    };

    // ✅ 페이지 변경 핸들러
    const handlePageChange = (nextPage) => {
        if (isSearching) {
            onSearch(null, nextPage); // 검색 중이면 검색 API 호출
        } else {
            fetchLogs(nextPage); // 아니면 기본 API 호출
        }
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