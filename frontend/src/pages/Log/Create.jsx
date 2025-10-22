import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLog } from "../../api/logs";
import LogForm from "./LogForm";

export default function Create() {
    const nav = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (f) => {
        setSubmitting(true);
        try {
            const fd = new FormData();
            ["game", "date", "result", "notes"].forEach(k => fd.append(k, f[k] || ""));
            if (f.image) fd.append("image", f.image);
            await createLog(fd);
            nav("/dashboard", { replace: true });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>새 기록</h2>
            <LogForm onSubmit={handleSubmit} submitting={submitting} />
        </div>
    );
}
