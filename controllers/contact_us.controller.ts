import mongoose from 'mongoose';
// import {sendUserEmailGeneral} from "../utils/userEmailSend";
import * as EmailValidator from 'email-validator';
import ContactUs from '../models/contact_us.model';
import { sendUserEmailGeneral } from '../utils/userEmailSend';

// create ContactUs
export const createContactUs = async (req, res, next) => {
    try {
        const { body } = req;

        if (body._id) {
            await ContactUs.findByIdAndUpdate(body._id, { $set: body });
            return res.status(200).json({
                error: false,
                msg: 'Successfully updated',
            });
        } else {
            delete body._id;
            if (EmailValidator.validate(body?.email)) {
                // Add proper validation for other fields if necessary
                const contactSubmission = await ContactUs.create(body);
                // Uncomment the email sending code when ready

                return res.status(201).json({
                    error: false,
                    msg: 'Message has been sent successfully',
                    data: contactSubmission, // Return the created contact submission if needed
                });
            } else {
                return res.status(400).json({
                    error: true,
                    msg: 'Please enter a valid email address',
                });
            }
        }
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({
            error: true,
            msg: 'Server failed. Please try again later.',
        });
    }
};

// get all ContactUs
export const getAllContactUs = async (req, res, next) => {
    try {
        let { query } = req;
        let filter: any = {};
        if (!!query.search) {
            filter = {
                $or: [
                    { name: { $regex: new RegExp(query.search.toLowerCase(), 'i') } },
                    { email: { $regex: new RegExp(query.search.toLowerCase(), 'i') } },
                    { phone: { $regex: new RegExp(query.search.toLowerCase(), 'i') } },
                    { subject: { $regex: new RegExp(query.search.toLowerCase(), 'i') } },
                ],
            };
        }
        // @ts-ignore
        const data = await ContactUs.aggregatePaginate(
            ContactUs.aggregate([
                ...(!!query._id
                    ? [
                          {
                              $match: {
                                  _id: new mongoose.Types.ObjectId(query._id),
                              },
                          },
                      ]
                    : []),
                {
                    $project: {
                        __v: 0,
                    },
                },
                { $match: filter },
            ]),
            {
                page: query.page || 1,
                limit: query.size || 15,
                sort: { createdAt: -1 },
            }
        );

        return res.status(200).json({
            error: false,
            data: !!query._id ? data?.docs[0] : data,
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed',
        });
    }
};

export const replyMsg = async (req, res, next) => {
    try {
        const { body } = req;
        if (EmailValidator.validate(body?.email)) {
            await sendUserEmailGeneral({
                email: body.email,
                subject: body.subject,
                message: body.message
            })
            console.log(body);
            await ContactUs.updateOne(
                { _id: new mongoose.Types.ObjectId(body._id) },
                { status: true, replied_message: body.message}
            );
            return res.status(200).json({
                error: false,
                msg: 'Message has been sent successfully',
            });
        } else {
            return res.status(404).json({
                error: true,
                msg: 'Please enter a valid email address',
            });
        }
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed',
        });
    }
};

// delete ContactUs
export const deleteContactUs = async (req, res, next) => {
    try {
        const { query } = req;
        await ContactUs.findByIdAndDelete(query._id);
        return res.status(200).json({
            error: false,
            msg: 'Deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed',
        });
    }
};
