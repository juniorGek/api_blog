import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        name: {
            type: Object,
            unique: true,
        },
        image: String,
        description: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Tags = model('tags', schema);
export default Tags;