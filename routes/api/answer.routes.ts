import { isLoggedIn } from '../../middlewares/auth';
import { deleteAnswer, downvoteAnswer, getAnswer, getAnswers, getMostUpvotedAnswers, postAnswer, upvoteAnswer } from "../../controllers/answer.controller";
import { Router } from "express";

const answerRoutes = Router();

answerRoutes.post('/',isLoggedIn,postAnswer)
answerRoutes.get('/',getMostUpvotedAnswers)
answerRoutes.get('/detail',getAnswer)
answerRoutes.delete('/',isLoggedIn,deleteAnswer)
answerRoutes.post('/upvote',isLoggedIn,upvoteAnswer)
answerRoutes.post('/downvote',isLoggedIn,downvoteAnswer)

answerRoutes.delete('/',isLoggedIn,deleteAnswer)

export default answerRoutes;