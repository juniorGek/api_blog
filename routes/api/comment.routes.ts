import { Router } from 'express';

import {
    deleteComment,
    deleteCommentForAnswer,
    getCommentListAdmin,
    getComments,
    getCommentsOfAnswer,
    postComment,
    postCommentForAnswer,
} from '../../controllers/comment.controller';
import { authCheck,  isLoggedIn } from '../../middlewares/auth';

const commentRoutes = Router();

commentRoutes.get('/', getComments);
commentRoutes.get('/list', getCommentListAdmin);
commentRoutes.post('/',isLoggedIn, postComment);
commentRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), deleteComment)

//for forum posts
commentRoutes.post('/answer',isLoggedIn, postCommentForAnswer);
commentRoutes.get('/answer', getCommentsOfAnswer);
commentRoutes.delete('/answer',isLoggedIn, deleteCommentForAnswer)


export default commentRoutes;

