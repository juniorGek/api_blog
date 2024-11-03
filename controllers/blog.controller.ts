import { aggregatePaginate } from 'mongoose-aggregate-paginate-v2';
import Blog from '../models/blog.model';
import mongoose from 'mongoose';
import Categories from '../models/category.model';
import { sendUserEmailGeneral } from '../utils/userEmailSend';
import Subscriber from '../models/subscriber.model';

export const postBlog = async (req, res) => {
    try {
        const body = req.body;
        let blog: any = {};
        if (!!body?._id) {
            blog = await Blog.updateOne({_id: body?._id}, {$set: body});
            return res.status(200).send({
                error: false,
                msg: 'Blog updated successfully',
                data: blog,
            });

        } else {
            delete body?._id;
            blog = new Blog({...body});
            await blog.save();

            //sent every subscriber an email with the new blog post
            const subscribers = await Subscriber.find({});
            subscribers.forEach(async subscriber => {
                if(subscriber.email && subscriber.active){
                    const data = {
                        email: subscriber.email,
                        subject: 'New Blog Post',
                        message: `<h1>New Blog Post</h1>
                        <p>A new blog post has been published.</p>
                        <p>Blog Title: ${blog?.title.fr || blog?.title?.en}</p>
                        <p>Check it out <a href="${process.env.FRONTEND_DOMAIN}/blog/${blog._id}">here</a></p>
                        <br /><br /><br />
                        <p>
                            Don't want to receive these emails? <a href="${process.env.FRONTEND_DOMAIN}/unsubscribe/?email=${subscriber.email} " >Unsubscribe</a>
                        </p>

                        <br />
                        Regards,<br />
                        Team Futurx.`
                    }
                    await sendUserEmailGeneral(data);
                }
            });


            return res.status(200).send({
                error: false,
                msg: 'Blog Added successfully',
                data: blog,
            });
        }
    } catch (err) {
        return res.status(500).send({
            error: true,
            msg: err.message,
        });
    }
};

export const publishBlog = async (req, res, next) => {
    try {
        const {_id} = req.body;
        const blog = await Blog.findOne({_id: _id});

        if (blog?.published) {
            await Blog.updateOne({_id: _id}, {$set: {published: false}});
            return res.status(200).send({
                error: false,
                msg: 'Blog Unpublished successfully',
            });

        } else {
            await Blog.updateOne({_id: _id}, {$set: {published: true}});
            return res.status(200).send({
                error: false,
                msg: 'Blog Published successfully',
            });
        }
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const getBlogs = async (req, res, next) => {
    try {
        const {query} = req;

        const matchStage: any = {};
        const category_id = query.category_id ? query.category_id : null;

        const tag_id = query.tag_id ? query.tag_id : null;

        if (category_id) {
            matchStage.category = new mongoose.Types.ObjectId(category_id);
        }

        if (tag_id) {
            matchStage.tags = new mongoose.Types.ObjectId(tag_id);
        }

        const searchStage = query.search
            ? {
                $or: [
                    {"title.en": {$regex: query.search, $options: 'i'}},
                    {"title.fr": {$regex: query.search, $options: 'i'}},
                    {"title.bn": {$regex: query.search, $options: 'i'}},

                    {"tags.en": {$regex: query.search, $options: 'i'}},
                    {"tags.fr": {$regex: query.search, $options: 'i'}},
                    {"tags.bn": {$regex: query.search, $options: 'i'}},
                    
                    {"short_info.en": {$regex: query.search, $options: 'i'}},
                    {"short_info.fr": {$regex: query.search, $options: 'i'}},
                    {"short_info.bn": {$regex: query.search, $options: 'i'}},
                ],
            }
            : {};

        // @ts-ignore
        const data = await Blog.aggregatePaginate(
            Blog.aggregate([
                {
                    $match: matchStage,
                },

                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    image: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'tags',
                        localField: 'tags',
                        foreignField: '_id',
                        as: 'tags',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                },
                            },
                        ],
                    },
                },

                {
                    $match: searchStage,
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

//get published blogs
export const getPublishedBlogs = async (req, res, next) => {
    try {
        const {query} = req;

        const matchStage: any = {};
        const category_id = query.category_id ? query.category_id : null;
        const subcategory_id = query.subcategory_id ? query.subcategory_id : null;

        const tag_id = query.tag_id ? query.tag_id : null;

        const published = query.published ? query.published : null;

        if (category_id) {
            matchStage.category = new mongoose.Types.ObjectId(category_id);
        }

        if (subcategory_id) {
            matchStage.subcategory = new mongoose.Types.ObjectId(subcategory_id);
        }

        if (tag_id) {
            matchStage.tags = new mongoose.Types.ObjectId(tag_id);
        }

        const searchStage = query.search
            ? {
                $or: [
                    {"title.en": {$regex: query.search, $options: 'i'}},
                    {"title.fr": {$regex: query.search, $options: 'i'}},
                    {"title.bn": {$regex: query.search, $options: 'i'}},

                    {"tags.en": {$regex: query.search, $options: 'i'}},
                    {"tags.fr": {$regex: query.search, $options: 'i'}},
                    {"tags.bn": {$regex: query.search, $options: 'i'}},

                    {"short_info.en": {$regex: query.search, $options: 'i'}},
                    {"short_info.fr": {$regex: query.search, $options: 'i'}},
                    {"short_info.bn": {$regex: query.search, $options: 'i'}},
                ],
            }
            : {};

        // @ts-ignore
        const data = await Blog.aggregatePaginate(
            Blog.aggregate([
                {
                    $match: matchStage,
                },

                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    image: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'subcategories',
                        localField: 'subcategory',
                        foreignField: '_id',
                        as: 'subcategory',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    image: 1,
                                },
                            },
                        ],
                    }
                },
                {
                    $unwind: {
                        path: '$subcategory',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'tags',
                        localField: 'tags',
                        foreignField: '_id',
                        as: 'tags',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                },
                            },
                        ],
                    },
                },

                {
                    $match: searchStage,
                },
                {
                    $match: {published: true},
                },
            ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
                sort: {createdAt: -1},
            }
        );

        if (data?.docs?.length === 0)
            return res.status(200).json({error: false, data:[]});

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

