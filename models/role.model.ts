import {model, Schema} from 'mongoose'
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"

let schema = new Schema({
        name: {
            type: String,
            unique: true,
        },
        deletable: {
            type: Boolean,
            default: true
        },
        permissions: [String],
        user: {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        department: {
            type: Schema.Types.ObjectId,
            ref: 'department',
        },

    }, {timestamps: true}
)

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Role = model('role', schema)
export default Role