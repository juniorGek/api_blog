import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        user:{
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        description:{
            type:String,   
        },
        question:{
            type:String,
            required:true
        },
        media:{
            type:String,
        },
        type:{
            type:String,
            enum:['question','poll'],
            required:true,
            default:'question'
        },
        options:[{
            _id: {
                type: Schema.Types.ObjectId,
                auto: true
            },
            text:{
                type:String,
                required:true
            },
            number_of_votes:{
                type: Number,
                default: 0,
            },
            voted_users: [{
                type: Schema.Types.ObjectId,
                ref: 'user',
            }],
        }],
        number_of_answers: {
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

schema.plugin(aggregatePaginate);
schema.plugin(paginate);
const Question = model('question', schema);

export default Question;
