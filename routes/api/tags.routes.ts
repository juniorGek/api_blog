import { Router } from 'express';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { delTag, fetchTag, fetchTags, fetchTagsWithoutPaginate, postTag } from '../../controllers/tag.controller';

const tagRoutes = Router();

tagRoutes.get('/tags', fetchTags)
tagRoutes.get('/all', fetchTagsWithoutPaginate);
tagRoutes.get('/', fetchTag);
tagRoutes.post('/',authCheck({isAdmin: true, isEmployee: true}), postTag);
tagRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), delTag);

export default tagRoutes;
