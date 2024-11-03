import { Router } from 'express';

import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { getDashboardFrontend } from '../../controllers/dashboard-frontend.controller';

const dashboardFrontendRoutes = Router();

dashboardFrontendRoutes.get('/dashboard-frontend',authCheck({isAdmin: true, isEmployee: true}), getDashboardFrontend)

export default dashboardFrontendRoutes;