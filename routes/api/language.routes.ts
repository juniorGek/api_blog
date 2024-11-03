import { authCheck, isAdmin } from '../../middlewares/auth';
import { deleteLanguage, getAllLanguages, getLanguageTranslations, getLanguages, postLanguage, postLanguageTranslations } from '../../controllers/language.controller';
import {Router} from 'express';
const languageRoutes = Router();

languageRoutes.get('/', getLanguages)
languageRoutes.get('/all', getAllLanguages)
languageRoutes.post('/',authCheck({isAdmin: true, isEmployee: true}), postLanguage)
languageRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), deleteLanguage)

languageRoutes.get('/translations', getLanguageTranslations)
languageRoutes.post('/translations',authCheck({isAdmin: true, isEmployee: true}), postLanguageTranslations)

export default languageRoutes;