import Tags from "../models/tags.model";
import mongoose from "mongoose";


export const fetchTags = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {parent: {$exists: false}, subcategory: {$exists: false}}
        if (!!query.search) {
            filter['name'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await Tags.paginate(filter, {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        })
        return res.status(200).json({
            error: false,
            msg: 'Successfully gets tags',
            data
        })

    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

//fetch tags without paginate
export const fetchTagsWithoutPaginate = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {parent: {$exists: false}, subcategory: {$exists: false}}
        if (!!query.search) {
            filter['name'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await Tags.find(filter)
        return res.status(200).json({
            error: false,
            msg: 'Successfully gets tags',
            data
        })

    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const postTag = async (req, res) => {
    try {
        let {body} = req;
        if (!!body._id) {
            await Tags.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated tag'
            })
        } else {
            delete body._id
            await Tags.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added tag'
            })
        }
    } catch (e) {
        if (e?.code === 11000) {
            return res.status(406).send({
                error: true,
                msg: 'Tag already exists',
            })
        }
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const fetchTag = async (req, res, next) => {
    try {
        const {query} = req;
        const tag = await Tags.findOne({_id: query._id});
        return res.status(200).json({
            error: false,
            data: tag
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
}


export const delTag = async (req, res, next) => {
    try {
        const {query} = req;
        await Tags.findByIdAndDelete(query._id);
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