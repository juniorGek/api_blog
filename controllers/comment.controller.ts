import CommentReply from '../models/comment_reply.model';
import Blog from '../models/blog.model';
import Comment from '../models/comment.model';
import mongoose from 'mongoose';
import Answer from '../models/answer.model';
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'secret'

export const postComment = async (req, res) => {
    try {
        const body = req.body;
        const comment = new Comment({
            ...body,
        });
        await comment.save();

        // Update the number of comments in the blog
        await Blog.findOneAndUpdate(
            { _id: comment.blog_id },
            {
                $inc: {
                    number_of_comments: 1,
                },
            }
        );

        return res.status(200).send({
            error: false,
            msg: 'Comment Added successfully',
            data: comment,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const getComments = async (req, res) => {
    try {
        const {query} = req
        const { blog } = req.query;

        //@ts-ignore
        const getComments = await Comment.aggregatePaginate(
            Comment.aggregate([
            {
                $match: {
                    blog_id: new mongoose.Types.ObjectId(blog)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {'id': "$user_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                        {
                            $project: {
                                password: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0,
                            }
                        }
                    ],
                    as: 'user_id'
                }
            },
            {$unwind: {path: '$user_id', preserveNullAndEmptyArrays: true}},

            {
                $lookup: {
                    from: 'comment_replies',
                    let: {'ids': "$replies"},
                    pipeline: [
                        {$match: {$expr: {$in: ['$_id', '$$ids']}}},
                        {
                            $lookup: {
                                from: 'users',
                                let: {'id': "$user_id"},
                                pipeline: [
                                    {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                                    {
                                        $project: {
                                            password: 0,
                                            createdAt: 0,
                                            updatedAt: 0,
                                            __v: 0,
                                        }
                                    }
                                ],
                                as: 'user_id'
                            }
                        },
                        {$unwind: {path: '$user_id', preserveNullAndEmptyArrays: true}},
                    ],
                    as: 'replies'
                }
            },
            
        ]),
        {
                page: query.page || 1,
                limit: query.size || 10,
                sort: { createdAt: -1 },
            }
        )

        return res.status(200).send({
            error: false,
            msg: 'Comments fetched successfully',
            data: getComments
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const getCommentListAdmin = async (req, res) => {
    try {
        const { query } = req;

        //@ts-ignore
        const getComments = await Comment.aggregatePaginate(Comment.aggregate([
            {
                $match: {
                    blog_id: new mongoose.Types.ObjectId(query.blog)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {'id': "$user_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                        {
                            $project: {
                                password: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0,
                            }
                        }
                    ],
                    as: 'user_id'
                }
            },
            {$unwind: {path: '$user_id', preserveNullAndEmptyArrays: true}},
        ]), {
            page: query.page || 1,
            limit: query.size || 15,
            sort: {createdAt: -1},
        })

        return res.status(200).send({
            error: false,
            msg: 'Comments fetched successfully',
            data: getComments
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const getCommentReplyListByIdAdmin = async (req, res) => {
    try {
        const { query } = req;

        //@ts-ignore
        const getComments = await CommentReply.aggregatePaginate(CommentReply.aggregate([
            {
                $match: {
                    parent_comment_id: new mongoose.Types.ObjectId(query.comment)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {'id': "$user_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                        {
                            $project: {
                                password: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0,
                            }
                        }
                    ],
                    as: 'user_id'
                }
            },
            {$unwind: {path: '$user_id', preserveNullAndEmptyArrays: true}},
        ]), {
            page: query.page || 1,
            limit: query.size || 15,
            sort: {createdAt: -1},
        })

        return res.status(200).send({
            error: false,
            msg: 'Comments fetched successfully',
            data: getComments
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};


export const deleteComment = async (req, res) => {
    try {
        const { query } = req;

        const comment = await Comment.findOne({ _id: query._id });

        await Comment.deleteOne({ _id: query._id });

        //get number of replies of the comment from comment_reply collection
        const replies = await CommentReply.countDocuments({
            parent_comment_id: query._id,
        });


        //also delete all the replies of the comment from comment_reply collection
        await CommentReply.deleteMany({ parent_comment_id: query._id });

        // Update the number of comments in the blog
        const updatedBlog = await Blog.findOneAndUpdate(
            { _id: comment.blog_id },
            {
                $inc: {
                    number_of_comments: -1 - replies,
                },
            }
        ).exec();

        if (!updatedBlog) {
            return res.status(404).json({
                error: true,
                msg: 'Blog not found or update failed',
            });
        }

        return res.status(200).send({
            error: false,
            msg: 'Comment deleted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

//post comment for a post 
export const postCommentForAnswer = async (req, res) => {
    try {
        const body = req.body;
        const comment = new Comment({
            ...body,
        });
        await comment.save();

        // Update the number of comments in the blog
        await Answer.findOneAndUpdate(
            { _id: comment.answer_id },
            {
                $inc: {
                    number_of_comments: 1,
                },
            }
        );

        return res.status(200).send({
            error: false,
            msg: 'Comment Added successfully',
            data: comment,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

export const getCommentsOfAnswer = async (req, res) => {
    try {
        const {query} = req
        const { answer } = req.query;

        //@ts-ignore
        const getComments = await Comment.aggregatePaginate(
            Comment.aggregate([
            {
                $match: {
                    answer_id: new mongoose.Types.ObjectId(answer)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {'id': "$user_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                        {
                            $project: {
                                password: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0,
                            }
                        }
                    ],
                    as: 'user_id'
                }
            },
            {$unwind: {path: '$user_id', preserveNullAndEmptyArrays: true}},

            {
                $lookup: {
                    from: 'comment_replies',
                    let: {'ids': "$replies"},
                    pipeline: [
                        {$match: {$expr: {$in: ['$_id', '$$ids']}}},
                        {
                            $lookup: {
                                from: 'users',
                                let: {'id': "$user_id"},
                                pipeline: [
                                    {$match: {$expr: {$eq: ['$_id', '$$id']}}},
                                    {
                                        $project: {
                                            password: 0,
                                            createdAt: 0,
                                            updatedAt: 0,
                                            __v: 0,
                                        }
                                    }
                                ],
                                as: 'user_id'
                            }
                        },
                        {$unwind: {path: '$user_id', preserveNullAndEmptyArrays: true}},
                    ],
                    as: 'replies'
                }
            },
            
        ]),
        {
                page: query.page || 1,
                limit: query.size || 10,
                sort: { createdAt: -1 },
            }
        )

        return res.status(200).send({
            error: false,
            msg: 'Comments fetched successfully',
            data: getComments
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const deleteCommentForAnswer = async (req, res) => {
    try {
        const { query } = req;
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)

        const comment = await Comment.findOne({ _id: query._id });

        
        if((comment.user_id.toString() !== res.locals.user._id.toString()) && res.locals.user.role !== 'admin'){
            return res.status(403).send({
                error: true,
                msg: 'You do not have permission to delete this answer',
            });
        }
        
        await Comment.deleteOne({ _id: query._id });

        //get number of replies of the comment from comment_reply collection
        const replies = await CommentReply.countDocuments({
            parent_comment_id: query._id,
        });


        //also delete all the replies of the comment from comment_reply collection
        await CommentReply.deleteMany({ parent_comment_id: query._id });

        // Update the number of comments in the post
        const updatedAnswer = await Answer.findOneAndUpdate(
            { _id: comment.answer_id },
            {
                $inc: {
                    number_of_comments: -1 - replies,
                },
            }
        ).exec();

        if (!updatedAnswer) {
            return res.status(404).json({
                error: true,
                msg: 'Post not found or update failed',
            });
        }

        return res.status(200).send({
            error: false,
            msg: 'Comment deleted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}
