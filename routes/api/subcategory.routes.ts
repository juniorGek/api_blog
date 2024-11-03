import { Router } from 'express';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { delSubcategory, fetchAllSubcategory, fetchSubcategories, fetchSubcategory, postSubcategory } from '../../controllers/subcategory.controller';
// import { delCategory, fetchCategories, fetchCategory, postCategory } from '../../controllers/category.controller';

const subcategoryRoutes = Router();

subcategoryRoutes.get('/subcategories', fetchSubcategories)
subcategoryRoutes.get('/all', fetchAllSubcategory)

subcategoryRoutes.get('/', fetchSubcategory);
subcategoryRoutes.post('/',authCheck({isAdmin: true, isEmployee: true}), postSubcategory);
subcategoryRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), delSubcategory);

export default subcategoryRoutes;
