import { aggregatePaginate } from 'mongoose-aggregate-paginate-v2';
import Categories from "../models/category.model";
import mongoose from "mongoose";
import Subcategory from '../models/subcategory.model';


export const fetchCategories = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {parent: {$exists: false}, subcategory: {$exists: false}}
        if (!!query.search) {
            filter['name'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await Categories.aggregatePaginate(
            Categories.aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: 'blogs',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'blogs'
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    number_of_blogs: {
                        $size: {
                                $filter: {
                                    input: "$blogs",
                                    as: "blog",
                                    cond: { $eq: ["$$blog.published", true] }
                                }
                            }
                    },
                    total_views: {
                        $sum: {
                                $map: {
                                    input: "$blogs",
                                    as: "blog",
                                    in: { $cond: [{ $eq: ["$$blog.published", true] }, "$$blog.number_of_views", 0] }
                                }
                            }
                    }
                }
            }
        ]),
            {
                page: query.page || 1,
                limit: query.size || 10,
                sort: { createdAt: -1 },
            }
        )

        return res.status(200).json({
            error: false,
            data: data
        })


    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const fetchCategoriesWithoutPaginate = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {parent: {$exists: false}, subcategory: {$exists: false}}
        if (!!query.search) {
            filter['name'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await Categories.aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: 'blogs',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'blogs'
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    number_of_blogs: {
                        $size: {
                                $filter: {
                                    input: "$blogs",
                                    as: "blog",
                                    cond: { $eq: ["$$blog.published", true] }
                                }
                            }
                    },
                    total_views: {
                        $sum: {
                                $map: {
                                    input: "$blogs",
                                    as: "blog",
                                    in: { $cond: [{ $eq: ["$$blog.published", true] }, "$$blog.number_of_views", 0] }
                                }
                            }
                    }
                }
            }
        ])

        return res.status(200).json({
            error: false,
            data: data
        })


    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}



// fetch category and Subcategory inside category for frontend
export const treeCategory = async (req, res) => {
    try {
        
        const categories = await Categories.aggregate([
            {
                $lookup: {
                    from: 'subcategories',
                    let: { id: '$_id' },
                    pipeline:[
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$parent', '$$id']
                                }
                            }
                        }
                    ],
                    as: 'subcategories'
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    subcategories: {
                        _id: 1,
                        name: 1,
                        image: 1
                    }
                }
            }
        ])

        if (!categories) {
            return res.status(404).json({
                error: true,
                msg: 'No categories found'
            })
        }

        return res.status(200).json({
            error: false,
            data: categories
        })

    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
};



export const postCategory = async (req, res) => {
    try {
        let {body} = req;
        if (!!body._id) {
            await Categories.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated category'
            })
        } else {
            delete body._id
            
            await Categories.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added category'
            })
        }
    } catch (e) {
        if (e?.code === 11000) {
            return res.status(406).send({
                error: true,
                msg: 'Category name already exists',
            })
        }
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const fetchCategory = async (req, res, next) => {
    try {
        const {query} = req;
        const category = await Categories.findOne({_id: query._id});
        return res.status(200).json({
            error: false,
            data: category
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const delCategory = async (req, res, next) => {
    try {
        const {query} = req;
        await Categories.findByIdAndDelete(query._id);
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