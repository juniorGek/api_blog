import mongoose from "mongoose";
import Subscriber from "../models/subscriber.model";
import * as EmailValidator from "email-validator";

export const subscribe = async (req, res) => {
    try {
        let {email} = req.body
        if (!EmailValidator.validate(email)) {
            return res.status(400).send({
                error: true,
                msg: 'Please enter a valid email address'
            })
        }
        let subscriber = await Subscriber.findOne({email})
        if (subscriber) {
            const updated = await Subscriber.findByIdAndUpdate(subscriber._id, {active: true})
            if (updated) {
                return res.status(200).send({
                    error: false,
                    msg: 'You have successfully subscribed to our newsletter'
                })
            }
            return res.status(400).send({
                error: true,
                msg: 'You are already subscribed to our newsletter'
            })
        }
        subscriber = await Subscriber.create({email})
        return res.status(200).send({
            error: false,
            msg: 'You have successfully subscribed to our newsletter'
        })

    } catch (err) {
        return res.status(500).send({
            error: true,
            msg: 'Internal server error'
        })
    }
}

export const unsubscribe = async (req, res) => {
    try {
        let {email} = req.body
        let subscriber = await Subscriber.findOne({email})
        if (!subscriber) {
            return res.status(400).send({
                error: true,
                msg: 'You are not subscribed to our newsletter'
            })
        }
        await Subscriber.findByIdAndUpdate(subscriber._id, {active: false})
        return res.status(200).send({
            error: false,
            msg: 'You have successfully unsubscribed from our newsletter' 
        })
    } catch (err) {
        return res.status(500).send({
            error: true,
            msg: 'Internal server error'
        })
    }
}

export const getSubscribersList = async (req, res) => {
    try {
        const {query} = req
        let filter: any = {}
        if (!!query.search) {
            filter = {
                $or: [
                    {"email": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                ]
            }
        }
        let is_active: boolean;
        if (!!query.active) {
            is_active = query.active === 'true';
        }
        // @ts-ignore
        let data = await Subscriber.aggregatePaginate(Subscriber.aggregate([
            ...(!!query._id ? [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(query._id)
                    }
                },
            ] : []),
            ...(!!query.active ? [
                {
                    $match: {
                        active: is_active
                    }
                },
            ] : []),
            {$match: filter},
        ]), {
            page: query.page || 1,
            limit: query.size || 20,
            sort: {createdAt: -1},
        });
        return res.status(200).send({
            error: false,
            msg: 'Success',
            data
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}