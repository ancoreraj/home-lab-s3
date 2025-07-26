import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import * as s3Service from '../services/s3.service';

/**
 * Helper function to get file extension from mimetype or existing filename
 */
const getFileExtension = (mimetype: string, filename: string): string => {
    // Check if filename already has an extension
    const existingExt = path.extname(filename);
    if (existingExt) {
        return existingExt.slice(1); // Remove the dot
    }

    // Map common mimetypes to extensions
    const mimeToExtMap: {[key: string]: string} = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'text/plain': 'txt',
        'text/html': 'html',
        'text/css': 'css',
        'text/csv': 'csv',
        'text/javascript': 'js',
        'application/json': 'json',
        'application/xml': 'xml',
        'application/pdf': 'pdf',
        'application/zip': 'zip',
        'application/x-zip-compressed': 'zip',
        'application/x-7z-compressed': '7z',
        'application/x-tar': 'tar',
        'application/x-rar-compressed': 'rar',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'video/mp4': 'mp4',
        'video/mpeg': 'mpeg',
        'video/quicktime': 'mov',
        'video/webm': 'webm'
    };

    return mimeToExtMap[mimetype] || ''; // Return empty string if no matching extension found
};

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage()
});

/**
 * PUT Object - Upload a file to a bucket with an optional key
 */
const putObject = async (req: Request, res: Response) => {
    try {
        const { bucket } = req.params;
        let key = req.query.key as string || '';
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Case 3: If key is not provided, use the original filename
        if (!key) {
            key = file.originalname;
        } 
        // Case 1 & 2: If key is provided, check extension
        else {
            // Get appropriate file extension based on mimetype
            const extension = getFileExtension(file.mimetype, key);
            
            // Case 1: Add file extension if it's not already there (only if extension exists)
            if (extension && !key.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
                key = `${key}.${extension}`;
            }
            // Case 2: If key already has extension, use as is (handled implicitly)
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
