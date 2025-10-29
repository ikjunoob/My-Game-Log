// src/pages/Admin/index.jsx
import { useEffect, useState } from "react";
import {
    adminSearchUsers,
    adminSearchLogs,
    adminDeleteLog,
    adminDeleteUser,
} from "../../api/admin";

export default function Admin() {
    const [tab, setTab] = useState("users"); // "users" | "logs"
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ── Users search state
    const [uq, setUq] = useState("");
    const [urole, setUrole] = useState(""); // "", "user", "admin"
    const [ufrom, setUfrom] = useState("");
    const [uto, setUto] = useState("");

    // ── Logs search state
    const [lq, setLq] = useState(""); // game/result/notes
    const [luser, setLuser] = useState(""); // username (작성자)
    const [lfrom, setLfrom] = useState("");
    const [lto, setLto] = useState("");
    const [lpub, setLpub] = useState(""); // "", "true", "false"

    async function fetchUsers() {
        setLoading(true);
        setErr("");
        try {
            const data = await adminSearchUsers({
                q: uq,
                role: urole,
                from: ufrom,
                to: uto,
            });
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.response?.data?.message || "유저 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    async function fetchLogs() {
        setLoading(true);
        setErr("");
        try {
            const data = await adminSearchLogs({
                q: lq,
                user: luser,
                from: lfrom,
                to: lto,
                isPublic: lpub,
            });
            setLogs(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.response?.data?.message || "로그 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDeleteLog = async (id) => {
        if (!confirm("이 로그를 관리자 권한으로 삭제할까요? (이미지도 함께 제거됩니다)")) return;
        try {
            await adminDeleteLog(id);
            setLogs((s) => s.filter((v) => v._id !== id));
            alert("삭제 완료");
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
            await Promise.all([fetchUsers(), fetchLogs()]);
        } catch (e) {
            alert(e?.response?.data?.message || "강제탈퇴 실패");
        }
    };

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>관리자 페이지</h2>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                    className="btn"
                    onClick={() => setTab("users")}
                    style={{ opacity: tab === "users" ? 1 : 0.6 }}
                >
                    유저
                </button>
                <button
                    className="btn"
                    onClick={() => setTab("logs")}
                    style={{ opacity: tab === "logs" ? 1 : 0.6 }}
                >
                    전체 로그
                </button>
                <button
                    className="btn"
                    onClick={() => {
                        fetchUsers();
                        fetchLogs();
                    }}
                    style={{ marginLeft: "auto" }}
                >
                    새로고침
                </button>
            </div>

            {loading && <p style={{ marginTop: 12 }}>로딩...</p>}
            {err && <p style={{ marginTop: 12, color: "var(--danger)" }}>{err}</p>}

            {/* ===================== 유저 탭 ===================== */}
            {tab === "users" && (
                <>
                    {/* 검색 폼 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            fetchUsers();
                        }}
                        className="card"
                        style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <input
                                placeholder="아이디 검색"
                                value={uq}
                                onChange={(e) => setUq(e.target.value)}
                                style={{ flex: 1, minWidth: 220 }}
                            />
                            <select value={urole} onChange={(e) => setUrole(e.target.value)}>
                                <option value="">전체 권한</option>
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                            </select>
                            <label style={{ color: "var(--muted)" }}>가입일</label>
                            <input
                                type="date"
                                value={ufrom}
                                onChange={(e) => setUfrom(e.target.value)}
                            />
                            <span style={{ color: "var(--muted)" }}>~</span>
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
                                className="btn"
                                onClick={() => {
                                    setUq("");
                                    setUrole("");
                                    setUfrom("");
                                    setUto("");
                                    fetchUsers();
                                }}
                                style={{ background: "#374151" }}
                            >
                                초기화
                            </button>
                        </div>
                    </form>

                    {/* 유저 테이블 */}
                    <div className="card" style={{ marginTop: 12, padding: 12 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                                    <th>아이디</th>
                                    <th>권한</th>
                                    <th>가입일</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} style={{ borderTop: "1px solid var(--border)" }}>
                                        <td>{u.username}</td>
                                        <td>{u.role}</td>
                                        <td>{new Date(u.createdAt).toLocaleString()}</td>
                                        <td>
                                            <button className="btn" onClick={() => handleDeleteUser(u)}>
                                                강제탈퇴
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 8, color: "var(--muted)" }}>
                                            유저가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ===================== 로그 탭 ===================== */}
            {tab === "logs" && (
                <>
                    {/* 검색 폼 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            fetchLogs();
                        }}
                        className="card"
                        style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <input
                                placeholder="게임/결과/메모 검색"
                                value={lq}
                                onChange={(e) => setLq(e.target.value)}
                                style={{ flex: 1, minWidth: 220 }}
                            />
                            <input
                                placeholder="작성자(아이디)"
                                value={luser}
                                onChange={(e) => setLuser(e.target.value)}
                                style={{ width: 180 }}
                            />
                            <select
                                value={lpub}
                                onChange={(e) => setLpub(e.target.value)}
                                style={{ width: 140 }}
                            >
                                <option value="">공개여부(전체)</option>
                                <option value="true">공개</option>
                                <option value="false">비공개</option>
                            </select>
                            <label style={{ color: "var(--muted)" }}>날짜</label>
                            <input
                                type="date"
                                value={lfrom}
                                onChange={(e) => setLfrom(e.target.value)}
                            />
                            <span style={{ color: "var(--muted)" }}>~</span>
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
                                className="btn"
                                onClick={() => {
                                    setLq("");
                                    setLuser("");
                                    setLfrom("");
                                    setLto("");
                                    setLpub("");
                                    fetchLogs();
                                }}
                                style={{ background: "#374151" }}
                            >
                                초기화
                            </button>
                        </div>
                    </form>

                    {/* 로그 테이블 */}
                    <div className="card" style={{ marginTop: 12, padding: 12 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", color: "var(--muted)" }}>
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
                                        <tr key={l._id} style={{ borderTop: "1px solid var(--border)" }}>
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
                                                <button className="btn" onClick={() => handleDeleteLog(l._id)}>
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 8, color: "var(--muted)" }}>
                                            로그가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
