import {PutObjectCommand, S3Client, DeleteObjectCommand} from "@aws-sdk/client-s3"
import sharp from 'sharp';
const s3Config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
}

let s3Client = new S3Client(s3Config);

export const uploadFile = async (file: any, folder: string, name: String = '') => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `live/${folder}/${!!name ? `${name}.${file?.name?.split('.').pop()}` : file.name}`,
            Body: file.data,
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/live/${folder}/${!!name ? `${name}.${file?.name?.split('.').pop()}` : file.name}`
    } catch (e) {
        return null;
    }
}

export const deleteFile = async (file: string = '') => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file,
    });
    try {
        const response = await s3Client.send(command);
    } catch (err) {
        console.error(err);
    }
};

export const uploadWebpImage = async ({file, folder, name="image", size}) => {
    try {
        let sharpedImage: any;
        if(size) {
            sharpedImage = await sharp(file.data).resize(Number(size?.split(',')[0]), Number(size?.split(',')[1])).toFormat('webp').toBuffer()
        } else {
            sharpedImage = await sharp(file.data).toFormat('webp').toBuffer()
        }
        const sharpParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `live/${folder}/${!!name ? `${name}.webp` : file.name}`,
            Body: sharpedImage,
            ContentType: 'image/webp', // Adjust content type if needed
        };
        const command = new PutObjectCommand(sharpParams);
        await s3Client.send(command);
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/live/${folder}/${!!name ? `${name}.webp` : file.name}`
    } catch (e) {
        return null;
    }
}

