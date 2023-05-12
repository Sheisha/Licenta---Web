const mongoose = require("mongoose");
const mongooseTypePhone = require('mongoose-type-phone');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
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
  resetToken: String,
  resetTokenExpirare: Date,
  cos: {
    items: [
      {
        serviciuId: {
          type: Schema.Types.ObjectId,
          ref: "Serviciu",
          required: true,
        },
        tipVehicul: {
          type: String
        },
        cantitate: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  eAdmin: {
    type: Boolean,
    default: false
  }
});

userSchema.methods.adaugaInCos = function (serviciu) {
  const cartProductIndex = this.cos.items.findIndex((cp) => {
    return cp.serviciuId.toString() === serviciu._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cos.items];

//verific daca exista serviciul in cos
  if (cartProductIndex < 0) {
    const tipVehiculAles = this.cos.items.findIndex((cp) => {
      return cp.tipVehicul.toString() === serviciu.tipVehicul.toString();
    });
// verific daca serviciul pe care doresc sa il adaug face parte din acelasi tip Vehicul
//daca da, il adaug
    if(tipVehiculAles >= 0 || this.cos.items.length === 0){
      updatedCartItems.push({
        serviciuId: serviciu._id,
        tipVehicul: serviciu.tipVehicul,
        cantitate: newQuantity,
      });
//altfel , s-a ales serviciu cu alt tip vehicul
    } else {
      var altTipVehicul = 'altTipVehicul';
      return altTipVehicul;
    }
//altfel , deja exista si nu il mai adaug din nou 
  } else {
    var serviciuExistent = 'serviciuExistent';
    return serviciuExistent;
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cos = updatedCart;
  return this.save();
};

userSchema.methods.stergeDinCos = function(serviciuId) {
  const updatedCartItems = this.cos.items.filter(serviciu => {
    return serviciu.serviciuId.toString() !== serviciuId.toString();
  });
  this.cos.items = updatedCartItems;
  return this.save();
}

userSchema.methods.golesteCos = function() {
  this.cos = {items: []};
  return this.save();
}

userSchema.methods.verificaCos = function() {
  if (this.cos.items.length === 0){
    return true;
  } else return false;
}

module.exports = mongoose.model("User", userSchema);
