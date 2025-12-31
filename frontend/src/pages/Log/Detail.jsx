import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getLogById } from "../../api/logs";
import "./Detail.scss";

export default function LogDetail() {
    const { id } = useParams();
    const location = useLocation();
    // 리스트에서 전달된 로그가 있으면 초기 화면을 빠르게 보여준다.
    const initialLog = location.state?.log || null;

    const [log, setLog] = useState(initialLog);
    const [loading, setLoading] = useState(!initialLog);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;

        const load = async () => {
            setErr("");
            setLog(initialLog || null);
            setLoading(!initialLog);
            try {
                // 최신 상태를 위해 단건 조회로 다시 확인한다.
                const data = await getLogById(id);
                if (!alive) return;
                setLog(data);
            } catch (e) {
                if (!alive) return;
                setErr(e?.response?.data?.message || "기록을 불러오지 못했습니다.");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        };

        load();
        return () => {
            // 언마운트 이후 setState 방지용 플래그
            alive = false;
        };
    }, [id, initialLog]);

    if (loading && !log) {
        return (
            <div className="container log-detail-page">
                <p className="empty-state">로딩...</p>
            </div>
        );
    }

    if (!log) {
        return (
            <div className="container log-detail-page">
                <p className="empty-state">기록을 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="container log-detail-page">
            <div className="detail-header">
                <div>
                    <h2 className="detail-title">기록 상세</h2>
                    <p className="detail-subtitle">
                        {log.game} {log.date ? `- ${log.date}` : ""}
                    </p>
                </div>
                <div className="detail-actions">
                    <Link className="btn btn--secondary" to="/dashboard">목록</Link>
                    <Link className="btn" to={`/logs/${log._id}/edit`} state={{ log }}>
                        수정
                    </Link>
                </div>
            </div>

            {err && <p className="detail-error">{err}</p>}

            <section className="card detail-card">
                <div className="detail-main">
                    <div className="detail-image">
                        {log.image?.url ? (
                            <img
                                src={log.image.url}
                                alt={log.game || "log"}
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        ) : (
                            <div className="detail-image__placeholder">이미지가 없습니다.</div>
                        )}
                    </div>

                    <div className="detail-meta">
                        <div className="detail-meta__row">
                            <span className="detail-label">게임</span>
                            <span className="detail-value">{log.game}</span>
                        </div>
                        <div className="detail-meta__row">
                            <span className="detail-label">날짜</span>
                            <span className="detail-value">{log.date}</span>
                        </div>
                        <div className="detail-meta__row">
                            <span className="detail-label">결과</span>
                            <span className="detail-value">{log.result}</span>
                        </div>
                        <div className="detail-meta__row">
                            <span className="detail-label">공개</span>
                            <span className={`status-badge ${log.isPublic ? "is-public" : "is-private"}`}>
                                {log.isPublic ? "공개" : "비공개"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="detail-notes">
                    <h3 className="detail-notes__title">설명</h3>
                    <p className="detail-notes__body">{log.notes || "설명이 없습니다."}</p>
                </div>
            </section>
        </div>
    );
}
