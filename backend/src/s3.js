// backend/src/s3.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET } = process.env;
if (!AWS_REGION || !S3_BUCKET) console.warn("⚠️ [S3] 환경변수 누락");

export const s3 = new S3Client({
    region: AWS_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

export const presignPut = async (key, contentType, expiresIn = 300) => {
    const command = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
    return getSignedUrl(s3, command, { expiresIn });
};

export const deleteS3Object = async (key) => {
    if (!key) return;
    const cmd = new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key });
    await s3.send(cmd);
};
