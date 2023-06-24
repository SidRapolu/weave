// Story.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StorySchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    likes: { type: Number, default: 0 },
    open: { type: Boolean, default: false },
    approvedContributions: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
});

module.exports = mongoose.model('Story', StorySchema);
