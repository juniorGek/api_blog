import {model, Schema} from 'mongoose'
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

let schema = new Schema({
    name: String,
    first_name: String,
    middle_name: String,
    last_name: String,
    username: {
        type: String,
        lowercase: true,
        trim: true
    },
    about: String,
    image: String,
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'employee'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: false,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },
    roles: [{
        type: Schema.Types.ObjectId,
        ref: 'role',
    }],
    permission: {
        type: Schema.Types.ObjectId,
        ref: 'role',
    },
    key: {
        type: String,
        trim: true
    },
    joining_date: Date,
    auth_type: {
        type: String,
        enum: ["google", "email", "facebook", "twitter"],
    },

}, {timestamps: true})


schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const User = model('user', schema)

export default User
