import express from 'express';

const fileRoutes = express.Router();
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import {  fileRemoveFromAws, multipleFileUplaod, singleFileUplaod, singleImageUplaod } from '../../controllers/files.controller';

fileRoutes.post('/single-image-aws', isLoggedIn, singleFileUplaod);
fileRoutes.post('/single-image-upload', isLoggedIn, singleImageUplaod);
fileRoutes.post('/multiple-image-aws', authCheck({isAdmin: true, isEmployee: true}), multipleFileUplaod);
fileRoutes.post('/remove-aws', isLoggedIn, fileRemoveFromAws);

export default fileRoutes;