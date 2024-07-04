const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/gallerydb")

const postSchema = mongoose.Schema({
  caption: {
    type: String
  },
  image: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('Post', postSchema);

