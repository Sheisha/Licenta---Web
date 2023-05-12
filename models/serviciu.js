const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serviciuSchema = new Schema({
  tipServiciu: {
    type: String,
    required: true
  },
  tipVehicul: {
    type: String,
    required: true
  },
  pret: {
    type: Number,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Serviciu', serviciuSchema);