import { isLoggedIn } from "../../middlewares/auth";
import { deleteQuestion, downvoteQuestion, getQuestion, getQuestions, giveVote, postQuestion, upvoteQuestion } from "../../controllers/question.controller";
import { Router } from "express";

const questionRoutes = Router();

questionRoutes.post('/',isLoggedIn,postQuestion)
questionRoutes.get('/',getQuestions)
questionRoutes.get('/details',getQuestion)

questionRoutes.post('/upvote',isLoggedIn,upvoteQuestion)
questionRoutes.post('/downvote',isLoggedIn,downvoteQuestion)

questionRoutes.post('/vote',isLoggedIn,giveVote)

questionRoutes.delete('/',isLoggedIn,deleteQuestion)


export default questionRoutes;