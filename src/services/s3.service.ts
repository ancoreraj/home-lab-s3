import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const getBucketPath = (bucket: string): string => {
    return path.join(UPLOADS_DIR, bucket);
};

/**
 * Ensure a bucket exists (create it if it doesn't)
 */
export const ensureBucketExists = (bucket: string): void => {
    const bucketPath = getBucketPath(bucket);
    if (!fs.existsSync(bucketPath)) {
        fs.mkdirSync(bucketPath, { recursive: true });
    }
};

/**
 * Create a new bucket
 * @returns true if bucket was created, false if it already existed
 */
export const createBucket = (bucket: string): boolean => {
    const bucketPath = getBucketPath(bucket);
    if (fs.existsSync(bucketPath)) {
        return false; // Bucket already exists
    }
    fs.mkdirSync(bucketPath, { recursive: true });
    return true;
};

/**
 * Delete a bucket if it is empty
 * @returns true if bucket was deleted, false if it doesn't exist or is not empty
 */
export const deleteBucket = async (bucket: string): Promise<{ deleted: boolean; isEmpty: boolean; exists: boolean }> => {
    const bucketPath = getBucketPath(bucket);
    
    // Check if bucket exists
    if (!fs.existsSync(bucketPath)) {
        return { deleted: false, isEmpty: false, exists: false };
    }
    
    // Check if bucket is empty
    const files = await fs.promises.readdir(bucketPath);
    if (files.length > 0) {
        return { deleted: false, isEmpty: false, exists: true };
    }
    
    // Delete the bucket if it's empty
    try {
        fs.rmdirSync(bucketPath);
        return { deleted: true, isEmpty: true, exists: true };
    } catch (error) {
        console.error(`Error deleting bucket ${bucket}:`, error);
        return { deleted: false, isEmpty: true, exists: true };
    }
};

export const getFilePath = (bucket: string, key: string): string => {
    return path.join(UPLOADS_DIR, bucket, key);
};

export const fileExists = (filePath: string): boolean => {
    return fs.existsSync(filePath);
};

export const saveFile = (filePath: string, fileBuffer: Buffer): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileBuffer, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

export const getFile = (filePath: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

export const listBucketContents = (bucketPath: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        fs.readdir(bucketPath, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
};

/**
 * List all buckets in the uploads directory
 */
export const listAllBuckets = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        fs.readdir(UPLOADS_DIR, (err, files) => {
            if (err) reject(err);
            else {
                // Filter out non-directories
                Promise.all(files.map(file => {
                    const filePath = path.join(UPLOADS_DIR, file);
                    return new Promise<{name: string, isDirectory: boolean}>((res) => {
                        fs.stat(filePath, (err, stats) => {
                            if (err || !stats.isDirectory()) {
                                res({name: file, isDirectory: false});
                            } else {
                                res({name: file, isDirectory: true});
                            }
                        });
                    });
                }))
                .then(results => {
                    // Only return directories as buckets
                    const buckets = results.filter(item => item.isDirectory)
                                          .map(item => item.name);
                    resolve(buckets);
                })
                .catch(error => reject(error));
            }
        });
    });
};
