import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        name: {
            type: String,
        },
        image: String,
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Gallery = model('gallery', schema);
export default Gallery;