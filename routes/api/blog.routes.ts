import { Router } from 'express';

import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';
import { deleteBlog, getBlog, getBlogs, postBlog,getLatestBlogs,blogsForFrontend,publishBlog, getPublishedBlogs, getFeaturedVideoBlogs, getEditorsBlogs,  getAllVideoBlogs, getPublishedBlogsForFrontend } from '../../controllers/blog.controller';

const blogRoutes = Router();

blogRoutes.get('/details', getBlog );
blogRoutes.get('/all',authCheck({isAdmin: true, isEmployee: true}), getBlogs );
blogRoutes.get('/published-frontend', getPublishedBlogsForFrontend );
blogRoutes.get('/published', getPublishedBlogs );
blogRoutes.get('/latest',  getLatestBlogs );
blogRoutes.get('/for-frontend',blogsForFrontend);
blogRoutes.get('/featured-video',getFeaturedVideoBlogs);
blogRoutes.get('/all-video',getAllVideoBlogs)
blogRoutes.get('/editors-choice',getEditorsBlogs);
blogRoutes.post('/',authCheck({isAdmin: true, isEmployee: true}), postBlog);
blogRoutes.post('/publish',authCheck({isAdmin: true, isEmployee: true}), publishBlog);
blogRoutes.delete('/',authCheck({isAdmin: true, isEmployee: true}), deleteBlog);

export default blogRoutes;
