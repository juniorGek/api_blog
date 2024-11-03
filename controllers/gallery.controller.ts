import { deleteFile } from "../utils/s3bucket";
import Gallery from "../models/gallery.model";
import { aggregatePaginate } from 'mongoose-aggregate-paginate-v2';

export const fetchGalleries = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {parent: {$exists: false}, subcategory: {$exists: false}}
        if (!!query.search) {
            filter['name'] = {$regex: new RegExp(query.search.toLowerCase(), "i")}
        }
        // @ts-ignore
        let data = await Gallery.aggregatePaginate(
            Gallery.aggregate([
            {
                $match: filter
            },
        ]),
            {
                page: query.page || 1,
                limit: query.limit || 12,
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

export const fetchGallery = async (req, res, next) => {
    try {
        const {query} = req
        let data = await Gallery.findOne({_id: query._id})
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

export const postGallery = async (req, res) => {
    try {
        let {body} = req;
        if (!!body._id) {
            await Gallery.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated Gallery'
            })
        } else {
            delete body._id
            //check if it has array of images then insert many
            if(body.isArray){
                await Gallery.insertMany(body)
            }
            
            await Gallery.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added to Gallery'
            })
        }
    } catch (e) {
        if (e?.code === 11000) {
            return res.status(406).send({
                error: true,
                msg: 'Gallery name already exists',
            })
        }
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const deleteGallery = async (req, res) => {
    try {
        const {query} = req;
        //first delete from aws then delete from db
        if (typeof query.image === 'string') {
            await deleteFile(query?.image?.split('.com/')[1])
            await Gallery.deleteOne({_id: query?._id})
            return res.status(200).send({
                error: false,
                msg: 'Successfully deleted Gallery'
            })
        }
        return res.status(200).send({
            error: true,
            msg: 'Wrong input',
        })  
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

