import { Router } from 'express';

import { deleteCommentReply, getCommentReplies, postCommentReply, postCommentReplyForAnswer, 
    // postCommentReplyForPost 
} from '../../controllers/comment_reply.controller';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import {getCommentReplyListByIdAdmin} from "../../controllers/comment.controller";

const commentReplyRoutes = Router();
commentReplyRoutes.get('/', getCommentReplies);
commentReplyRoutes.get('/list', getCommentReplyListByIdAdmin);
commentReplyRoutes.post('/',isLoggedIn, postCommentReply);
commentReplyRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), deleteCommentReply);

//for post
commentReplyRoutes.post('/answer',isLoggedIn, postCommentReplyForAnswer);


export default commentReplyRoutes;