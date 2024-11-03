import {Router} from 'express';
import { authCheck, isAdmin } from '../../middlewares/auth';
import { deleteStory, deleteStoryTopic, fetchSingleStory, fetchSingleTopicStory, fetchStories, fetchStoriesByTopic, fetchStoryElement, fetchStoryTopics, fetchStoryTopicsWithoutPaginate, postStory, postStoryTopic } from '../../controllers/story.controller';

const storyRoutes = Router();

storyRoutes.post('/topic', authCheck({isAdmin: true, isEmployee: true}), postStoryTopic)
storyRoutes.get('/topic',authCheck({isAdmin: true, isEmployee: true}), fetchStoryTopics)
storyRoutes.get('/topic/for-frontend', fetchStoryTopicsWithoutPaginate)
storyRoutes.get('/topic/element', fetchStoryElement)
storyRoutes.delete('/topic', authCheck({isAdmin: true, isEmployee: true}), deleteStoryTopic)

storyRoutes.post('/', authCheck({isAdmin: true, isEmployee: true}), postStory)
storyRoutes.get('/all', fetchStories)
storyRoutes.get('/for-frontend', fetchSingleTopicStory)
storyRoutes.get('/', fetchSingleStory)
storyRoutes.delete('/', authCheck({isAdmin: true, isEmployee: true}), deleteStory)


export default storyRoutes;