import { aggregatePaginate } from 'mongoose-aggregate-paginate-v2';
import Subcategory from "../models/subcategory.model";
import mongoose from "mongoose";

export const fetchSubcategories = async (req, res, next) => {
    try {
        const {parent} = req.query
        let filter: any = {parent: new mongoose.Types.ObjectId(parent)}
        if (!!req.query.search) {
            filter['name'] = {$regex: new RegExp(req.query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await Subcategory.aggregatePaginate(
            Subcategory.aggregate([
            {
                $match: filter
            },
        ]),
            {
                page: req.query.page || 1,
                limit: req.query.size || 10,
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

export const fetchAllSubcategory = async (req, res, next) => {
    try {
        const {parent} = req.query
        let filter: any = {parent: new mongoose.Types.ObjectId(parent)}
        if (!!req.query.search) {
            filter['name'] = {$regex: new RegExp(req.query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await 
            Subcategory.aggregate([
            {
                $match: filter
            },
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

export const postSubcategory = async (req, res) => {
    try {
        let {body} = req;
        if (!!body._id) {
            await Subcategory.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated Subcategory'
            })
        } else {
            delete body._id
            
            await Subcategory.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added Subcategory'
            })
        }
    } catch (e) {
        if (e?.code === 11000) {
            return res.status(406).send({
                error: true,
                msg: 'Subcategory name already exists',
            })
        }
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const fetchSubcategory = async (req, res, next) => {
    try {
        const {query} = req;
        const category = await Subcategory.findOne({_id: query._id});
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

export const delSubcategory = async (req, res, next) => {
    try {
        const {query} = req;
        await Subcategory.findByIdAndDelete(query._id);
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

