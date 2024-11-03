import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        cover_image: String,
        title: {
            type: Object,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'category',
        },
        subcategory:{
            type: Schema.Types.ObjectId,
            ref: 'subcategory',
        },
        short_info: Object,
        details: Object,
        tags: [{
            type: Schema.Types.ObjectId,
            ref: 'tags',
        }],
        number_of_comments: {
            type: Number,
            default: 0,
        },
        number_of_views: {
            type: Number,
            default: 0,
        },
        time_to_read: {
            type: Object,
        },
        post_type:{
            type: String,
            enum: ['content', 'video'],
            default: 'content'
        },
        video_url: String,
        add_to_featured: {
            type: Boolean,
            default: false,
        },
        published:{
            type: Boolean,
            default: false
        },
        editors_choice:{
            type: Boolean,
            default: false
        },
        is_trending:{
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Blog = model('blog', schema);

export default Blog;
