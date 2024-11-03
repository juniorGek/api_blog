import multer from "multer";
// import {s3Upload} from "./awsS3Bucket";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const files = [
        'image/svg+xml',
        'image/jpeg',
        'image/webp',
        'application/pdf',
        'image/png',
        'image/jpg',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    if (files.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {fileSize: 52428800, files: 10},
});
