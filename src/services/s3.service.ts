import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const getBucketPath = (bucket: string) => {
    return path.join(UPLOADS_DIR, bucket);
};

export const ensureBucketExists = (bucketPath: string) => {
    if (!fs.existsSync(bucketPath)) {
        fs.mkdirSync(bucketPath, { recursive: true });
    }
};

export const getFilePath = (bucket: string, key: string) => {
    return path.join(UPLOADS_DIR, bucket, key);
};

export const fileExists = (filePath: string) => {
    return fs.existsSync(filePath);
};

export const deleteFile = (filePath: string, callback: (err: NodeJS.ErrnoException | null) => void) => {
    fs.unlink(filePath, callback);
};

export const listBucketContents = (bucketPath: string, callback: (err: NodeJS.ErrnoException | null, files: string[]) => void) => {
    fs.readdir(bucketPath, callback);
};
