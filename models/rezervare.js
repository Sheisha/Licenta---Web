const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const rezervareSchema = new Schema({
  servicii: [
    {
      serviciu: {
        type: Object,
        required: true,
      },
      cantitate: {
        type: Number,
        required: true,
      },
    }
  ],
  numeCumparator: {
    type: String,
    required: true
  },
  data: {
    type: String
  },
  ora: {
    type: String,
    required: true
  },
  numarVehicul: {
    type: String,
    required: true
  },
  telefon: {
    type: String,
    required: true
  },
  plata: {
    metoda: {
      type: String,
      required: true
    },
    platit:{
      type: Boolean,
      default: false
    }
  },
  user: {
    email: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
  },
});

module.exports = mongoose.model("Rezervare", rezervareSchema);
