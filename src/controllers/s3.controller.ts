import { Request, Response } from 'express';
import multer from 'multer';
import * as s3Service from '../services/s3.service';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { bucket, key } = req.params;
        if (!bucket) {
            return cb(new Error('Bucket not specified'), '');
        }
        // The 'key' is treated as a path prefix (folder)
        const destinationPath = s3Service.getFilePath(bucket, key);
        s3Service.ensureBucketExists(destinationPath);
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        // Save the file with its original name inside the destination path
        cb(null, file.originalname);
    }
});

export const upload = multer({ storage: storage });

export const putObject = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).send(`File ${req.params.key} uploaded to bucket ${req.params.bucket}.`);
};

export const getObject = (req: Request, res: Response) => {
    const { bucket, key } = req.params;
    const filePath = s3Service.getFilePath(bucket, key);

    if (s3Service.fileExists(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found.');
    }
};

export const listBucket = (req: Request, res: Response) => {
    const { bucket } = req.params;
    const bucketPath = s3Service.getBucketPath(bucket);

    if (s3Service.fileExists(bucketPath)) {
        s3Service.listBucketContents(bucketPath, (err, files) => {
            if (err) {
                return res.status(500).send('Error reading bucket.');
            }
            res.json({ files: files });
        });
    } else {
        res.status(404).send('Bucket not found.');
    }
};

export const deleteObject = (req: Request, res: Response) => {
    const { bucket, key } = req.params;
    const filePath = s3Service.getFilePath(bucket, key);

    if (s3Service.fileExists(filePath)) {
        s3Service.deleteFile(filePath, (err) => {
            if (err) {
                return res.status(500).send('Error deleting file.');
            }
            res.status(200).send(`File ${key} deleted from bucket ${bucket}.`);
        });
    } else {
        res.status(404).send('File not found.');
    }
};
