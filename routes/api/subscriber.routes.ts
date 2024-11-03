import { Router } from 'express';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { getSubscribersList, subscribe, unsubscribe } from '../../controllers/subscriber.controller';

const subscriberRoutes = Router();

subscriberRoutes.get('/',authCheck({isAdmin: true, isEmployee: true}), getSubscribersList);
subscriberRoutes.post('/subscribe',subscribe)
subscriberRoutes.post('/unsubscribe',unsubscribe)


export default subscriberRoutes;