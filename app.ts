import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import apiRouters from './routes/api';
import { createServer } from 'http';
import fileUpload from 'express-fileupload';

import { LeanDocument } from 'mongoose';



//init app
const app = express();

// middleware
app.use(express.json({limit: '25mb'}));
app.use(compression());
app.use(helmet());
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cors());

const PORT = process.env.PORT || 8990;
app.listen(PORT, () => console.log(`Server is listening on port : ${PORT}`));

    // middleware
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*'); //* will allow from all cross domain
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
        );
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        next();
    });

// database connection
mongoose.set('strictQuery', false);
mongoose
    .connect(
        process.env.NODE_ENV === 'development' ?
            process.env.DB_STRING_DEVELOPMENT :
            process.env.DB_STRING
    )
    .then((response) => {
        console.log('MongoDB Connected Successfully.');
    })
    .catch((err) => {
        console.log(err.message);
        console.log('Database connection failed.');
    });

// morgan routes view
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan connected..');
}

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}))

// multer error handler
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'file is too large',
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'File limit reached',
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: 'File must be an image/pdf/csv',
            });
        }
    }
});

app.use(express.json())

// api routes
app.use('/api', apiRouters);
// server welcome message
app.use('/', (req, res, next) => {
    return res.status(200).json({
        error: false,
        msg: 'Welcome to Blog Site',
    });
});
