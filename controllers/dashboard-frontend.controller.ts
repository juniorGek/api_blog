import Comment from "../models/comment.model";
import Blog from "../models/blog.model";
import User from "../models/user.model";

export const getDashboardFrontend = async (req, res) => {
    try {
        let {body, query} = req;
        let {user} = res.locals;
       
        const totalUser = await User.find({role: 'user'}).count();
        const totalBlogs = await Blog.find().count();
        const numberOfUnpublished = await Blog.find({published:false}).count();
      
        const newMember = await User.find({role: 'user'}).select('image username name email createdAt').sort({createdAt: -1}).limit(7)

        const newComment = await Comment.aggregate([
            
            {
                $lookup: {
                    from: 'users',
                    let: {'id': "$user_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                        {
                            $project: {
                                name: 1,
                                username: 1,
                                image: 1,
                                email: 1,
                            }
                        }
                    ],
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'blogs',
                    let: {'id': "$blog_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                        {
                            $project: {
                                title: 1,
                            }
                        }
                    ],
                    as: 'blog'
                }
            },
            {
                $unwind: {
                    path: '$blog',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    'user.password': 0,
                    'user.createdAt': 0,
                    'user.updatedAt': 0,
                    'user.__v': 0,
                    'blog.password': 0,
                    'blog.createdAt': 0,
                    'blog.updatedAt': 0,
                    'blog.__v': 0,
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $limit: 7
            }
        ]
        );


        return res.status(200).send({
            error: false,
            data: {
                
                totalUser: totalUser,
                totalBlogs: totalBlogs,
                numberOfUnpublished: numberOfUnpublished,
                newMembers: newMember,
                newComments: newComment
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
};