export const getPublishedBlogsForFrontend = async (req, res, next) => {
    try {
        const {query} = req;

        const matchStage: any = {};
        const category_id = query.category_id ? query.category_id : null;
        const subcategory_id = query.subcategory_id ? query.subcategory_id : null;

        const tag_id = query.tag_id ? query.tag_id : null;

        const published = query.published ? query.published : null;

        if (category_id) {
            matchStage.category = new mongoose.Types.ObjectId(category_id);
        }

        if (subcategory_id) {
            matchStage.subcategory = new mongoose.Types.ObjectId(subcategory_id);
        }

        if (tag_id) {
            matchStage.tags = new mongoose.Types.ObjectId(tag_id);
        }

        const searchStage = query.search
            ? {
                $or: [
                    {"title.en": {$regex: query.search, $options: 'i'}},
                    {"title.fr": {$regex: query.search, $options: 'i'}},
                    {"title.bn": {$regex: query.search, $options: 'i'}},

                    {"tags.en": {$regex: query.search, $options: 'i'}},
                    {"tags.fr": {$regex: query.search, $options: 'i'}},
                    {"tags.bn": {$regex: query.search, $options: 'i'}},

                    {"short_info.en": {$regex: query.search, $options: 'i'}},
                    {"short_info.fr": {$regex: query.search, $options: 'i'}},
                    {"short_info.bn": {$regex: query.search, $options: 'i'}},
                ],
            }
            : {};

        // @ts-ignore
        const data = await Blog.aggregatePaginate(
            Blog.aggregate([
                {
                    $match: matchStage,
                },

                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    image: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'subcategories',
                        localField: 'subcategory',
                        foreignField: '_id',
                        as: 'subcategory',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    image: 1,
                                },
                            },
                        ],
                    }
                },
                {
                    $unwind: {
                        path: '$subcategory',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'tags',
                        localField: 'tags',
                        foreignField: '_id',
                        as: 'tags',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                },
                            },
                        ],
                    },
                },

                {
                    $match: searchStage,
                },
                {
                    $match: {
                        published: true,
                        is_trending: true
                    },
                },
            ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
                sort: {number_of_views: -1},
            }
        );

        if (data?.docs?.length === 0)
            return res.status(200).json({error: false, data:[]});

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

export const getBlog = async (req, res, next) => {
    try {
        // Validate the ID before attempting to use it
        if (!req.query._id) {
            return res.status(400).json({ error: true, msg: 'Invalid blog ID' });
        }

        const blogId = req.query._id;

        // Find the blog by its ID using aggregation
        const blog = await Blog.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(blogId) }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'subcategory',
                    foreignField: '_id',
                    as: 'subcategory',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$subcategory',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'blogs',
                    let: { category: '$category._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$category', '$$category'] },
                                _id: { $ne: new mongoose.Types.ObjectId(blogId) }, // Exclude the current blog
                                published: true // Include only published blogs
                            }
                        },
                        {
                            $lookup: {
                                from: 'categories',
                                localField: 'category',
                                foreignField: '_id',
                                as: 'category'
                            }
                        },
                        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $limit: 6
                        }
                    ],
                    as: 'relatedBlogs'
                }
            },
            // {
            //     $match: { published: true }
            // },
        ]);

        if (!blog || !blog.length) {
            return res.status(404).json({
                error: true,
                msg: 'Blog not found',
            });
        }

        // Increase the number of views for the current blog
        await Blog.updateOne(
            { _id: new mongoose.Types.ObjectId(blogId) },
            {
                $inc: {
                    number_of_views: 1,
                },
            }
        );

        return res.status(200).json({
            error: false,
            data: blog[0],
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed',
            errorDetails: error.message
        });
    }
};


