import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const schema = new Schema(
    {
        blog_id: Schema.Types.ObjectId,
        answer_id: Schema.Types.ObjectId,
        parent_comment_id: Schema.Types.ObjectId,
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        comment : String,
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const CommentReply = model('comment_reply', schema);
export default CommentReply;
