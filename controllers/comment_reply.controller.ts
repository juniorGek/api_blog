import User from '../models/user.model';
import Blog from '../models/blog.model';
import Comment from '../models/comment.model';
import CommentReply from '../models/comment_reply.model';
import mongoose from 'mongoose';
import { sendUserEmailGeneral } from '../utils/userEmailSend';
import Answer from '../models/answer.model';
import Question from '../models/question.model';

export const getCommentReplies = async (req, res) => {
    try {
        const { comment } = req.query;
        if (!comment || !mongoose.Types.ObjectId.isValid(comment)) {
            return res.status(400).send({
                error: true,
                msg: 'Invalid comment ID',
            });
        }

        const replies = await CommentReply.aggregate([
            {
                $match: {
                    parent_comment_id: new mongoose.Types.ObjectId(comment),
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $project: {
                    _id: 1,
                    parent_comment_id: 1,
                    comment: 1,
                    createdAt: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]);

        return res.status(200).send({
            error: false,
            msg: 'Comment Replies fetched successfully',
            data: replies,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const postCommentReply = async (req, res) => {
    try {
        const body = req.body;
        const { parent_comment_id } = req.body;
        if (!parent_comment_id) {
            const parent = Comment.findOne({ _id: parent_comment_id });
            return res.status(400).send({
                error: true,
                msg: 'Reply cannot be added to a comment',
            });
        }

        const commentReply = new CommentReply({
            ...body,
        });
        await commentReply.save();

        const comment = await Comment.findOneAndUpdate(
            { _id: parent_comment_id },
            {
                $push: {
                    replies: commentReply._id,
                },
            },
            { new: true }
        );

        // Update the number of comments in the blog
        await Blog.findOneAndUpdate(
            { _id: comment.blog_id },
            {
                $inc: {
                    number_of_comments: 1,
                },
            }
        );

        //send email to the user who get reply on his comment
        const user = await User.findOne({ _id: comment.user_id });
        const blog = await Blog.findOne({ _id: comment.blog_id });
        const data = {
            email: user.email,
            subject: 'You got a reply on your comment',
            message: `Someone replied to your comment on the blog : <br>
            <a href="${process.env.FRONTEND_DOMAIN}/blog/${blog._id}">${blog.title?.fr|| blog.title?.en}
            <img src="${blog.cover_image}" alt="blog image" style="width: 100px; height: 100px;"/> <br>
            </a> 
            `,
        };

        sendUserEmailGeneral(data);

        return res.status(200).send({
            error: false,
            msg: 'Comment Reply Added successfully',
            data: commentReply,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const deleteCommentReply = async (req, res) => {
    try {
        const { query } = req;

        const commentReply = await CommentReply.findOne({ _id: query._id });

        await CommentReply.deleteOne({ _id: query._id });

        // Update the number of comments in the blog
        const updatedBlog = await Blog.findOneAndUpdate(
            { _id: commentReply.blog_id },
            {
                $inc: {
                    number_of_comments: -1,
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
            msg: 'Comment Reply deleted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}


//post comment_reply for a post 

export const postCommentReplyForAnswer = async (req, res) => {
    try {
        const body = req.body;
        const { parent_comment_id } = req.body;
        if (!parent_comment_id) {
            const parent = Comment.findOne({ _id: parent_comment_id });
            return res.status(400).send({
                error: true,
                msg: 'Reply cannot be added to a comment',
            });
        }

        const commentReply = new CommentReply({
            ...body,
        });
        await commentReply.save();

        const comment = await Comment.findOneAndUpdate(
            { _id: parent_comment_id },
            {
                $push: {
                    replies: commentReply._id,
                },
            },
            { new: true }
        );

        // Update the number of comments in the blog
        await Answer.findOneAndUpdate(
            { _id: comment.answer_id },
            {
                $inc: {
                    number_of_comments: 1,
                },
            }
        );
        //send email to the user who get reply on his comment
        const user = await User.findOne({ _id: comment.user_id });
        const answer = await Answer.findOne({ _id: comment.answer_id });
        const question = await Question.findOne({ _id: answer.question });
        const data = {
            email: user.email,
            subject: 'You got a reply on your comment',
            message: `Someone replied to your comment on the forum answer : <br>
            <a href="${process.env.FRONTEND_DOMAIN}/forum/${question._id}">${question?.question} <br>
            <img src="${question?.media}" alt="question image" style="width: 100px; height: 100px;"/> <br>
            </a> 
            `,
        };
console.log(data)
        sendUserEmailGeneral(data);

        return res.status(200).send({
            error: false,
            msg: 'Comment Reply Added successfully',
            data: commentReply,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

