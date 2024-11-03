import { Router } from 'express';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { delCategory, fetchCategories, fetchCategoriesWithoutPaginate, fetchCategory, postCategory, treeCategory } from '../../controllers/category.controller';

const categoryRoutes = Router();

categoryRoutes.get('/categories', fetchCategories)
categoryRoutes.get('/all', fetchCategoriesWithoutPaginate)
categoryRoutes.get('/treecategory', treeCategory)
categoryRoutes.get('/', fetchCategory);
categoryRoutes.post('/',authCheck({isAdmin: true, isEmployee: true}), postCategory);
categoryRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), delCategory);

export default categoryRoutes;
