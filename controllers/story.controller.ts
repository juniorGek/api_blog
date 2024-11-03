
import mongoose from "mongoose";
import Story from '../models/story.model';
import { deleteFile } from '../utils/s3bucket';
import StoryTopic from '../models/storyTopic.model';


export const postStoryTopic = async (req, res, next) => {
    try{
        const {body} = req
        if(!!body._id){
            await StoryTopic.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated Story Topic'
            })
        }else{
            delete body._id
            await StoryTopic.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added Story Topic'
            })
        }
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    
    }
}

export const fetchStoryTopics = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {}
        if(!!query.search){
            filter['title'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        //@ts-ignore
        const data = await StoryTopic.aggregatePaginate(
            StoryTopic.aggregate([
                {
                    $match: filter
                }
            ]),{
                page: query.page || 1,
                limit: query.size || 10,
                sort: {createdAt: -1}
            }
        )
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

//fetch without pagination
export const fetchStoryTopicsWithoutPaginate = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {}
        if(!!query.search){
            filter['title'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        //@ts-ignore
        const data = await StoryTopic.aggregate([
            {
                $lookup: {
                    from: 'stories',
                    localField: '_id',
                    foreignField: 'topic',
                    as: 'stories'
                }
            },
            {
                $match: {
                    ...filter,
                    stories: {
                        $elemMatch: { status: 'published' }
                    }
                }
            },
            {
                $project: {
                    stories: 0
                }
            }
        ])
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

export const fetchStoryElement = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {}
        if(!!query.search){
            filter['title'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }

        const data = await StoryTopic.aggregate([
            {
                $match: filter
            }
        ])
        return res.status(200).json({
            error: false,
            data: data
        })

    } catch (error) {
        
    }
}

export const deleteStoryTopic = async (req, res, next) => {
    try {
        const {query} = req;
        const data = await StoryTopic.findById(query._id)
        if(!data){
            return res.status(404).json({
                error: true,
                msg: 'Story Topic not found'
            })
        }
        await deleteFile(data.image)
        await Story.deleteMany({topic: query._id})
        await StoryTopic.remove({_id: query._id})
        return res.status(200).json({
            error: false,
            msg: "Deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
}

// post a Story

export const postStory = async (req, res, next) => {
    try {
        const {body} = req
        if(!!body._id){
            await Story.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated Story'
            })
        }else {
            delete body._id
            
            await Story.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added Story'
            })
        }


    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

// fetch stpries 
export const fetchStories = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {}

        if(!!query.status){
            filter['status'] = query.status
        }

        // const searchStage = query.search
        //     ? {
        //         $or: [
        //             {"title.en": {$regex: query.search, $options: 'i'}},
        //             {"title.fr": {$regex: query.search, $options: 'i'}},
        //             {"title.bn": {$regex: query.search, $options: 'i'}},
        //         ],
        //     }
        //     : {};

        //@ts-ignore
        const data = await Story.aggregatePaginate(
            Story.aggregate([
                {
                    $match: filter
                },
                // {
                //     $match: searchStage,
                // },
                {
                    $lookup: {
                        from: 'storytopics',
                        localField: 'topic',
                        foreignField: '_id',
                        as: 'topic'
                    },
                },
                {
                    $unwind: '$topic'
                },
                {
                    $project: {
                        title: 1,
                        description: 1,
                        content: 1,
                        image_url: 1,
                        video_url: 1,
                        start_time: 1,
                        end_time: 1,
                        status: 1,
                        createdAt: 1,
                        topic: {
                            title: 1,
                            image: 1
                        },
                        type: 1
                    }
                },
            ]),{
                page: query.page || 1,
                limit: query.size || 10,
                sort: {createdAt: -1}
            }
        )

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

export const fetchStoriesByTopic = async (req, res, next) => {
    try {
        const stories = await Story.aggregate([
            {
                $lookup: {
                    from: 'storytopics',
                    localField: 'topic',
                    foreignField: '_id',
                    as: 'topic'
                },
            },
            { $unwind: '$topic' },
            {
                $group: {
                    _id: '$topic._id',
                    stories: { 
                        $push: {
                            _id: '$_id',
                            type: '$type',
                            image_url: '$image_url',
                            video_url: '$video_url',
                            start_time: '$start_time',
                            end_time: '$end_time',
                            status: '$status',
                            createdAt: '$createdAt',
                            updatedAt: '$updatedAt',
                            __v: '$__v',
                            topic: '$topic'
                        } 
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    stories: 1
                }
            },
            { $sort: { 'stories.createdAt': -1 } }
        ]);

        return res.status(200).json({
            error: false,
            data: stories
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        });
    }
}
// fetch story of a topic
export const fetchSingleTopicStory = async (req, res, next) => {
    try {
        const {query} = req

        const matchStage = query.topic
            ? {
                topic: new mongoose.Types.ObjectId(query.topic),
            }
            : {};

        //@ts-ignore
        const data = await Story.aggregatePaginate(
            Story.aggregate([
                {
                    $match:{
                        status: 'published'
                    }
                },
                {
                    $match: matchStage,
                },
                {
                    $lookup: {
                        from: 'storytopics',
                        localField: 'topic',
                        foreignField: '_id',
                        as: 'topic'
                    }
                },
                { $unwind: '$topic' },
                {
                    $group: {
                        _id: '$topic._id',
                        stories: { 
                            $push: {
                                _id: '$_id',
                                type: '$type',
                                image_url: '$image_url',
                                video_url: '$video_url',
                                start_time: '$start_time',
                                end_time: '$end_time',
                                status: '$status',
                                createdAt: '$createdAt',
                                updatedAt: '$updatedAt',
                                __v: '$__v',
                                topic: '$topic'
                            } 
                        },
                        topic: { $first: '$topic' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        stories: 1,
                        topic: 1
                    }
                },
                { $sort: { 'stories.createdAt': -1 } }
            ]),
            {
                page: query.page || 1,
                limit: query.size || 1,
            }
        )

        return res.status(200).json({
            error: false,
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        });
    }
}

export const fetchSingleStory = async (req, res, next) => {
    try {
        const {query} = req
        const data = await Story.findOne({_id: query._id})
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

//delete story
export const deleteStory = async (req, res, next) => {
    try {
        const {query} = req;
        const data = await Story.findById(query._id)
        if(!data){
            return res.status(404).json({
                error: true,
                msg: 'Story not found'
            })
        }
        await deleteFile(data.type === 'image' ? data.image_url : data.video_url)

        await Story.deleteOne({_id: query._id})

        return res.status(200).json({
            error: false,
            msg: "Deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
}
