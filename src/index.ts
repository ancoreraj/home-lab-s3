import express from 'express';
import * as s3Controller from './controllers/s3.controller';

const app = express();
const port = 3000;

// PUT Object
app.put('/:bucket/:key', s3Controller.upload.single('file'), s3Controller.putObject);

// GET Object
app.get('/:bucket/:key', s3Controller.getObject);

// LIST Bucket
app.get('/:bucket', s3Controller.listBucket);

// DELETE Object
app.delete('/:bucket/:key', s3Controller.deleteObject);

app.listen(port, '0.0.0.0', () => {
    console.log(`S3 clone server running at http://0.0.0.0:${port}`);
});
