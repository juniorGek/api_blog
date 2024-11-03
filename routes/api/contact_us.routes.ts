import {Router} from "express";
import {
    createContactUs, getAllContactUs, deleteContactUs, replyMsg
} from "../../controllers/contact_us.controller";
import { authCheck, isAdmin } from "../../middlewares/auth";

const contactUsRoutes = Router()

contactUsRoutes.post('/', createContactUs);
contactUsRoutes.post('/msg-reply', authCheck({isAdmin: true, isEmployee: true}), replyMsg);
contactUsRoutes.get('/list', authCheck({isAdmin: true, isEmployee: true}), getAllContactUs);
contactUsRoutes.get('/', authCheck({isAdmin: true, isEmployee: true}), getAllContactUs);
contactUsRoutes.delete('/', authCheck({isAdmin: true, isEmployee: true}), deleteContactUs);

export default contactUsRoutes