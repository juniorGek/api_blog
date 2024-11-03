import {model, Schema} from 'mongoose'
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

let schema = new Schema({
    email: String,
    active: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Subscriber = model('subscriber', schema)
export default Subscriber