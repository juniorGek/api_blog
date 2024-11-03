import { Router } from 'express';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { deleteGallery, fetchGalleries, fetchGallery, postGallery } from '../../controllers/gallery.controller';

const galleryRoutes = Router();

galleryRoutes.get('/images',authCheck({isAdmin: true, isEmployee: true}), fetchGalleries)
galleryRoutes.get('/image', fetchGallery);
galleryRoutes.post('/image',authCheck({isAdmin: true, isEmployee: true}), postGallery);
galleryRoutes.delete('/image',authCheck({isAdmin: true, isEmployee: true}), deleteGallery);

export default galleryRoutes;

