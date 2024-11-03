import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        name: {
            type: Object,
        },
        image: String,
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'categories',
        },
        description: String,
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Subcategory = model('subcategory', schema);
export default Subcategory;
