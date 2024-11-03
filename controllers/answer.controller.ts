import { aggregatePaginate } from 'mongoose-aggregate-paginate-v2';
import Answer from '../models/answer.model';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { deleteFile } from '../utils/s3bucket';
import User from '../models/user.model';
import Question from '../models/question.model';
import { sendUserEmailGeneral } from '../utils/userEmailSend';

const secret = process.env.JWT_SECRET

export const postAnswer = async (req, res) => {
    try {
        let { body } = req;
        let answer:any ={}
        if(body?._id){
            const token = req.headers?.authorization?.split(" ")[1]
            res.locals.user = jwt.verify(token, secret)
            let answer = await Answer.findOne({_id: body._id});
            if((answer.user.toString() === res.locals.user._id.toString()) || res.locals.user?.role === 'admin'){
                await Answer.updateOne({_id: body?._id}, {$set: body})
                return res.status(200).send({
                    error: false,
                    msg: 'Answer updated successfully',
                    
                });
                
            }
        
            return res.status(403).send({
                error: true,
                msg: 'You do not have permission to Edit this answer',
            });
            
        } else{
            delete body?._id;
            answer = new Answer({...body});
            await answer.save();

            //send email to the user who get reply on his comment
            const question = await Question.findOne({ _id: body?.question });
            const user = await User.findOne({ _id: question.user });
            const data = {
                email: user.email,
                subject: 'You got a answer on your question',
                message: `Someone replied to your answer on your forum question : <br>
                <a href="${process.env.FRONTEND_DOMAIN}/forum/${question._id}">${question?.question} <br>
                <img src="${question?.media}" alt="question image" style="width: 100px; height: 100px;"/> <br>
                </a> 
                `,
            };

            sendUserEmailGeneral(data);

            return res.status(200).send({
                error: false,
                msg: 'Answer added successfully',
                data: answer,
            });
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const getAnswer = async (req, res) => {
    try {
        const {query} = req;

        const data= await Answer.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(query._id),
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
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
                    title: 1,
                    description: 1,
                    media: 1,
                    number_of_comments: 1,
                    number_of_upvote: 1,
                    number_of_downvote: 1,
                    createdAt: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                    upvotedUsers:1,
                    downvotedUsers:1
                },
            },
        ]);
        return res.status(200).json({
            error: false,
            data: data
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
}

//get most upvoted answers
export const getMostUpvotedAnswers = async (req, res) => {
    try {
        const {query} = req;
        // @ts-ignore
        const data = await Answer.aggregatePaginate(
            Answer.aggregate([
                {
                    $match: {
                        question: new mongoose.Types.ObjectId(query.question),
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
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
                        title: 1,
                        description: 1,
                        media: 1,
                        number_of_comments: 1,
                        number_of_upvote: 1,
                        number_of_downvote: 1,
                        createdAt: 1,
                        user: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            image: 1,
                        },
                        upvotedUsers:1,
                        downvotedUsers:1
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                }
            ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
            }
        );
        return res.status(200).json({
            error: false,
            data: data
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const getAnswers = async (req, res, next) => {
    try {
        const {query} = req;

        const matchStage: any = {};

        const searchStage = query.search
            ? {
                title: {
                    $regex: new RegExp(query.search, 'i'),
                },
            }
            : {};

        // @ts-ignore
        const data = await Answer.aggregatePaginate(
            Answer.aggregate([
                {
                    $match: matchStage,
                },

                {
                    $match: searchStage,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
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
                        title: 1,
                        description: 1,
                        media: 1,
                        number_of_comments: 1,
                        number_of_upvote: 1,
                        number_of_downvote: 1,
                        createdAt: 1,
                        user: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            image: 1,
                        },
                    },
                },
            ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
                sort: {createdAt: -1},
            }
        );

        if (data?.docs?.length === 0)
            return res.status(404).json({error: true, msg: 'data not found'});

        return res.status(200).send({
            error: false,
            data: data,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const deleteAnswer = async (req, res) => {
    try {
        const {query} = req;
        const answer = await Answer.findById(query._id);

        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)
        
        if (!answer) {
            return res.status(404).send({
                error: true,
                msg: 'answer not found',
            });
        }

        if(res.locals.user?.role === 'admin'){
            await Answer.deleteOne({_id: query._id});
            return res.status(200).send({
                error: false,
                msg: 'answer deleted successfully',
            });
        }

        if((answer.user.toString() !== res.locals.user._id.toString())){
            return res.status(403).send({
                error: true,
                msg: 'You do not have permission to delete this answer',
            });
        }

        await deleteFile(answer.media);

        await Answer.deleteOne({_id: query._id});
        return res.status(200).send({
            error: false,
            msg: 'answer deleted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

export const upvoteAnswer = async (req, res) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)

        const {body} = req;
        const answer = await Answer.findOne({_id: body._id});

        if (!answer) {
            return res.status(404).send({
                error: true,
                msg: 'Answer not found',
            });
        }

        // Check if the user has already upvoted the answer
        if (answer.upvotedUsers.includes(res.locals.user._id)) {
            return res.status(400).send({
                error: true,
                msg: 'You have already upvoted this answer',
            });
        }

        // If the user has downvoted the answer, remove their downvote
        if (answer.downvotedUsers.includes(res.locals.user._id)) {
            answer.downvotedUsers = answer.downvotedUsers.filter(userId => userId.toString() !== res.locals.user._id.toString());
            answer.number_of_downvote -= 1;
        }

        await answer.save();

        // Add the user to the upvotedUsers array and increment the number of upvotes
        await Answer.updateOne({_id: body._id}, {
            $push: {upvotedUsers: res.locals.user._id},
            $inc: {number_of_upvote: 1}
        });

        return res.status(200).send({
            error: false,
            msg: 'answer upvoted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

export const downvoteAnswer = async (req, res) => {
    try {

        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)

        const {body} = req;
        const answer = await Answer.findOne({_id: body._id});

        if (!answer) {
            return res.status(404).send({
                error: true,
                msg: 'answer not found',
            });
        }

        // Check if the user has already downvoted the answer
        if (answer.downvotedUsers.includes(res.locals.user._id)) {
            return res.status(400).send({
                error: true,
                msg: 'You have already downvoted this answer',
            });
        }

        // If the user has upvoted the answer, remove their upvote
        if (answer.upvotedUsers.includes(res.locals.user._id)) {
            answer.upvotedUsers = answer.upvotedUsers.filter(userId => userId.toString() !== res.locals.user._id.toString());
            answer.number_of_upvote -= 1;
        }

        // Add the user to the downvotedUsers array and increment the number of downvotes
        answer.downvotedUsers.push(res.locals.user._id);
        answer.number_of_downvote += 1;

        await answer.save();

        return res.status(200).send({
            error: false,
            msg: 'answer downvoted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

