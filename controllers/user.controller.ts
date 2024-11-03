import User from '../models/user.model'
import OTP from '../models/otp.model'
import bcrypt from 'bcrypt';
import { generateOTP, numberGen } from '../utils/common'
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Role from '../models/role.model';
import { sendUserEmailGeneral } from '../utils/userEmailSend';

const secret = process.env.JWT_SECRET


export const userRegistration = async (req, res, next) => {
    console.log(req.body)
    try {
        let { body } = req;
        const exitUser = await User.findOne({email: body.email });
        if (!!exitUser) {
            return res.status(400).send({
                error: true,
                msg: 'An account with this credentials has already existed',
            });
        }

        let hashedPassword = '';
        if (!!body.password) {
            hashedPassword = await bcrypt.hash(body.password, 8);
        } else {
            return res.status(400).send({
                error: true,
                msg: 'Password required',
            })
        }
        

        // opt send
        //***************************************************
        let otp = await OTP.findOne({ email: body.email, action: 'signup' });
        if (!!otp) {
            return res.status(401).send({
                error: true,
                msg: 'Already send. Please try after 2 min'
            });
        }
        let code = generateOTP();
        const otp_msg = `Your verification OTP code is: ${code}`
        if (!!body.email) {
            const data = {
                email: body.email,
                subject: `Verification Email for Registration`,
                message: `
                    ${otp_msg}
                    <br /><br />
                    Team<br />
                    Futurx.
                `
            }
            console.log("🚀 ~ userRegistration ~ data:", data)
            await sendUserEmailGeneral(data)

            await OTP.create({
                email: body.email,
                code,
                action: 'signup'
            })
        }
        //********************************************************

        let user = new User({
            name:body.name,
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            password: hashedPassword,
            role: body.role || 'user',
        })
        await user.save();

        return res.status(200).send({
            error: false,
            msg: 'OTP sent Successful',
            code: process.env.NODE_ENV === 'development' && code,
            phone: body.phone,
        })
    } catch (e) {
        if (e?.code === 11000) {
            return res.status(406).send({
                error: true,
                msg: 'An account with this credential has already existed',
            })
        }
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const signupOTPVerify = async (req, res) => {
    try {
        const {body} = req
        let otp = await OTP.findOne({$or: [{phone: body.phone, action: 'signup'}, {email: body.email, action: 'signup'}]});
        if (!!otp && otp?.attempts > 0 && body.otp === otp?.code) {
            let user:any;
            if(!!body.token) {
                const secret = process.env.JWT_SECRET
                const userInfo = jwt.verify(body.token, secret)
                // @ts-ignore
                user = await User.findOne({_id: mongoose.Types.ObjectId(userInfo?._id)}, 'first_name middle_name last_name phone email')
            } else {
                if(!!body.email) {
                    user = await User.findOne({email: body.email?.toLowerCase()}, 'first_name middle_name last_name phone email')
                } else {
                    user = await User.findOne({phone: body.phone}, 'first_name middle_name last_name phone email')
                }
            }
            if (!user) {
                return res.status(404).send({
                    error: true,
                    msg: 'User Not Found'
                })
            }
            await User.updateOne({_id: user._id}, {$set: {verified: true, active: true}})
            return res.status(200).send({
                error: false,
                msg: 'Successfully verified',
            })
        }
        if (otp) {
            otp.attempts -= 1
            await otp.save()
        }
        return res.status(401).send({
            error: true,
            msg: 'Invalid/Expired otp'
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const signupResendOTP = async (req, res) => {
    try {
        const { body } = req;
        let otp = await OTP.findOne({ email: body.email, action: 'signup' });
        if (!!otp) {
            return res.status(401).send({
                error: true,
                msg: 'Already send. Please try after 2 min'
            });
        }

        let isUser = null;
        if (!!body.token) {
            // gmail phone number verification
            const secret = process.env.JWT_SECRET
            const userInfo = jwt.verify(body.token, secret)
            // @ts-ignore
            isUser = await User.findOne({ _id: new mongoose.Types.ObjectId(userInfo?._id) })
        } else {
            isUser = await User.findOne({ phone: body.phone })
        }

        if (!isUser) {
            return res.status(401).send({
                error: true,
                msg: 'User not found'
            });
        }
        let code = generateOTP();
        const otp_msg = `Your verification OTP code is: ${code}`
        if (!!body.email) {
            const data = {
                email: body.email,
                subject: `Verification Email for Registration`,
                message: `
                    ${otp_msg}
                    <br /><br />
                    Team<br />
                    Futurx.
                `
            }
            await sendUserEmailGeneral(data)

            await OTP.create({
                email: body.email,
                code,
                action: 'signup'
            })
        }
        await OTP.create({
            email: body.email,
            code,
            action: 'signup'
        })
        return res.status(200).send({
            error: false,
            msg: 'Successfully registered',
            code: process.env.NODE_ENV === 'development' && code,
            email: body.email,
            token: body.token
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const userLogin = async (req, res) => {
    try {
        let { body } = req;    
        //console.log(body);    
        if (body.email && body.password) {
           // console.log(body.email)
            const email = body.email.trim().toLowerCase()
            const user = await User.findOne({ email: email }, 'password phone verified role active');
           // console.log(user)
            if (user) {
                let auth = await bcrypt.compare(body.password, user.password);
                console.log(auth)
                if (auth) {
                    let token =  jwt.sign({ _id: user._id, role: user.role }, secret, { expiresIn: '15d' })
                    return res.status(200).send({
                        error: false,
                        msg: 'Login successful',
                        token,
                        role: user?.role,
                        verified: user?.verified,
                        active: user?.active,
                    })
                } else {
                    return res.status(401).send({
                        error: true,
                        msg: 'Invalid Credentials'
                    })
                }
            }
            return res.status(404).send({
                error: true,
                msg: 'User does not exist'
            })
        }
        return res.status(404).json({
            error: true,
            msg: 'Invalid Credentials'
        })
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const userVerify = async (req, res) => {
    
    try {
        if (res.locals?.user?._id) {
            let user = await User.aggregate([
                {
                    $match: {_id: new mongoose.Types.ObjectId(res.locals?.user?._id)},
                },
                {
                    $lookup: {
                        from: 'roles',
                        let: {"permission":"$permission"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {$eq: ["$_id", "$$permission"]}
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                    permissions: 1
                                }
                            }
                        ],
                        as: 'roles'
                    }
                },
                {
                    $project: {
                        password: 0,
                        permission: 0,
                        __v: 0,
                        createdAt: 0,
                        updatedAt: 0,
                    }
                }
            ])
            if (user) {
                return res.status(200).send({
                    error: false,
                    msg: 'Successfully verified',
                    data: user[0],
                })
            }
        }
        return res.status(404).json({
            error: true,
            msg: 'User not found'
        })
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const userUpdatebyToken = async (req, res) => {
    try {
        const { body } = req;
        
        const { user } = res.locals
        console.log({ user })
        await User.findByIdAndUpdate(user._id, { $set: body });
        return res.status(200).send({
            error: false,
            msg: 'Successfully updated',
        })
    } catch (error) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }

}

export const getUserAccountInfo = async (req, res, next) => {
    try {
        let { query } = req;
        const { user } = res.locals;
        console.log(query?._id)

        let data = null;

        if (query?._id) {
            data = await User.findById({ _id: query?._id }, { password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
        }
        else {
            data = await User.findById({ _id: user?._id }, { password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
        }

        if (!data) {
            return res.status(404).send({
                error: true,
                msg: 'User not found'
            })
        }

        return res.status(200).send({
            error: false,
            msg: 'Successfully fetched',
            data
        })

    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: 'Server failed'
        })
    }
};

export const userUpdateByAdmin = async (req, res) => {
    try {
        const { body } = req;
        let isUser = await User.findById(body?._id);
        if (!!isUser) {
            delete body.password;
            await User.updateOne({ _id: new mongoose.Types.ObjectId(body._id) }, { $set: body })
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated',
            })
        } else {
            return res.status(401).send({
                error: true,
                msg: 'User not found'
            })
        }
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
};

export const passwordUpdateByAdmin = async (req, res) => {
    try {
        let { user } = res.locals;
        const { body } = req;
        if (!!user) {
            if (!!body?.password && !!body?.confirmPassword) {
                const hashedPassword = await bcrypt.hash(body.password, 8);
                await User.updateOne({ _id: new mongoose.Types.ObjectId(body._id) }, { password: hashedPassword })
                console.log("here")
                return res.status(200).send({
                    error: false,
                    msg: 'Password Successfully updated',
                })
            } else {
                return res.status(400).send({
                    error: true,
                    msg: 'Wrong Action',
                })
            }
        }else{
            return res.status(401).send({
                error: true,
                msg: 'Unauthorized action'
            })
        }
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const userList = async (req, res) => {
    try {
        const {query} = req
        let filter: any = {}
        if (!!query.search) {
            filter = {
                $or: [
                    {"name": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"email": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                ]
            }
        }
        let is_active: boolean;
        if (!!query.active) {
            is_active = query.active === 'true';
        }
        // @ts-ignore
        let data = await User.aggregatePaginate(User.aggregate([
            ...(!!query._id ? [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(query._id)
                    }
                },
            ] : []),
            {
                $match: {
                    role: {
                        $ne: 'admin'
                    }
                }
            },
            ...(!!query.role ? [
                {
                    $match: {
                        role: query.role
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
            {
                $project: {
                    password: 0,
                    __v: 0,
                }
            },
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
};

export const sendPasswordResetOtp = async (req, res) => {
    try {
        let { body } = req;
        console.log({ body })
        const user_input = body.email;
        let user = await User.findOne({ email: user_input?.toLowerCase() })
        if (!user) {
            return res.status(404).send({
                error: true,
                msg: 'User Not Found'
            })
        }
        let otp = await OTP.findOne({ user_input: user_input?.toLowerCase(), action: 'password_reset' });
        if (!!otp) {
            return res.status(401).send({
                error: true,
                msg: 'Already send. Please try after 2 min'
            });
        }
        let code = generateOTP();
        const otp_msg = `Your verification OTP code ${code}`
        if (!!body.email) {
            const data = {
                email: body.email,
                subject: `Verification Email for Password reset`,
                message: `
                    ${otp_msg}
                    <br /><br />
                    Team<br />
                    Futurx.
                `
            }
            await sendUserEmailGeneral(data)

            await OTP.create({
                user_input: body.email,
                code,
                action: 'password_reset'
            })
        } 
        
        return res.status(200).send({
            error: false,
            msg: 'Otp sent',
            data: {
                otp: process.env.NODE_ENV === 'development' && code,
                user_input: body.email,
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
};

export const otpVerifyForResetPassword = async (req, res) => {
    try {
        const { body } = req
        const user_input = body.email;
        console.log({user_input})
        let otp = await OTP.findOne({ user_input: user_input?.toLowerCase(), action: 'password_reset' })
        
        if (!!otp && otp?.attempts > 0 && body.otp === otp?.code) {
            let user = await User.findOne( { email: user_input?.toLowerCase() }, 'first_name middle_name last_name username phone email')
            
            if (!user) {
                return res.status(404).send({
                    error: true,
                    msg: 'User Not Found'
                })
            }
            let token = jwt.sign({ _id: user._id }, secret, { expiresIn: '10m' })
            return res.status(200).send({
                error: false,
                msg: 'Successfully verified',
                token
            })
        }
        if (otp) {
            otp.attempts -= 1
            await otp.save()
        }
        return res.status(401).send({
            error: true,
            msg: 'Invalid/Expired otp'
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const changePasswordForOtpRequest = async (req, res) => {
    try {
        //get _id from token
        const token = req.headers?.authorization?.split(" ")[1]
        res.locals.user = jwt.verify(token, secret)

        let { _id } = res.locals.user || {};

        const {body} = req;
        
        let user = await User.findById(_id, 'password role');


        if (user) {
            if (body.password === body.confirmPassword) {
                const hashedPassword = await bcrypt.hash(body.password, 8);

                await User.updateOne({_id: user._id}, {password: hashedPassword})

                return res.status(200).send({
                    error: false,
                    msg: 'Successfully updated',
                })
            }
            return res.status(400).send({
                error: false,
                msg: 'Wrong Input',
            })
        } else {
            return res.status(401).send({
                error: true,
                msg: 'Unauthorized action'
            })
        }
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const passwordResetByToken = async (req, res) => {
    try {
        let { _id } = res.locals.user || {};
        const { body } = req;
        let user = await User.findById(_id, 'password');
        if (!!user && body?.currentPassword) {
            const isMatched = await bcrypt.compare(body.currentPassword, user.password);
            if (isMatched) {
                const hashedPassword = await bcrypt.hash(body.password, 8);
                await User.updateOne({ _id: user._id }, { password: hashedPassword })
                return res.status(200).send({
                    error: false,
                    msg: 'Successfully updated',
                })
            } else {
                return res.status(400).send({
                    error: true,
                    msg: 'Wrong Input',
                })
            }
        } else {
            return res.status(401).send({
                error: true,
                msg: 'Unauthorized action'
            })
        }
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


/**
 * employee
 */
export const employeeCreate = async (req, res) => {
    try {
        const {user: admin} = res.locals;
        let {body} = req;

        let hashedPassword;
        if (body.password) {
            hashedPassword = await bcrypt.hash(body.password, 8);
        }

        if (!!body._id) {
            await User.updateOne({_id: body._id}, {...body, password: hashedPassword});
            return res.status(200).send({
                error: false,
                msg: 'Updated Successful',
            });
        } else {
            const isUser = await User.findOne({
                    email: body.email
            });
            if (!!isUser) {
                return res.status(400).send({
                    error: true,
                    msg: 'An account with this credential has already existed',
                });
            }

            const randomNumberGen = numberGen(6);
            let user = new User({
                name: body.first_name + ' ' + body.last_name,
                first_name: body.first_name,
                last_name: body.last_name,
                email: body.email,
                phone: body.phone,
                password: hashedPassword,
                role: body.role,
                joining_date: body.joining_date,
                department: body.department,
                permission: body.permission,
                key: randomNumberGen,
                verified: true,
                active: true,
                ticket_departments: body.ticket_departments,
                ticket_categories: body.ticket_categories,
                ticket_types: body.ticket_types,
            })
            await user.save();
            return res.status(200).send({
                error: false,
                msg: 'Successfully employee created'
            });
        }

    } catch (e) {
        return res.status(200).json({
            error: true,
            data: "Server failed"
        })
    }
};

export const employeeList = async (req, res) => {
    try {
        const {query} = req;
        let filter: any = {};
        if (!!query.search) {
            filter = {
                $or: [
                    {"name": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"email": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"phone": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"key": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"department.name": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"ticket_departments.name": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                    {"ticket_categories.name": {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                ]
            }
        }
        // @ts-ignore
        const employees = await User.aggregatePaginate(User.aggregate([
            {
                $match: {
                    role: 'employee'
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
            {$unwind: {path: "$department", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: 'roles',
                    localField: 'permission',
                    foreignField: '_id',
                    as: 'permission'
                }
            },
            {$unwind: {path: "$permission", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: 'ticket_departments',
                    let: {"ticket_departments": "$ticket_departments"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", {
                                        $cond: {
                                            if: {$isArray: "$$ticket_departments"},
                                            then: "$$ticket_departments",
                                            else: []
                                        }
                                    }]
                                }
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                active: 1
                            }
                        }
                    ],
                    as: 'ticket_departments'
                }
            },
            {$unwind: {path: "$ticket_departments", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: 'ticket_departments',
                    let: {"ticket_categories": "$ticket_categories"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$parent", {
                                        $cond: {
                                            if: {$isArray: "$$ticket_categories"},
                                            then: "$$ticket_categories",
                                            else: []
                                        }
                                    }]
                                }
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                active: 1
                            }
                        }
                    ],
                    as: 'ticket_categories'
                }
            },
            {$unwind: {path: "$ticket_categories", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    password: 0
                }
            },
            {$match: filter}
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        });

        return res.status(200).json({
            error: false,
            data: employees
        })

    } catch (e) {
        console.log(e)
        return res.status(200).json({
            error: true,
            data: e.message
        })
    }
}

export const filteringEmployeeList = async (req, res) => {
    try {
        const {query} = req;
        // @ts-ignore
        const employees = await User.aggregatePaginate(User.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [

                            {$eq: ['$role', 'employee']},
                            {$eq: ['$department', new mongoose.Types.ObjectId(query.department)]},
                            {$eq: ['$permission', new mongoose.Types.ObjectId(query.role)]},
                        ]
                    }
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
            {$unwind: {path: "$department", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: 'roles',
                    localField: 'permission',
                    foreignField: '_id',
                    as: 'permission'
                }
            },
            {$unwind: {path: "$permission", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    password: 0
                }
            }
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
            sort: {createdAt: -1},
        });

        return res.status(200).json({
            error: false,
            data: employees
        })

    } catch (e) {
        return res.status(200).json({
            error: true,
            data: e.message
        })
    }
}

export const employeeElement = async () => {
    try {
        let employeeRoles = await Role.find({}).select('name');
        let arr = [];
        for (let i = 0; i < employeeRoles.length; i++) {
            if (employeeRoles[i].name === 'user' ||
                employeeRoles[i].name === 'super_admin' ||
                employeeRoles[i].name === 'admin' ||
                employeeRoles[i].name === 'site_admin') {
                continue
            }
            arr.push(employeeRoles[i]);
        }

        return arr;

    } catch (error) {
        return []
    }
}


// fetch employee data
export const fetchEmployeeData = async (req, res, next) => {
    try {
        const {query} = req;
        let filter: any = {}
        let employeeRoles = await employeeElement();

        // @ts-ignore
        const employees = await User.aggregatePaginate(User.aggregate([
            {
                $match: {
                    roles: {$in: employeeRoles.map(d => d._id)}
                }
            },
            {$unwind: "$roles"},
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roles',
                    foreignField: '_id',
                    as: 'role'
                }
            },
            {$unwind: {path: "$role", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            {$unwind: {path: "$department", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    name: {$concat: [{$ifNull: [{$concat: ["$first_name", " "]}, '']}, {$ifNull: [{$concat: ["$middle_name", " "]}, '']}, {$ifNull: ["$last_name", '']}]},
                    phone: 1,
                    email: 1,
                    department: "$department.name",
                    designation: {$ifNull: ["$role.name", "-"]},
                    joining_date: {$ifNull: ["$joining_date", 'N/A']},
                    createdAt: 1,
                    status: 1,
                    key: 1,
                    first_name: 1,
                    middle_name: 1,
                    last_name: 1,
                }
            },
            ...(!!query.search ? [
                {
                    $match: {
                        $or: [
                            {id_number: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {name: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {email: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {phone: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {department: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {designation: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {joining_date: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                            {status: {$regex: new RegExp(query.search.toLowerCase(), "i")}},
                        ]
                    }
                }
            ] : []),
            {$match: filter},
            {$sort: {createdAt: -1}},
        ]), {
            page: query.page || 1,
            limit: query.size || 10,
        });

        return res.status(200).send({
            error: false,
            element: employeeRoles,
            data: employees
        })

    } catch (error) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


// employee roles
export const fetchEmployeeRoles = async (req, res, next) => {
    try {
        let employeeRoles = await employeeElement();
        return res.status(200).send({
            error: false,
            data: employeeRoles,
        })
    } catch (error) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


// delete user 
export const deleteUser = async (req, res, next) => {
    try {
        const {query} = req;
        const user = await User.findById(query?._id);
        if (user?.role === 'admin') {
            return res.status(400).json({
                error: true,
                msg: 'Request denied!'
            })
        }

        const deleteUser = await User.deleteOne({_id: query._id});
        if (deleteUser?.deletedCount === 0) return res.status(404).json({error: true, msg: 'Delete failed'})

        return res.status(200).json({
            error: false,
            msg: 'Deleted successful'
        })
    } catch (err) {
        return res.status(500).json({
            error: true,
            msg: err.message
        })
    }
}


// initialize firebase admin sdk
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

export const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert({
        //@ts-ignore
        type: "service_account",
        project_id: "futurx001-b4cc4",
        private_key_id: "f50f2474457d5182e3a90727d64412acea24a297",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCdzkxxtG7kXnfL\n8QIrcdbI3ohYnV2nDXJp2u/wth8WFDEyALuq403w6TUW0mQor2agyvoUtZ5uKvDK\nOxeoPU7j3BQNQNhfk4FWCWVzEJuAX7z1veNFV+bvgZ0bBT+r2LRsZmi6qG1uOdZi\nqCoHQB/QGPCURuDHF5o+lHDGAJcWmXlENn0Srd2+EQBMtatAhi6wVLRNJk4iFCvg\nVcHgWWudZzWmyLJW/g40XPcZ8XafUVgL/sO9JvZf/IPcdrUvVQgWqjyKShnJz7qa\n49uZn1G3n8w3tUQzJqX4wYLVRhr+9jqRb7UIVtk4co1aAjk/7aI/J1hey4mokPZ6\nWpve3CjNAgMBAAECggEAIdkqffgrEgpuTT0aj0mJfcf3vHQyrp6chDadIUdbNx/p\nJnXQSzka0nofNFA4Ah8PVx16kz8aprxIrkQLEL/nwEnINkiKsMOBqjv1Of9dr2U5\nsYdDrK/MXeKyGWXgkKJ4nsi/nYv7fvlicgJqk2gOetMipVdnpuS55cLuxpXBUqwO\nAraVKOygXGWb0a3u21xt61kTiRVLf38GZhavMcMgYx1Q1IQLJN3dNodZFiqF7uPx\nw1m6zxirthgsY15C3mV9gQCNZpNmMtMz+KIXbuLUt8zngxqwA6aFi2YL4lLyd4ll\n2Ba52Imh/NYlzpX5J0E/cE2npEgtEU+USgXu12RyYQKBgQDLl93A45Vqwytx2nsl\nA4MVHDw8Ac+mvwLB2J6KSDAcWDxM809VhQVDXJO4E1fJJrFk64QXck05uGd18mLQ\nfg0h11jEZ77aGiLDiixox72FjSz5jSBV+gBDFXPcjQCTuelYKRD2qJ0GHCrqae59\nZc5P9uDBbwTBYsK627ceP/pgoQKBgQDGbTFg2+foC8rw+jm/7kVFGSt2OEiUYynI\nYWnla/KeWkjO7RZvqnnfSE2czegdvr2FoFvR/P9yYmQGg+oacwA/w8ypN2nCAssm\nPpgYvi6HWQIFdj5aJovn5lRLydfWNzwpt/cyGgEoWnIs4js/cmbqVzm4RNcItqF0\nRLib7o9crQKBgQCtPtXcxcznxJy7jYcswAhTdmtrRL9GzVOzUHnYggUumYb2lDT2\nOPN5ltW81fjlmp9pmWAV85XzgA/KNjAP6rOSEIXg28d0ILlkW7fekdmcQ735vTW+\n87Y1X5PwIaxUCOeftZJR0rmL8XwzbWEcI/2j3hjzgV0ykq/SAhWZECgnAQKBgF67\n2RxOQSz3HF/qh1HL90RjHO3nNzepFFS3tXA0FnRl1Gb+qHyNnnvssClR4ST6YM+A\nXPYnXOoGcYzuxAD2sMLAv2B2tUZMQSM0NTdy7RHve9iRuHkf+CGyRMKeTi7W1iFw\n1FMWOUFD1Uj6haDoBJyTIlqIe0WMtA6nlJ/VyJpNAoGBAKHE8bjzgvZtxjG3YWq4\n1k5yUAE9zIvUrPcRejOWp7HpoxA8bzjPav379LJUpd6BrIMKeGS7kZ6lrHDF/axC\nuju7diPmOlxxPNKRoZnft/Cw+HzpvIWhCtfmG/PF2JO/DSuGYvImQSxtT24pjRl5\n53v1eZsgDw0pWd7z9/+zw01s\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-k2y38@futurx001-b4cc4.iam.gserviceaccount.com",
        client_id: "111921065638818982905",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-k2y38%40futurx001-b4cc4.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
    })
});

export const verifyGoogleUser = async (req, res, next) => {
    try {
        let body = req.body;
        //get user from firebase.
        let decodedToken = await getAuth(firebaseAdmin).verifyIdToken(body.access_token);
        //check if id-token valid
        if (!decodedToken.email) {
            res.status(401).send({
                error: true,
                msg: "Wrong Token",
            });
        }
        //else find user from database if user exist
        let user = await User.findOne({ email: decodedToken?.email });
        //if not found,create user

        if (!user) {
            user = new User({
                name: decodedToken.name,
                email: decodedToken.email?.toLowerCase(),
                photoURL: decodedToken.picture,
                role: "user",
                auth_type: "google",
                verified: true,
                active: true,
            });
            await user.save();
        }
        //sign jwt
        let token = jwt.sign({ _id: user?._id, email: user?.email, role: "user" }, secret, {
            expiresIn: "8d",
        });
        
        return res.status(200).send({
            error: false,
            msg: "Login successful",
            token,
            verified: user?.verified,
            active: user?.active,
            role: user?.role,
        });
    } catch (e) {
        console.log(e);
        return res.status(500).send({
            error: true,
            msg: "Login failed! Try again",
        });
    }
};
