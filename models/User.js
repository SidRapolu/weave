const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
});

module.exports = mongoose.model('User', UserSchema);