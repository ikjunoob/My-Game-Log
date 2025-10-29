// src/pages/Admin/index.jsx
import { useEffect, useState } from "react";
import { adminListUsers, adminListLogs, adminDeleteLog } from "../../api/admin";

export default function Admin() {
    const [tab, setTab] = useState("users"); // users | logs
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    async function fetchUsers() {
        setLoading(true); setErr("");
        try {
            const data = await adminListUsers();
            setUsers(data);
        } catch (e) {
            setErr(e?.response?.data?.message || "유저 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    async function fetchLogs() {
        setLoading(true); setErr("");
        try {
            const data = await adminListLogs();
            setLogs(data);
        } catch (e) {
            setErr(e?.response?.data?.message || "로그 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchUsers(); fetchLogs(); }, []);

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

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>관리자 페이지</h2>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn" onClick={() => setTab("users")} style={{ opacity: tab === "users" ? 1 : 0.6 }}>
                    유저
                </button>
                <button className="btn" onClick={() => setTab("logs")} style={{ opacity: tab === "logs" ? 1 : 0.6 }}>
                    전체 로그
                </button>
                <button className="btn" onClick={() => { fetchUsers(); fetchLogs(); }} style={{ marginLeft: "auto" }}>
                    새로고침
                </button>
            </div>

            {loading && <p style={{ marginTop: 12 }}>로딩...</p>}
            {err && <p style={{ marginTop: 12, color: "var(--danger)" }}>{err}</p>}

            {/* 유저 테이블 */}
            {tab === "users" && (
                <div className="card" style={{ marginTop: 12, padding: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                                <th>아이디</th>
                                <th>권한</th>
                                <th>가입일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} style={{ borderTop: "1px solid var(--border)" }}>
                                    <td>{u.username}</td>
                                    <td>{u.role}</td>
                                    <td>{new Date(u.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan={3} style={{ padding: 8, color: "var(--muted)" }}>유저가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 로그 테이블 */}
            {tab === "logs" && (
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
                            {logs.map((l) => (
                                <tr key={l._id} style={{ borderTop: "1px solid var(--border)" }}>
                                    <td>{l.game}</td>
                                    <td>{l.date}</td>
                                    <td>{l.result}</td>
                                    <td>{l.isPublic ? "공개" : "비공개"}</td>
                                    <td>
                                        {l.image?.url ? (
                                            <a href={l.image.url} target="_blank" rel="noreferrer">보기</a>
                                        ) : "-"}
                                    </td>
                                    <td>{l.userId || l.user?._id || "-"}</td>
                                    <td>
                                        <button className="btn" onClick={() => handleDeleteLog(l._id)}>삭제</button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: 8, color: "var(--muted)" }}>로그가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
