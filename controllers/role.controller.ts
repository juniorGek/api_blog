import User from "../models/user.model";
import Role from "../models/role.model";
import permissions from '../utils/permission'
import {havePermission} from "../middlewares/auth";
import mongoose from "mongoose";


// get all permissions
export const getPermissions = async (req, res) => {
    res.status(200).send({
        error: false,
        msg: 'Successfully gets permissions',
        data: permissions
    })
}

// new Role entry
export const postRole = async (req, res, next) => {
    try {
        const {body} = req;
        if (body?._id) {
            await Role.updateOne({_id: body?._id}, {$set: body});
            return res.status(200).send({
                error: false,
                msg: 'Updated successful',
            })
        }

        delete body._id
        const roleCreate = await Role.create({...body})
        return res.status(200).send({
            error: false,
            msg: 'New role added successfully',
            data: roleCreate
        })

    } catch (e) {
        if (e?.code === 11000) {
            return res.status(406).send({
                error: true,
                msg: 'Role already exists',
            })
        }
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


// get all Role
export const getRoles = async (req, res, next) => {
    try {
        const {query} = req;
        let filter: any = {};
        if (query.search) {
            filter = {
                $or: [
                    {"department.name": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {name: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                ]
            }
        }
        // @ts-ignore
        const getRoles = await Role.aggregatePaginate(Role.aggregate([
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            {$unwind: "$department"},
            {$match: filter}
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        });

        if (getRoles?.docs?.length === 0) return res.status(404).json({error: true, msg: "Role not found"})

        return res.status(200).send({
            error: false,
            data: getRoles
        })

    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

// department Or Categories Wise
export const departmentWiseList = async (req, res, next) => {
    try {
        const {query} = req;
        // @ts-ignore
        const getRoles = await Role.aggregatePaginate(Role.aggregate([
            {
                $match: {
                    department: new mongoose.Types.ObjectId(query.department)
                }
            },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            {$unwind: "$department"},
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        });

        if (getRoles?.length === 0) return res.status(404).json({error: true, msg: "Role not found"})

        return res.status(200).send({
            error: false,
            data: getRoles
        })

    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


// get one Role
export const getRole = async (req, res, next) => {
    try {
        const getRole = await Role.findOne({_id: req.query._id}).populate('department');

        if (!getRole) return res.status(404).json({error: true, msg: "Role not found"})

        return res.status(200).send({
            error: false,
            data: getRole
        })

    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


// delete one Role
export const deleteRole = async (req, res, next) => {
    try {
        const {query} = req
        await Role.findByIdAndDelete(query._id)
        return res.status(200).send({
            error: false,
            msg: 'Successfully deleted role',
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const postPermissions = async (req, res) => {
    try {
        const {body} = req
        console.log("🚀 ~ postPermissions ~ body:", body)
        const {user} = res.locals
        console.log("🚀 ~ postPermissions ~ res:", res.locals)
        console.log("🚀 ~ postPermissions ~ user:", user)
        let userCheck = await User.findById(user._id, 'permission role').populate('permission', ['permissions']);
        let admin = userCheck?.role === 'admin';
        if (!admin) {
            for (let p of body.permissions) {
                if (!havePermission(p, user?.permission)) {
                    return res.status(401).send({
                        error: true,
                        msg: 'Unauthorized permissions found'
                    })
                }
            }
        }
        await Role.findByIdAndUpdate(body.role, {permissions: body.permissions})
        // await Role.updateOne({_id: body.role}, {$set: {permissions: body.permissions}});
        res.status(200).send({
            error: false,
            msg: 'Successfully updated permissions',
        })
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}