import { aggregatePaginate } from 'mongoose-aggregate-paginate-v2';
import Question from '../models/question.model';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Answer from '../models/answer.model';
import { deleteFile } from '../utils/s3bucket';


const secret = process.env.JWT_SECRET

export const postQuestion = async (req, res) => {
    try {
        let { body } = req;
        let question:any ={}
        if(body?._id){
            const token = req.headers?.authorization?.split(" ")[1]
            res.locals.user = jwt.verify(token, secret)
            question = await Question.findOne({_id: body?._id})
            if((question.user.toString() === res.locals.user._id.toString()) || res.locals.user?.role === 'admin'){
                await Question.updateOne({_id: body?._id}, {$set: body})
                return res.status(200).send({
                    error: false,
                    msg: 'Question updated successfully',
                    data: question,
                });
            }
        } else{
            delete body?._id;
            question = new Question({...body});
            await question.save();
            return res.status(200).send({
                error: false,
                msg: 'Question added successfully',
                data: Question,
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

export const getQuestions = async (req, res) => {
    try {
        const {query} = req;
        const searchStage = query.search
            ? {
                title: {
                    $regex: new RegExp(query.search, 'i'),
                },
            }
            : {};
        
        //@ts-ignore
        const data = await Question.aggregatePaginate(
            Question.aggregate([
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
                    $lookup: {
                        from: 'answers',
                        localField: '_id',
                        foreignField: 'question',
                        as: 'answers',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        question: 1,
                        description: 1,
                        media: 1,
                        type: 1,
                        options: 1,
                        createdAt: 1,
                        user: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            image: 1,
                        },
                        total_number_of_votes: {
                            $sum: "$options.number_of_votes"
                        },
                        upvotedUsers: 1,
                        downvotedUsers:1,
                        totalAnswers: { $size: '$answers' },
                        number_of_upvote: 1,
                        number_of_downvote: 1,
                    },
                }
            ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
                sort: {createdAt: -1},
            }
        );

        if (data?.docs?.length === 0)
            return res.status(404).json({error: true, msg: 'data not found'});

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

export const getQuestion = async (req, res) => {
    try {
        const { _id } = req.query;
        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).send({
                error: true,
                msg: 'Invalid question ID',
            });
        }
        const question = await Question.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(_id),
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
                $lookup: {
                    from: 'answers',
                    localField: '_id',
                    foreignField: 'question',
                    as: 'answers',
                },
            },
            {
                $project: {
                    _id: 1,
                    question: 1,
                    description: 1,
                    type: 1,
                    media: 1,
                    options: 1,
                    createdAt: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                    total_number_of_votes: {
                        $sum: "$options.number_of_votes"
                    },
                    number_of_upvote: 1,
                    number_of_downvote: 1,
                    totalAnswers: { $size: '$answers' },
                    upvotedUsers:1,
                    downvotedUsers:1
                },
            },
        ]);
        return res.status(200).json({
            error: false,
            data: question[0]
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }

}

export const deleteQuestion = async (req, res) => {
    try {
        const { _id } = req.query;
        const user = res.locals.user;

        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).send({
                error: true,
                msg: 'Invalid question ID',
            });
        }

        const question = await Question.findOne({ _id: _id });

        if (!question) {
            return res.status(404).send({
                error: true,
                msg: 'Question not found',
            });
        }

        if (question.user.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).send({
                error: true,
                msg: 'You do not have permission to delete this question',
            });
        }

        if(question.media){
            await deleteFile(question.media)
        }

        await Question.deleteOne({ _id: _id });
        await Answer.deleteMany({ question: _id });

        return res.status(200).send({
            error: false,
            msg: 'Question and associated answers deleted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

export const upvoteQuestion = async (req, res) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)

        const {body} = req;
        const question = await Question.findOne({_id: body._id});

        if (!question) {
            return res.status(404).send({
                error: true,
                msg: 'Question not found',
            });
        }

        // Check if the user has already upvoted the question
        if (question.upvotedUsers.includes(res.locals.user._id)) {
            return res.status(400).send({
                error: true,
                msg: 'You have already upvoted this answer',
            });
        }

        // If the user has downvoted the answer, remove their downvote
        if (question.downvotedUsers.includes(res.locals.user._id)) {
            question.downvotedUsers = question.downvotedUsers.filter(userId => userId.toString() !== res.locals.user._id.toString());
            question.number_of_downvote -= 1;
        }

        await question.save()

        // Add the user to the upvotedUsers array and increment the number of upvotes
        await Question.updateOne({_id: body._id}, {
            $push: {upvotedUsers: res.locals.user._id},
            $inc: {number_of_upvote: 1},
        });

        return res.status(200).send({
            error: false,
            msg: 'question upvoted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

export const downvoteQuestion = async (req, res) => {
    try {

        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)

        const {body} = req;
        const question = await Question.findOne({_id: body._id});

        if (!question) {
            return res.status(404).send({
                error: true,
                msg: 'question not found',
            });
        }

        // Check if the user has already downvoted the answer
        if (question.downvotedUsers.includes(res.locals.user._id)) {
            return res.status(400).send({
                error: true,
                msg: 'You have already downvoted this question',
            });
        }

        // If the user has upvoted the answer, remove their upvote
        if (question.upvotedUsers.includes(res.locals.user._id)) {
            question.upvotedUsers = question.upvotedUsers.filter(userId => userId.toString() !== res.locals.user._id.toString());
            question.number_of_upvote -= 1;
        }

        // Add the user to the downvotedUsers array and increment the number of downvotes
        question.downvotedUsers.push(res.locals.user._id);
        question.number_of_downvote += 1;

        await question.save();

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

export const giveVote = async(req, res) => {
    try {
        const { pollId, optionId } = req.body;
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)
        const user = res.locals.user._id;

        let poll = await Question.findOne({_id: pollId});
        if(!poll){
            return res.status(404).json({
                error: true,
                message: "Poll not found"
            });
        }

        // Find the option that the user previously voted for
        let previousOption = poll.options.find(option => option.voted_users.includes(user));
        if(previousOption){
            // Decrease the number_of_votes for the previous option by 1 and remove the user from its voted_users array
            previousOption.number_of_votes -= 1;
            previousOption.voted_users = previousOption.voted_users.filter(userId => userId.toString() !== user);
        }

        let option = poll.options.find(option => option._id.toString() === optionId);
        if(!option){
            return res.status(404).json({
                error: true,
                message: "Option not found"
            });
        }

        // Increase the number_of_votes for the new option by 1 and add the user to its voted_users array
        option.number_of_votes += 1;
        option.voted_users.push(user);

        poll = await poll.save();
        return res.status(200).json({
            error: false,
            message: "Vote given successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }
}
