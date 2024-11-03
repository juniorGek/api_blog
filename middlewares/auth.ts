import jwt from 'jsonwebtoken'
import User from "../models/user.model";
import mongoose from "mongoose";


const secret = process.env.JWT_SECRET

export const decodeToken = (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)
        next()
    } catch (err) {
        next()
    }
}

export const isLoggedIn = (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)
        return next()
    } catch (err) {
        return res.status(401).send({
            error: true,
            msg: 'Please login to continue'
        })
    }
}


export const isAdmin = (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1]
        let user = jwt.verify(token, secret)
        // @ts-ignore
        if (user?.role === 'admin') {
            res.locals.user = user
            return next()
        }
        return res.status(401).send({
            error: true,
            msg: 'Unauthorized action'
        })
    } catch (err) {
        return res.status(401).send({
            error: true,
            msg: 'Unauthorized action'
        })
    }
}




export const userAuth = (permission, update = '') => async (req, res, next) => {
    try {
        const {body} = req
        const token = req.headers?.authorization?.split(" ")[1]
        let decode: any = jwt.verify(token, secret)
        let user = await User.findById(decode._id).populate('roles', ['permissions']);
        res.locals.user = user
        if (!!body._id && !!update) {
            if (havePermission(update, user.roles)) {
                next()
                return
            }
        } else {
            if (havePermission(permission, user.roles)) {
                next()
                return
            }
        }

        return res.status(401).send({
            error: true,
            msg: "You don't have permission for this job"
        })

    } catch (err) {
        return res.status(401).send({
            error: true,
            msg: 'Session Expired. Please Login again'
        })
    }
}

export const havePermission = (permission, roles) => {
    for (let role of roles || []) {
        if (role.permissions.includes(permission)) {
            return true
        }
    }
    return false
}

export const authCheck = ({permission = "", isAdmin = false, isUser = false, isEmployee = false, isAuth = false}) => async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1];
        let decode = await jwt.verify(token, process.env.JWT_SECRET);
        console.log(decode)
        // @ts-ignore
        let user = await User.findById(decode._id).populate('roles', ['permissions']);
        res.locals.user = user;
        const userRoles = ['admin', 'employee', 'user']
        if (isAdmin && user.role === "admin") {
            next();
            return;
        }  else if (isEmployee && user.role === "employee") {
            next();
            return;
            // @ts-ignore
        } else if (userRoles.includes(user.role) && isAuth) {
            next();
            return;
            // @ts-ignore
        } else if (havePermission(permission, user.permission)) {
            next()
            return
        }
        return res.status(401).send({
            error: true,
            msg: "Unauthorized access",
        });
    } catch (err) {
        console.log(err)
        return res.status(401).send({
            error: true,
            msg: "Unauthorized access",
        });
    }
};

export const checkUser = async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1]
        let decode = await jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        res.locals.user = await User.findById(decode._id).populate('roles', ['permissions']);
        next()
    } catch (err) {
        next()
    }
}