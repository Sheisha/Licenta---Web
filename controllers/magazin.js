const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const date = require("date-and-time");
const ro = require("date-and-time/locale/ro");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { validationResult } = require("express-validator/check");
const sgMail = require("@sendgrid/mail");
const webdriver = require('selenium-webdriver');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Spatiu = require("../models/spatiu");
const Serviciu = require("../models/serviciu");
const Rezervare = require("../models/rezervare");
const User = require("../models/user");

// const spatiiTotaleSpalatorie = 3;

date.locale(ro);
const pattern = date.compile("ddd DD/MM/YYYY");

//pentru resetare spatii valabile
// let azi = date.parse('Mie 26/04/2023', pattern);

let azi = date.format(new Date(), pattern);
console.log("azi: " + azi);

async function verificaDataSiModificaValabilitate() {
  var dataCurenta = date.format(new Date(), pattern);
  console.log("dataCurenta: " + dataCurenta);

  if (azi !== dataCurenta) {
    azi = dataCurenta;
    await Spatiu.updateMany({}, { valabilitate: 0 });
  }
}

exports.getIndex = (req, res, next) => {
  if (req.user) {
    User.findById({ _id: req.user._id })
      .then((user) => {
        res.render("magazin/index", {
          pageTitle: "Spalatorie-Auto",
          path: "/",
          eAdmin: user.eAdmin,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  } else {
    res.render("magazin/index", {
      pageTitle: "Spalatorie-Auto",
      path: "/",
      eAdmin: false,
    });
  }
};

exports.getRezervare = (req, res, next) => {
  let message = req.flash("error");
  let vehicule;
  let serviciu;

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  Serviciu.distinct("tipVehicul")
    .then((tipuriVehicule) => {
      vehicule = tipuriVehicule;
      console.log(vehicule);
      return Serviciu.distinct("tipServiciu");
    })
    .then((tipuriServicii) => {
      serviciu = tipuriServicii;
      console.log(serviciu);
      return Serviciu.find();
    })
    .then((totalServicii) => {
      res.render("magazin/rezervare", {
        path: "/rezervare",
        pageTitle: "Rezervare",
        errorMessage: message,
        eAdmin: req.user.eAdmin,

        servicii: totalServicii,
        tipVehicul: vehicule,
        serviciu: serviciu,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCos = (req, res, next) => {
  verificaDataSiModificaValabilitate();
  req.user
    .populate("cos.items.serviciuId")
    .then((user) => {
      //   console.log(user.cart.items);
      const servicii = user.cos.items;
      res.render("magazin/cos", {
        path: "/cos",
        pageTitle: "Cosul tau",
        servicii: servicii,
        eAdmin: req.user.eAdmin,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postRezervareAlegeTipVehicul = (req, res, next) => {
  const tipVehiculAles = req.body.tipVehiculAles;

  Serviciu.find({ tipVehicul: tipVehiculAles })
    .then((servicii_valabile) => {
      res.render("magazin/rezervare_alegeServiciu", {
        path: "/rezervare_alegeServiciu",
        pageTitle: "Rezervare",
        servicii: servicii_valabile,
        eAdmin: req.user.eAdmin,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCos = (req, res, next) => {
  const serviciuId = req.body.serviciuId;
  
  Serviciu.findById(serviciuId)
    .then((serviciu) => {
      return req.user.adaugaInCos(serviciu);
    })
    .then((result) => {
      if (result == "serviciuExistent") {
        res.redirect("/deja-in-cos");
      } else if (result == "altTipVehicul") {
        res.redirect("/alt-tip-vehicul");
      } else {
        res.redirect("/cos");
      }
    })

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCosStergeServiciu = (req, res, next) => {
  const serviciuId = req.body.serviciuId;
  req.user
    .stergeDinCos(serviciuId)
    .then((result) => {
      res.redirect("/cos");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getAlegeOra = (req, res, next) => {
  var acum = date.format(new Date(), "HH:mm");
  console.log(acum);

  // ora:1 -> sortare ascendenta , ora:-1 -> sortare descendenta
  Spatiu.find({
    ora: { $lt: acum },
    // valabilitate: {$lt: spatiiTotaleSpalatorie}
  })
    .sort({ ora: 1 })
    .then((ore) => {
      res.render("magazin/rezervare_alegeOra", {
        path: "/rezervare_alegeOra",
        pageTitle: "Rezervare",
        eAdmin: req.user.eAdmin,
        oreValabile: ore,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let servicii;
  let total = 0;

  if (req.user.cos.items.length === 0 || req.body.ora === undefined) {
    return res.redirect("/cos");
  }
  console.log(req.user.cos.items.length);

  
  req.user
    .populate("cos.items.serviciuId")
    .then((user) => {
      //   console.log(user.cart.items);
      servicii = user.cos.items;
      total = 0;
      servicii.forEach((s) => {
        total += s.cantitate * s.serviciuId.pret;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: servicii.map((s) => {
          return {
            // name: p.productId.title,
            price_data: {
              unit_amount: s.serviciuId.pret * 100,
              currency: "RON",
              product_data: {
                name: s.serviciuId.tipServiciu,
                description: s.serviciuId.tipVehicul,
              },
            },
            // currency: 'usd',
            quantity: s.cantitate,
          };
        }),
        mode: "payment",
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("magazin/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        servicii: servicii,
        oraRezervare: "",
        totalSum: total,
        sessionId: session.id,
        eAdmin: req.user.eAdmin,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCheckout = (req, res, next) => {
  let servicii;
  let total = 0;
  let numarVehicul;
  let username;
  let telefon;

  const oraId = req.body.oraId;

  
  if (req.user.cos.items.length < 0) {
    return res.redirect("/cos");
  }

  Spatiu.findById(oraId).then((spatiu) => {

    if(spatiu.valabilitate === 3 ){
      return res.redirect("/500");
    }

    let ora = spatiu.ora;
    req.user
      .populate("cos.items.serviciuId")
      .then((user) => {
        //   console.log(user.cart.items);
        numarVehicul = user.numarVehicul;
        username = user.username;
        telefon = user.telefon;
        servicii = user.cos.items;
        total = 0;
        servicii.forEach((s) => {
          total += s.cantitate * s.serviciuId.pret;
        });
        // total = total.toFixed(2);
        return stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: servicii.map((s) => {
            return {
              // name: p.productId.title,
              price_data: {
                unit_amount: s.serviciuId.pret * 100,
                currency: "RON",
                product_data: {
                  name: s.serviciuId.tipServiciu,
                  description: s.serviciuId.tipVehicul,
                },
              },
              // currency: 'usd',
              quantity: s.cantitate,
            };
          }),
          mode: "payment",
          success_url:
            req.protocol + "://" + req.get("host") + "/checkout/success/" + ora,
          cancel_url:
            req.protocol + "://" + req.get("host") + "/checkout/cancel",
        });
      })
      .then((session) => {
        res.render("magazin/checkout", {
          path: "/checkout",
          pageTitle: "Checkout",
          servicii: servicii,
          oraRezervare: ora,
          numarVehicul: numarVehicul,
          username: username,
          telefon: telefon,
          totalSum: total.toFixed(2),
          sessionId: session.id,
          eAdmin: req.user.eAdmin,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.postCheckoutCash = (req, res, next) => {
  const pattern = date.compile("ddd DD/MM/YYYY");
  const dataCurenta = date.format(new Date(), pattern);

  const ora = req.body.ora;
  const numarVehicul = req.body.numarVehicul;
  const numeCumparator = req.body.username;
  const telefon = req.body.telefon;

  let rezervare;

  if (req.user.cos.items.length === 0) {
    return res.redirect("/cos");
  }

  Spatiu.findOne({ora: ora})
  .then((spatiu) => {
    
    if(spatiu.valabilitate === 3){
      return res.redirect("/500");
    }
      req.user
      .populate("cos.items.serviciuId")
      .then((user) => {
        const servicii = user.cos.items.map((s) => {
          return { cantitate: s.cantitate, serviciu: { ...s.serviciuId._doc } };
        });

        rezervare = new Rezervare({
          user: {
            email: req.user.email,
            username: req.user.username,
            userId: req.user,
          },
          telefon: telefon,
          numeCumparator: numeCumparator,
          numarVehicul: numarVehicul,
          plata: {
            metoda: "CASH",
          },
          ora: ora,
          data: dataCurenta,
          servicii: servicii,
        });

        return rezervare.save();
      })
      .then((result) => {
        const mail = {
          to: req.user.email,
          from: "alexiaivanof@gmail.com",
          subject: "Rezervare creata! -> detalii",
          text: "Rezervare creata!",
          html: `
          <strong> Rezervare cu id - ${rezervare._id} </strong>
          <p> ${rezervare.data}, ora: ${rezervare.ora}</p>
          <p> Nume cumparator: ${rezervare.numeCumparator}</p>
          <br/>
          <p> Click aici <a href="http://localhost:4000/rezervari/${rezervare._id}">link</a> pentru mai multe detalii.</p>
        `,
        };
        return sgMail
          .send(mail)
          .then((result) => {
            console.log("Email trimis.");
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      })
      .then((result) => {
        return req.user.golesteCos();
      })
      .then(() => {
        Spatiu.findOne({ ora: ora }).then((spatiu) => {
          spatiu.valabilitate += 1;
          spatiu.save();
        });
      })
      .then(() => {
        res.redirect("/rezervari");
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });

    
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

  
};

exports.getCheckoutSuccess = (req, res, next) => {
  const pattern = date.compile("ddd DD/MM/YYYY");
  const dataCurenta = date.format(new Date(), pattern);
  let rezervare;
  const ora = req.params["ora"];

  if (req.user.cos.items.length < 0) {
    return res.redirect("/cos");
  }



  req.user
    .populate("cos.items.serviciuId")
    .then((user) => {
      const servicii = user.cos.items.map((s) => {
        return { cantitate: s.cantitate, serviciu: { ...s.serviciuId._doc } };
      });

      rezervare = new Rezervare({
        user: {
          email: req.user.email,
          username: req.user.username,
          userId: req.user,
        },
        numeCumparator: req.user.username,
        numarVehicul: req.user.numarVehicul,
        telefon: req.user.telefon,
        plata: {
          metoda: "card bancar",
          platit: true,
        },
        ora: ora,
        data: dataCurenta,
        servicii: servicii,
      });
      return rezervare.save();
    })
    .then((result) => {
      const mail = {
        to: req.user.email,
        from: "alexiaivanof@gmail.com",
        subject: "Rezervare creata! -> detalii",
        text: "Rezervare creata!",
        html: `
        <strong> Rezervare cu id - ${rezervare._id} </strong>
        <p> ${rezervare.data}, ora: ${rezervare.ora}</p>
        <p> Nume cumparator: ${rezervare.numeCumparator}</p>
        <br/>
        <p> Click aici <a href="http://localhost:4000/rezervari/${rezervare._id}">link</a> pentru mai multe detalii.</p>
      `,
      };
      return sgMail
        .send(mail)
        .then((result) => {
          console.log("Email trimis.");
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .then((result) => {
      return req.user.golesteCos();
    })
    .then(() => {
      Spatiu.findOne({ ora: ora }).then((spatiu) => {
        spatiu.valabilitate += 1;
        spatiu.save();
      });
    })
    .then(() => {
      res.redirect("/rezervari");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRezervari = (req, res, next) => {
  let totalRezervari;


  Rezervare.find({
    "user.userId": req.user._id,
  })
    .sort({ _id: -1 })
    .then(rezervari => {
      totalRezervari = rezervari;
      return Rezervare.find({
        "user.userId": req.user._id,
      }).distinct("data");
    })
    .then((rezervari_data) => {

      let rez = rezervari_data;
      const date_finale = [];

      for (let rezervare of rez){
        var values = rezervare.split(" ");
        var rezervare_data = values[1];
        date_finale.push(rezervare_data);
        // console.log(date_finale);
      }
      rezervari_data = date_finale.sort((a,b) => new Date(b) - new Date(a));
      // console.log(rezervari_data);

      res.render("magazin/rezervari", {
        path: "/rezervari",
        pageTitle: "Rezervarile tale",
        rezervari_data: rezervari_data,
        rezervari: totalRezervari,
        eAdmin: req.user.eAdmin,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getFactura = (req, res, next) => {
  const rezervareId = req.params.rezervareId;
  Rezervare.findById(rezervareId)
    .then((rezervare) => {
      if (!rezervare) {
        return next(new Error("Nu exista aceasta rezervare."));
      }
      if (rezervare.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Neautorizat!"));
      }
      const facturaNume = "rezervare-" + rezervareId + ".pdf";
      const facturaPath = path.join("data", "facturi", facturaNume);

      const pdfPoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + facturaNume + '"'
      );
      pdfPoc.pipe(fs.createWriteStream(facturaPath));
      pdfPoc.pipe(res);

      pdfPoc.fontSize(20).text("Factura - Id " + rezervareId, {
        underline: true,
      });
      pdfPoc.text("---------------------------------------------------");

      pdfPoc.fontSize(18).text("Informatii Client: ");
      pdfPoc.fontSize(14).text("Email: " + rezervare.user.email);
      pdfPoc.fontSize(14).text("Nume: " + rezervare.numeCumparator);
      pdfPoc.fontSize(14).text("Nr Telefon: " + rezervare.telefon);
      pdfPoc.fontSize(14).text("Numar Vehicul: " + rezervare.numarVehicul);

      pdfPoc.text("---------------------------------------------------");

      pdfPoc.fontSize(18).text("Informatii Firma: ");
      pdfPoc.fontSize(14).text("Email: alexiaivanof_licenta@yahoo.com");
      pdfPoc
        .fontSize(14)
        .text("Locatie: Constanta, Strada Stefan Cel Mare, Nr. 54");
      pdfPoc.fontSize(14).text("Nr Telefon: 0722 019 234");

      pdfPoc.text("---------------------------------------------------");

      pdfPoc.fontSize(18).text("Informatii rezervare: ");

      pdfPoc.fontSize(14).text("Data: " + rezervare.data);
      pdfPoc.fontSize(14).text("Ora: " + rezervare.ora);
      pdfPoc.fontSize(14).text("Metoda plata: " + rezervare.plata.metoda);

      pdfPoc.text("---------------------------------------------------");

      pdfPoc.fontSize(18).text("Servicii rezervate: ");
      pdfPoc.text("");

      let total = 0;
      rezervare.servicii.forEach((serviciu) => {
        total += serviciu.cantitate * serviciu.serviciu.pret;
        pdfPoc
          .fontSize(14)
          .text(
            serviciu.serviciu.tipServiciu +
              " - " +
              serviciu.cantitate +
              " x " +
              "RON " +
              serviciu.serviciu.pret
          );
      });
      pdfPoc.text("---------------------------------------------------");

      pdfPoc.fontSize(20).text("Total : RON " + total.toFixed(2));

      pdfPoc.end();
    })
    .catch((err) => console.log(err));
};

exports.getDetaliiServicii = (req, res, next) => {
  if (req.user) {
    User.findById({ _id: req.user._id })
      .then((user) => {
        res.render("magazin/detalii_servicii", {
          path: "/detalii_servicii",
          pageTitle: "Detalii Sevicii",
          eAdmin: user.eAdmin,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  } else {
    res.render("magazin/detalii_servicii", {
      path: "/detalii_servicii",
      pageTitle: "Detalii Sevicii",
      eAdmin: false,
    });
  }
};
