import Department from "../models/department.model";
import mongoose from "mongoose";


export const postDepartment = async (req, res) => {
    try {
        let {body} = req;
        if (!!body._id) {
            await Department.findOneAndUpdate({_id: body._id}, body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated department'
            })
        } else {
            delete body._id
            await Department.create(body)
            return res.status(200).send({
                error: false,
                msg: 'Successfully added department'
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

export const getDepartment = async (req, res, next) => {
    try {
        const {query} = req;
        const category = await Department.findOne({_id: new mongoose.Types.ObjectId(query._id)});
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

export const departmentList = async (req, res, next) => {
    try {
        const {query} = req
        let filter: any = {parent: {$exists: !!query.subcategory}}
        if (!!query.parent) {
            filter.parent = new mongoose.Types.ObjectId(query.parent)
        }

        // @ts-ignore
        let data = await Department.aggregatePaginate(Department.aggregate([
            {$match: filter},
            {$lookup: {from: 'departments', localField: '_id', foreignField: 'parent', as: 'child'}},
            {$lookup: {from: 'departments', localField: 'parent', foreignField: '_id', as: 'parent'}},
            {$unwind: {path: "$parent", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    name: 1,
                    description: 1,
                    image: 1,
                    parent: {
                        _id: 1,
                        name: 1,
                    },
                    createdAt: 1,
                    active: 1
                }
            },
            ...(!!query.search ? [
                {
                    $match: {
                        $or: [
                            {name: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                        ]
                    }
                }
            ] : []),
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        })
        return res.status(200).send({
            error: false,
            msg: 'Successfully get departments',
            data
        })

    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const getDepartmentWiseSubDepartmentList = async (req, res, next) => {
    try {
        const {query} = req
        // @ts-ignore
        let data = await Department.aggregatePaginate(Department.aggregate([
            {
                $match: {
                    $and: [
                        {parent: {$exists: !!query.subcategory}},
                        {parent: new mongoose.Types.ObjectId(query.parent)}
                    ]
                }
            },
            {$lookup: {from: 'departments', localField: '_id', foreignField: 'parent', as: 'child'}},
            {$lookup: {from: 'departments', localField: 'parent', foreignField: '_id', as: 'parent'}},
            {$unwind: {path: "$parent", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    name: 1,
                    description: 1,
                    image: 1,
                    subcategories: {$size: "$child"},
                    parent: {
                        _id: 1,
                        name: 1,
                    },
                    createdAt: 1,
                }
            },
            ...(!!query.search ? [
                {
                    $match: {
                        $or: [
                            {name: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {"parent.name": {$regex: new RegExp(query.search.toLowerCase(), "i")}}
                        ]
                    }
                }
            ] : []),
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        })
        return res.status(200).send({
            error: false,
            msg: 'Successfully get departments',
            data
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const getDepartmentElements = async (req, res) => {
    try {
        let {query} = req
        let filter: any = {parent: {$exists: false}}
        if (query.parent) {
            filter.parent = new mongoose.Types.ObjectId(query.parent)
        }
        let data = await Department.find(filter, 'name');
        return res.status(200).send({
            error: false,
            msg: 'Successfully get categories',
            data
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const delDepartment = async (req, res, next) => {
    try {
        const {query} = req;
        await Department.findByIdAndDelete(query._id);
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