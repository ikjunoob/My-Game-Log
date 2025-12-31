import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    adminSearchUsers,
    adminSearchLogs,
    adminDeleteLog,
    adminDeleteUser,
    adminExportData,
} from "../../api/admin";
import Pagination from "../../components/Pagination";
import { ITEMS_PER_PAGE } from "../../constants/pagination";
import usePagination from "../../hooks/usePagination";
import "./Admin.scss"; // ✅ SCSS 파일 임포트

export default function Admin() {
    const [tab, setTab] = useState("users"); // "users" | "logs"
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // --- Users state ---
    const [uq, setUq] = useState("");
    const [urole, setUrole] = useState("");
    const [ufrom, setUfrom] = useState("");
    const [uto, setUto] = useState("");
    // ✅ 유저 페이지네이션 state
    const { page: userPage, totalItems: userTotal, setPagination: setUserPagination } =
        usePagination();

    // --- Logs state ---
    const [lq, setLq] = useState("");
    const [luser, setLuser] = useState("");
    const [lfrom, setLfrom] = useState("");
    const [lto, setLto] = useState("");
    const [lpub, setLpub] = useState("");
    // ✅ 로그 페이지네이션 state
    const { page: logPage, totalItems: logTotal, setPagination: setLogPagination } =
        usePagination();
    // URL 쿼리와 관리자 필터 상태를 동기화한다.
    const [searchParams, setSearchParams] = useSearchParams();

    // 사용자 탭 상태를 URL 파라미터로 만든다.
    const buildUserParams = ({ page, q, role, from, to } = {}) => {
        const p = new URLSearchParams();
        p.set("tab", "users");
        if (page && page !== 1) p.set("page", String(page));
        if (q) p.set("q", q);
        if (role) p.set("role", role);
        if (from) p.set("from", from);
        if (to) p.set("to", to);
        return p;
    };

    // 로그 탭 상태를 URL 파라미터로 만든다.
    const buildLogParams = ({ page, q, user, from, to, isPublic } = {}) => {
        const p = new URLSearchParams();
        p.set("tab", "logs");
        if (page && page !== 1) p.set("page", String(page));
        if (q) p.set("q", q);
        if (user) p.set("user", user);
        if (from) p.set("from", from);
        if (to) p.set("to", to);
        if (isPublic !== "" && isPublic !== undefined) p.set("isPublic", isPublic);
        return p;
    };

    // ✅ 'Enter' 키 핸들러 (Select 태그용)
    const handleUserSelectKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchParams(buildUserParams({ page: 1, q: uq, role: urole, from: ufrom, to: uto }));
        }
    };
    const handleLogSelectKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchParams(buildLogParams({ page: 1, q: lq, user: luser, from: lfrom, to: lto, isPublic: lpub }));
        }
    };

    // ✅ [수정] fetchUsers (페이지네이션 적용)
    async function fetchUsers(requestedPage = 1, params) {
        setLoading(true);
        setErr("");
        try {
            const searchParams = params || {
                q: uq,
                role: urole,
                from: ufrom,
                to: uto,
            };
            const data = await adminSearchUsers({
                ...searchParams,
                page: requestedPage, // ✅ 페이지 파라미터 전달
                size: ITEMS_PER_PAGE, // ✅ 사이즈 파라미터 전달
            });
            // ✅ 응답 데이터 구조에 맞게 수정
            setUsers(Array.isArray(data.users) ? data.users : []);
            setUserPagination({ page: requestedPage, totalItems: data.total || 0 });
        } catch (e) {
            setErr(e?.response?.data?.message || "유저 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    // ✅ [수정] fetchLogs (페이지네이션 적용)
    async function fetchLogs(requestedPage = 1, params) {
        setLoading(true);
        setErr("");
        try {
            const searchParams = params || {
                q: lq,
                user: luser,
                from: lfrom,
                to: lto,
                isPublic: lpub,
            };
            const data = await adminSearchLogs({
                ...searchParams,
                page: requestedPage, // ✅ 페이지 파라미터 전달
                size: ITEMS_PER_PAGE, // ✅ 사이즈 파라미터 전달
            });
            // ✅ API가 { logs, total }을 반환한다고 가정
            setLogs(Array.isArray(data.logs) ? data.logs : []);
            setLogPagination({ page: requestedPage, totalItems: data.total || 0 });
        } catch (e) {
            setErr(e?.response?.data?.message || "로그 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    // ✅ [수정] 초기 로드 시 1페이지 호출
    // URL에서 탭/필터를 읽고 목록을 불러온다.
    useEffect(() => {
        const tabParam = searchParams.get("tab");
        const nextTab = tabParam === "logs" ? "logs" : "users";
        setTab(nextTab);

        const pageParam = parseInt(searchParams.get("page"), 10);
        const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

        if (nextTab === "users") {
            const nextQ = searchParams.get("q") || "";
            const nextRole = searchParams.get("role") || "";
            const nextFrom = searchParams.get("from") || "";
            const nextTo = searchParams.get("to") || "";

            setUq(nextQ);
            setUrole(nextRole);
            setUfrom(nextFrom);
            setUto(nextTo);

            fetchUsers(nextPage, {
                q: nextQ,
                role: nextRole,
                from: nextFrom,
                to: nextTo,
            });
        } else {
            const nextQ = searchParams.get("q") || "";
            const nextUser = searchParams.get("user") || "";
            const nextFrom = searchParams.get("from") || "";
            const nextTo = searchParams.get("to") || "";
            const nextIsPublic = searchParams.get("isPublic") || "";

            setLq(nextQ);
            setLuser(nextUser);
            setLfrom(nextFrom);
            setLto(nextTo);
            setLpub(nextIsPublic);

            fetchLogs(nextPage, {
                q: nextQ,
                user: nextUser,
                from: nextFrom,
                to: nextTo,
                isPublic: nextIsPublic,
            });
        }
    }, [searchParams]);

    const handleDeleteLog = async (id) => {
        if (!confirm("이 로그를 관리자 권한으로 삭제할까요? (이미지도 함께 제거됩니다)")) return;
        try {
            await adminDeleteLog(id);
            alert("삭제 완료");
            // ✅ [수정] 삭제 후 현재 페이지 목록 다시 불러오기
            fetchLogs(logPage);
        } catch (e) {
            alert(e?.response?.data?.message || "삭제 실패");
        }
    };

    const handleDeleteUser = async (u) => {
        if (
            !confirm(
                `[${u.username}] 유저를 강제탈퇴 시킬까요?\n- 이 유저가 작성한 모든 로그와 이미지가 삭제됩니다.`
            )
        )
            return;
        try {
            await adminDeleteUser(u._id);
            alert("강제탈퇴 완료");
            // ✅ [수정] 삭제 후 현재 페이지 목록 + 전체 로그 다시 불러오기
            await Promise.all([fetchUsers(userPage), fetchLogs(1)]); // 로그는 1페이지로
        } catch (e) {
            alert(e?.response?.data?.message || "강제탈퇴 실패");
        }
    };

    // ✅ [수정] 탭 변경 시 1페이지부터 다시 로드
    const handleTabChange = (newTab) => {
        setTab(newTab);
        if (newTab === "users") {
            setSearchParams(buildUserParams({ page: 1, q: uq, role: urole, from: ufrom, to: uto }));
        } else {
            setSearchParams(buildLogParams({ page: 1, q: lq, user: luser, from: lfrom, to: lto, isPublic: lpub }));
        }
    };

    // 페이지 변경 시 URL만 갱신한다.
    const handleUserPageChange = (nextPage) => {
        setSearchParams(buildUserParams({ page: nextPage, q: uq, role: urole, from: ufrom, to: uto }));
    };

    const handleLogPageChange = (nextPage) => {
        setSearchParams(buildLogParams({ page: nextPage, q: lq, user: luser, from: lfrom, to: lto, isPublic: lpub }));
    };


    // 백업 파일(JSON)을 다운로드한다.
    const handleExport = async () => {
        try {
            const type = "all";
            const res = await adminExportData({ type });
            const contentType = res.headers?.["content-type"] || "application/json";
            const blob = new Blob([res.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const disposition = res.headers?.["content-disposition"] || "";
            const match = disposition.match(/filename="([^"]+)"/);
            const fileName = match && match[1] ? match[1] : `backup-${type}.json`;

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert(e?.response?.data?.message || "Backup failed.");
        }
    };


    return (
        <div className="container admin-page">
            <header className="admin-header">
                <h2 className="admin-title">관리자 페이지</h2>
                <div className="admin-actions">
                    <button
                        className="btn btn--secondary" // '새로고침' 버튼 스타일 변경
                        onClick={() => {
                            if (tab === 'users') fetchUsers(userPage);
                            else fetchLogs(logPage);
                        }}
                    >
                        새로고침
                    </button>
                    <button className="btn" onClick={handleExport}>
                        Backup
                    </button>
                </div>
            </header>

            {/* 탭 */}
            <div className="admin-tabs">
                <button
                    className={`btn ${tab !== 'users' ? 'btn--inactive' : ''}`}
                    onClick={() => handleTabChange("users")}
                >
                    유저 ({userTotal})
                </button>
                <button
                    className={`btn ${tab !== 'logs' ? 'btn--inactive' : ''}`}
                    onClick={() => handleTabChange("logs")}
                >
                    전체 로그 ({logTotal})
                </button>
            </div>

            {loading && <p style={{ marginTop: 12 }}>로딩...</p>}
            {err && <p style={{ marginTop: 12, color: "var(--accent-danger)" }}>{err}</p>}

            {/* ===================== 유저 탭 ===================== */}
            {tab === "users" && (
                <>
                    {/* 검색 폼 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSearchParams(buildUserParams({ page: 1, q: uq, role: urole, from: ufrom, to: uto }));
                        }}
                        className="card admin-search-form"
                    >
                        <div className="admin-search-form__inner">
                            <input
                                className="search-input"
                                placeholder="아이디 검색"
                                value={uq}
                                onChange={(e) => setUq(e.target.value)}
                            />
                            <select
                                className="search-select"
                                value={urole}
                                onChange={(e) => setUrole(e.target.value)}
                                onKeyDown={handleUserSelectKeyDown} // ✅ 엔터 키 핸들러
                            >
                                <option value="">전체 권한</option>
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                            </select>
                            <label>가입일</label>
                            <input
                                type="date"
                                value={ufrom}
                                onChange={(e) => setUfrom(e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={uto}
                                onChange={(e) => setUto(e.target.value)}
                            />
                            <button className="btn" type="submit">
                                검색
                            </button>
                            <button
                                type="button"
                                className="btn btn--reset" // ✅ 초기화 버튼 스타일
                                onClick={() => {
                                    setUq("");
                                    setUrole("");
                                    setUfrom("");
                                    setUto("");
                                    setSearchParams(buildUserParams({ page: 1 })); // ✅ 초기화 시 1페이지부터
                                }}
                            >
                                초기화
                            </button>
                        </div>
                    </form>

                    {/* 유저 테이블 */}
                    <div className="card admin-table-card">
                        <table className="admin-table users-table">
                            <thead>
                                <tr>
                                    <th>아이디</th>
                                    <th>권한</th>
                                    <th>가입일</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td>{u.username}</td>
                                        <td>{u.role}</td>
                                        <td>{new Date(u.createdAt).toLocaleString()}</td>
                                        <td>
                                            <button className="btn btn--danger btn--small" onClick={() => handleDeleteUser(u)}>
                                                강제탈퇴
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>
                                            유저가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* ✅ 유저 페이지네이션 렌더링 */}
                    <Pagination
                        currentPage={userPage}
                        totalItems={userTotal}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={handleUserPageChange}
                    />
                </>
            )}

            {/* ===================== 로그 탭 ===================== */}
            {tab === "logs" && (
                <>
                    {/* 검색 폼 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSearchParams(buildLogParams({ page: 1, q: lq, user: luser, from: lfrom, to: lto, isPublic: lpub }));
                        }}
                        className="card admin-search-form"
                    >
                        <div className="admin-search-form__inner">
                            <input
                                className="search-input"
                                placeholder="게임/결과/메모 검색"
                                value={lq}
                                onChange={(e) => setLq(e.target.value)}
                            />
                            <input
                                className="search-input-user"
                                placeholder="작성자(아이디)"
                                value={luser}
                                onChange={(e) => setLuser(e.target.value)}
                            />
                            <select
                                className="search-select"
                                value={lpub}
                                onChange={(e) => setLpub(e.target.value)}
                                onKeyDown={handleLogSelectKeyDown} // ✅ 엔터 키 핸들러
                            >
                                <option value="">공개여부(전체)</option>
                                <option value="true">공개</option>
                                <option value="false">비공개</option>
                            </select>
                            <label>날짜</label>
                            <input
                                type="date"
                                value={lfrom}
                                onChange={(e) => setLfrom(e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={lto}
                                onChange={(e) => setLto(e.target.value)}
                            />
                            <button className="btn" type="submit">
                                검색
                            </button>
                            <button
                                type="button"
                                className="btn btn--reset" // ✅ 초기화 버튼 스타일
                                onClick={() => {
                                    setLq("");
                                    setLuser("");
                                    setLfrom("");
                                    setLto("");
                                    setLpub("");
                                    setSearchParams(buildLogParams({ page: 1 })); // ✅ 초기화 시 1페이지부터
                                }}
                            >
                                초기화
                            </button>
                        </div>
                    </form>

                    {/* 로그 테이블 */}
                    <div className="card admin-table-card">
                        <table className="admin-table logs-table">
                            <thead>
                                <tr>
                                    <th>게임</th>
                                    <th>날짜</th>
                                    <th>결과</th>
                                    <th>공개</th>
                                    <th>이미지</th>
                                    <th>작성자</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((l) => {
                                    const authorName =
                                        l.userId && typeof l.userId === "object"
                                            ? l.userId.username || l.userId._id
                                            : l.userId || "-";

                                    return (
                                        <tr key={l._id}>
                                            <td>{l.game}</td>
                                            <td>{l.date}</td>
                                            <td>{l.result}</td>
                                            <td>{l.isPublic ? "공개" : "비공개"}</td>
                                            <td>
                                                {l.image?.url ? (
                                                    <a href={l.image.url} target="_blank" rel="noreferrer">
                                                        보기
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td>{authorName}</td>
                                            <td>
                                                <button className="btn btn--danger btn--small" onClick={() => handleDeleteLog(l._id)}>
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                            로그가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* ✅ 로그 페이지네이션 렌더링 */}
                    <Pagination
                        currentPage={logPage}
                        totalItems={logTotal}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={handleLogPageChange}
                    />
                </>
            )}
        </div>
    );
}
