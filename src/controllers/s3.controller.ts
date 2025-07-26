import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import * as s3Service from '../services/s3.service';

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage()
});

/**
 * PUT Object - Upload a file to a bucket with a specific key
 */
const putObject = async (req: Request, res: Response) => {
    try {
        const { bucket, key } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Ensure bucket exists
        s3Service.ensureBucketExists(bucket);
        
        // Prepare file path
        const filePath = s3Service.getFilePath(bucket, key);
        
        // Save file to disk
        await s3Service.saveFile(filePath, file.buffer);
        
        res.status(200).json({
            message: 'File uploaded successfully',
            bucket,
            key,
            size: file.size,
            mimetype: file.mimetype
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

/**
 * GET Object - Download a file from a bucket with a specific key
 */
const getObject = async (req: Request, res: Response) => {
    try {
        const { bucket, key } = req.params;
        const filePath = s3Service.getFilePath(bucket, key);

        if (!s3Service.fileExists(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Send file directly
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
};

/**
 * LIST Bucket - List all files in a bucket
 */
const listBucket = async (req: Request, res: Response) => {
    try {
        const { bucket } = req.params;
        const bucketPath = s3Service.getBucketPath(bucket);

        if (!s3Service.fileExists(bucketPath)) {
            return res.status(404).json({ error: 'Bucket not found' });
        }

        const files = await s3Service.listBucketContents(bucketPath);
        
        res.status(200).json({
            bucket,
            files
        });
    } catch (error) {
        console.error('Error listing bucket:', error);
        res.status(500).json({ error: 'Failed to list bucket contents' });
    }
};

/**
 * DELETE Object - Delete a file from a bucket with a specific key
 */
const deleteObject = async (req: Request, res: Response) => {
    try {
        const { bucket, key } = req.params;
        const filePath = s3Service.getFilePath(bucket, key);

        if (!s3Service.fileExists(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        await s3Service.deleteFile(filePath);
        
        res.status(200).json({
            message: 'File deleted successfully',
            bucket,
            key
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};

export {
    upload,
    putObject,
    getObject,
    listBucket,
    deleteObject
};
