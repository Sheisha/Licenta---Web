const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const spatiuSchema = new Schema({
  ora: {
    type: String,
    required: true
  },
  valabilitate: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Spatiu', spatiuSchema);