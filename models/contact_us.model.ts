import {model, Schema} from 'mongoose'
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// schema design
const schema = new Schema({
    name:{
        type: String,
        trim: true,
        minlength: 0,
        maxlength: 300,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 0,
        maxlength: 300,
    },
    message: {
        type: String,
        trim: true,
        minlength: 0,
        maxlength: 1000,
        required: true,
    },
    status: {
        type: Boolean,
        default: false
    },
    replied_message: {
        type: String,
        trim: true,
        minlength: 0,
        maxlength: 1000,
    },

}, {
    timestamps: true
});

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const ContactUs = model("contact_us", schema);

export default ContactUs