import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        // blog: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'blog',
        // },
        // user: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'user',
        // },
        // content: String,
        // reply_to: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'comment',
        // },
        // replies: [{
        //     type: Schema.Types.ObjectId,
        //     ref: 'comment',
        // }],
        // number_of_replies: {
        //     type: Number,
        //     default: 0,
        // },


        // alternative
        content: String,
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        blog_id: {
            type: Schema.Types.ObjectId,
            ref: 'blog',
        },
        replies: [{
            type: Schema.Types.ObjectId,
            ref: 'comment_reply',
        }],
        answer_id:{
            type: Schema.Types.ObjectId,
            ref: 'answer',
        },
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Comment = model('comment', schema);

export default Comment;
