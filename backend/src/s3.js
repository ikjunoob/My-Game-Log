// backend/src/s3.js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const required = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_BUCKET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) console.error("[S3 ENV Missing]", missing);

export const Bucket = process.env.S3_BUCKET;

export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function presignPut(Key, ContentType, sec = 300) {
    if (!Bucket) throw new Error("s3 bucket is undefined");
    const cmd = new PutObjectCommand({ Bucket, Key, ContentType });
    return getSignedUrl(s3, cmd, { expiresIn: sec });
}

export async function presignGet(Key, sec = 300) {
    if (!Bucket) throw new Error("s3 bucket is undefined");
    const cmd = new GetObjectCommand({ Bucket, Key });
    return getSignedUrl(s3, cmd, { expiresIn: sec });
}

export async function deleteS3Object(Key) {
    if (!Bucket || !Key) return;
    const cmd = new DeleteObjectCommand({ Bucket, Key });
    await s3.send(cmd);
}