export const getLatestBlogs = async (req, res, next) => {
    try {

        const blogs = await Blog.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {$unwind: {path: '$category', preserveNullAndEmptyArrays: true}},
            {$sort: {createdAt: -1}},
            {$match: {published: true}},
            {$limit: 6}
        ])

        return res.status(200).send({
            error: false,
            data: blogs,
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const blogsForFrontend = async (req, res, next) => {
    try {
        const {query} = req;

        // @ts-ignore
        let data = await Categories.aggregatePaginate(
            Categories.aggregate([
                {
                    $lookup: {
                        from: 'blogs',
                        let: {id: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {$eq: ['$category', '$$id']},
                                },
                            },
                            {
                                $lookup: {
                                    from: 'categories',
                                    let: {'category': "$category"},
                                    pipeline: [
                                        {$match: {$expr: {$eq: ['$_id', '$$category']}}},
                                    ],
                                    as: 'category'
                                }
                            },
                            {$unwind: {path: '$category', preserveNullAndEmptyArrays: true}},
                            {
                                $sort: {createdAt: -1},
                            },
                            {
                                $limit: 4,
                            },
                            {
                                $match: {published: true},
                            }
                        ],
                        as: 'latestBlogs',
                    },
                },
                {
                    $lookup: {
                        from: 'blogs',
                        let: {id: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {$eq: ['$category', '$$id']},
                                            {$eq: ['$editors_choice', true]},
                                        ],
                                    },
                                },
                            },
                            {
                                $sort: {updatedAt: -1},
                            },
                            {
                                $limit: 4,
                            },
                            {
                                $match: {published: true},
                            }
                        ],
                        as: 'editorBlogs',
                    },
                },
            ]),

            {
                page: query.page || 1,
                limit: query.size || 1,
                sort: {createdAt: 1},
            }
        );

        // Send the data as a response
        return res.status(200).send({
            error: false,
            data: data,
        });
    } catch (error) {
        // Handle the error, e.g., log it or send an error response
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

export const getFeaturedVideoBlogs = async (req, res, next) => {
    try {
        const blogs = await Blog.aggregate([
            {
                $match: {
                    post_type: 'video',
                    add_to_featured: true,
                    published: true,
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {$unwind: {path: '$category', preserveNullAndEmptyArrays: true}},
            {$sort: {updatedAt: -1}},
            {$limit: 3},
        ]);

        if(blogs?.length === 0){
            return res.status(200).send({
                error: false,
                data: [],
            });
        }

        if(blogs?.length ===1){
            return res.status(200).send({
                error: false,
                data: {
                    blog: blogs[0],
                    blogs: []
                },
            });
        }

        return res.status(200).send({
            error: false,
            data: {
                blog: blogs[0],
                // @ts-ignore
                blogs: blogs?.length === 3 ? [blogs[1] || {}, blogs[2] || {}] : [blogs[1] || {}]
            },
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};

//get all video type blogs
export const getAllVideoBlogs = async (req, res, next) =>{
    try {
        const {query} = req
        // @ts-ignore
        const blogs = await Blog.aggregatePaginate(
            Blog.aggregate([
                {
                    $match: {
                        post_type: 'video',
                        // add_to_featured: true,
                        published: true,
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    image: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true,
                    },
                }, 
            ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
                sort: {createdAt: 1},
            }
        )

        return res.status(200).send({
            error: false,
            data: blogs,
        });
        
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
}

//get editors blog for frontend category and tag wise
export const getEditorsBlogs = async (req, res, next) => {
    try {
        const {query} = req;

        const matchStage: any = {};
        const category_id = query.category_id ? query.category_id : null;

        const tag_id = query.tag_id ? query.tag_id : null;

        if (category_id) {
            matchStage.category = new mongoose.Types.ObjectId(category_id);
        }

        if (tag_id) {
            matchStage.tags = new mongoose.Types.ObjectId(tag_id);
        }

        // @ts-ignore
        const data = await Blog.aggregate([
            {
                $match: matchStage,
            },

            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                            },
                        },
                    ],
                },
            },

            {
                $match:{
                    editors_choice: true,
                    published: true,
                }
            }
        ])

        if (data?.length === 0)
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
}

export const deleteBlog = async (req, res, next) => {
    try {
        const {query} = req;
        await Blog.deleteOne({_id: query._id});
        return res.status(200).send({
            error: false,
            msg: 'Blog deleted successfully',
        });
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed',
        });
    }
};
