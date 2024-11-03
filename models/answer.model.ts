import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        question:{
            type: Schema.Types.ObjectId,
            ref: 'question',
        },
        user:{
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        description:{
            type:String,   
        },
        title:{
            type:String,
        },
        media:{
            type:String,
        },
        number_of_comments: {
            type: Number,
            default: 0,
        },
        number_of_upvote: {
            type: Number,
            default: 0,
        },
        number_of_downvote: {
            type: Number,
            default: 0,
        },
        upvotedUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'user',
        }],
        downvotedUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'user',
        }],
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Answer = model('answer', schema);

export default Answer;
