import { fetchSettings, fetchSiteSettings, updateSettings } from '../../controllers/settings.controller';
import {Router} from 'express';
import { authCheck, isAdmin } from '../../middlewares/auth';

const settingsRoutes = Router();

settingsRoutes.post('/', authCheck({isAdmin: true, isEmployee: true}), updateSettings)
settingsRoutes.get('/site', fetchSiteSettings)
settingsRoutes.get('/', authCheck({isAdmin: true, isEmployee: true}), fetchSettings)


export default settingsRoutes;



