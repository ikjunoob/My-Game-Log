import { Link } from "react-router-dom";
import "./Landing.scss";

export default function Landing() {
    const token = localStorage.getItem("token");
    return (
        <section className="landing">
            <div className="container">
                <div className="landing-hero card" style={{ padding: "2rem" }}>
                    <h1>My Game-Log</h1>
                    <p className="landing-sub">게임 결과를 간단히 기록하고, 지난 최고의 날을 되돌아보자</p>

                    {token ? (
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Link className="btn" to="/dashboard">대시보드로 가기</Link>
                            <Link className="btn" to="/feed">공개 피드 보기</Link>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: "10px" }}>
                            {/* 시작하기 = 기본(파랑), 회원가입 = 핑크, 공개 피드 = 고스트 */}
                            <Link className="btn" to="/login">시작하기</Link>
                            <Link className="btn btn--pink" to="/register">회원가입</Link>
                            <Link className="btn btn--ghost" to="/feed">공개 피드</Link>
                        </div>
                    )}
                </div>

                <ul className="landing-features">
                    <li><h2>빠른 기록</h2><p>이미지와 함께 결과/메모를 저장.</p></li>
                    <li><h2>검색/정렬</h2><p>게임명, 날짜로 빠르게 찾기.</p></li>
                    <li><h2>권한</h2><p>일반/관리자 권한 분리.</p></li>
                </ul>
            </div>
        </section>
    );
}
