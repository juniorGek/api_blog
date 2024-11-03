const {S3} = require('@aws-sdk/client-s3');
// import {v4 as uuidv4} from 'uuid';
import crypto from 'crypto';

export const s3Upload = async (files, self_folder) => {
    const s3 = new S3();
    const randNumber = crypto.randomBytes(8).toString("hex")
    const params = files.map((file) => {
        return {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${process.env.WEBSITE_NAME}-storage/${self_folder}/${randNumber}-${file.originalname}`,
            Body: file.buffer,
        };
    });

    return await Promise.all(params.map((param) => s3.upload(param).promise()));
};