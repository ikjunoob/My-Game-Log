import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET } = process.env;

// ⚠️ S3 미설정 시에도 서버 실행 가능하게 처리
if (!AWS_REGION || !S3_BUCKET) {
    console.warn("⚠️ S3 환경변수 누락 — presign 호출 시 오류 발생 가능");
}

export const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export async function presignPut(Key, ContentType, sec = 300) {
    if (!S3_BUCKET) throw new Error("S3_BUCKET is not configured");
    const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key, ContentType });
    return getSignedUrl(s3, cmd, { expiresIn: sec });
}

export async function deleteS3Object(Key) {
    if (!S3_BUCKET || !Key) return;
    const cmd = new DeleteObjectCommand({ Bucket: S3_BUCKET, Key });
    await s3.send(cmd);
}
