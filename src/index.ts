import express from 'express';
import { config } from 'dotenv';
import * as s3Controller from './controllers/s3.controller';

// Load environment variables
config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware to allow cross-origin requests (since you'll access from another machine)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API Routes

// PUT Object - Upload a file to a bucket (key is optional query parameter)
app.put('/upload/:bucket', s3Controller.upload.single('file'), s3Controller.putObject);

// GET Object - Download a file from a bucket with a specific key
app.get('/download/:bucket/:key', s3Controller.getObject);

// LIST Bucket - List all files in a bucket
app.get('/list/:bucket', s3Controller.listBucket);

// LIST All Buckets - List all available buckets
app.get('/buckets', s3Controller.listAllBuckets);

// DELETE Object - Delete a file from a bucket with a specific key
app.delete('/delete/:bucket/:key', s3Controller.deleteObject);

// Root endpoint for API health check
app.get('/health', (req, res) => {
    res.json({
        message: 'S3 Clone API is running',
        endpoints: [
            { method: 'PUT', path: '/upload/:bucket/:key', description: 'Upload a file to a bucket' },
            { method: 'GET', path: '/download/:bucket/:key', description: 'Download a file from a bucket' },
            { method: 'GET', path: '/list/:bucket', description: 'List all files in a bucket' },
            { method: 'DELETE', path: '/delete/:bucket/:key', description: 'Delete a file from a bucket' }
        ]
    });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`S3 Clone server running at http://0.0.0.0:${port}`);
    console.log(`Access from other machines using your IP address`);
});
