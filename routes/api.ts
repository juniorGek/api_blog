import { Router } from 'express';
import userRoute from './api/user.routes';
import subscriberRoutes from './api/subscriber.routes';
import fileRoutes from './api/files.routes';
import categoryRoutes from './api/category.routes';
import tagRoutes from './api/tags.routes';
import commentRoutes from './api/comment.routes';
import blogRoutes from './api/blog.routes';
import commentReplyRoutes from './api/comment_reply.routes';
import contactUsRoutes from './api/contact_us.routes';
import settingsRoutes from './api/settings.routes';
import dashboardFrontendRoutes from './api/dashboard-frontend.routes';
import languageRoutes from './api/language.routes';
import subcategoryRoutes from './api/subcategory.routes';
import storyRoutes from './api/story.routes';
import galleryRoutes from './api/gallery.routes';
import departmentRoutes from './api/department.routes';
import roleRoutes from './api/roles.routes';
import answerRoutes from './api/answer.routes';
import questionRoutes from './api/question.routes';

const apiRouters = Router();

apiRouters.get('/', (req, res) => {
    res.json({ message: "Bonjour, voici votre réponse JSON!" });
});
  

apiRouters.use('/file', fileRoutes);

apiRouters.use('/user', userRoute);
apiRouters.use('/subscriber', subscriberRoutes);

apiRouters.use('/category', categoryRoutes);
apiRouters.use('/subcategory',subcategoryRoutes);
apiRouters.use('/tag', tagRoutes);

apiRouters.use('/blog', blogRoutes);
apiRouters.use('/comments', commentRoutes)
apiRouters.use('/comment-reply', commentReplyRoutes)

apiRouters.use('/contact-us', contactUsRoutes)

apiRouters.use('/settings', settingsRoutes);
apiRouters.use('/language', languageRoutes)

apiRouters.use('/dashboard',dashboardFrontendRoutes)

apiRouters.use('/story',storyRoutes)

apiRouters.use('/gallery',galleryRoutes)

apiRouters.use('/role',roleRoutes)
apiRouters.use('/department',departmentRoutes)

apiRouters.use('/question', questionRoutes)
apiRouters.use('/answer', answerRoutes)


export default apiRouters;
