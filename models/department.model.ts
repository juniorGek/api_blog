import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'


// schema design
const schema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },

}, {
    timestamps: true
});


schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Department = mongoose.model("department", schema);

export default Department;
