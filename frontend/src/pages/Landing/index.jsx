// src/pages/Landing/index.jsx
import { Link } from "react-router-dom";
import "./Landing.scss";

export default function Landing() {
    const token = localStorage.getItem("token");
    return (
        <section className="landing">
            <div className="container">
                <div className="landing-hero card" style={{ padding: "2rem" }}>
                    <h1>나의 게임 기록</h1>
                    <p className="landing-sub">게임 결과를 간단히 기록하고, 나중에 다시 보자.</p>
                    {token ? (
                        <Link className="btn" to="/dashboard">대시보드로 가기</Link>
                    ) : (
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Link className="btn" to="/login">시작하기</Link>
                            <Link className="btn" to="/register">회원가입</Link>
                        </div>
                    )}
                </div>
                <ul className="landing-features">
                    <li><h3>빠른 기록</h3><p>이미지와 함께 결과/메모를 저장.</p></li>
                    <li><h3>검색/정렬</h3><p>게임명, 날짜로 빠르게 찾기.</p></li>
                    <li><h3>권한</h3><p>일반/관리자 권한 분리.</p></li>
                </ul>
            </div>
        </section>
    );
}
