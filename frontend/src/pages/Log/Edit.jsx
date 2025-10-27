import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listLogs, updateLog } from "../../api/logs";
import { presign, putToS3 } from "../../api/storage";
import LogForm from "./LogForm";

export default function Edit() {
    const { id } = useParams();
    const nav = useNavigate();
    const loc = useLocation();

    const [submitting, setSubmitting] = useState(false);
    const [initial, setInitial] = useState(() => loc.state?.log || null);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (initial) return;
        (async () => {
            try {
                const data = await listLogs();
                const found = data.find((v) => v._id === id);
                setInitial(found || null);
            } catch {
                setErr("기록을 불러오지 못했습니다.");
            }
        })();
    }, [id, initial]);

    async function handleSubmit(f) {
        setSubmitting(true);
        setErr("");
        try {
            let imageField = undefined;
            if (f.image instanceof File) {
                if (!/^image\//.test(f.image.type)) throw new Error("이미지 파일만 업로드 가능합니다.");
                if (f.image.size > 2 * 1024 * 1024) throw new Error("이미지는 2MB 이하만 허용합니다.");

                const p = await presign(f.image.name, f.image.type);
                await putToS3(p.uploadUrl, f.image);
                imageField = { key: p.key, url: p.viewUrl || null };
            }

            const payload = {
                game: f.game,
                date: f.date,
                result: f.result,
                notes: f.notes,
                isPublic: f.isPublic, // ✅ 수정 반영
                ...(imageField ? { image: imageField } : {}),
            };

            await updateLog(id, payload);
            nav("/dashboard", { replace: true });
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "수정 실패");
        } finally {
            setSubmitting(false);
        }
    }

    if (!initial) return <div className="container" style={{ padding: "2rem" }}>로딩...</div>;

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>기록 수정</h2>
            {err && <div style={{ color: "var(--danger)", marginBottom: 8 }}>{err}</div>}
            <LogForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
            <p style={{ color: "var(--muted)", marginTop: 8 }}>※ 새 이미지를 선택하지 않으면 기존 이미지를 유지합니다.</p>
        </div>
    );
}
