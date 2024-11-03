import { model, Schema } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

let schema = new Schema(
    {
        topic:{
            type: Schema.Types.ObjectId,
            ref: 'storyTopic',
            required: true,
        },
        type: {
            type: String,
            enum: ['text', 'video', 'image'],
            default: 'text',
        },
        description: String,
        content: Object,
        image_url: String,
        video_url: String,

        start_time: Date,
        end_time: Date,
        status:{
            type: String,
            enum: ['draft', 'published'],
            default: 'published',
        },
        
    },
    { timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Story = model('story', schema);

const checkAndUpdateStoryStatus = async () => {
    const currentTime = new Date();
    const expiredStories = await Story.find({
        end_time: { $lt: currentTime },
        status: 'published', // Consider only stories with 'published' status
    });

    for (const story of expiredStories) {
        story.status = 'draft';
        await story.save();
    }
};

// Set an interval to periodically execute the function
setInterval(checkAndUpdateStoryStatus, 60 * 3000); // Every three minute in milliseconds

export default Story;