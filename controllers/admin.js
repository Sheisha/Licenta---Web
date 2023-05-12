const { validationResult } = require("express-validator");

const date = require("date-and-time");
const ro = require("date-and-time/locale/ro");

const Serviciu = require("../models/serviciu");
const Rezervare = require("../models/rezervare");
const Spatiu = require("../models/spatiu");

const { getRezervari } = require("./magazin");
const user = require("../models/user");

const spatiiTotaleSpalatorie = 3;

exports.getAdaugaServiciu = (req, res, next) => {
  res.render("admin/editeaza-serviciu", {
    pageTitle: "Adauga Serviciu",
    path: "/admin/adauga-serviciu",
    eAdmin: req.user.eAdmin,

    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAdaugaServiciu = (req, res, next) => {
  const tipServiciu = req.body.tipServiciu;
  const tipVehicul = req.body.tipVehicul;
  const pret = req.body.pret;

  const errors = validationResult(req);
  let totalServicii;

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/editeaza-serviciu", {
      pageTitle: "Adauga Serviciu",
      path: "/admin/adauga-serviciu",
      editing: false,
      hasError: true,
      eAdmin: req.user.eAdmin,
      
      serviciu: {
        tipServiciu: tipServiciu,
        tipVehicul: tipVehicul,
        pret: pret,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const serviciu = new Serviciu({
    // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
    tipServiciu: tipServiciu,
    tipVehicul: tipVehicul,
    pret: pret,
    userId: req.user,
  });
  console.log(req.user);
  serviciu
    .save()
    .then((result) => {

      console.log("Serviciu creat.");

      Serviciu.find()
      .then((servicii) => {
        totalServicii = servicii;
        return Serviciu.distinct("tipVehicul")
      })
      .then(servicii_titlu => {
        res.render("admin/servicii", {
          
          pageTitle: "Admin Servicii",
          path: "/admin/servicii",
          eAdmin: req.user.eAdmin,
          servicii: totalServicii,
          servicii_titlu: servicii_titlu,
          succesModificareAdaugare: true,
          succesStergere: false
        });
        
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

exports.getEditeazaServiciu = (req, res, next) => {
  const modEditare = req.query.edit;
  if (!modEditare) {
    return res.redirect('/');
  }
  const serviciuId = req.params.serviciuId;
  Serviciu.findById(serviciuId)
    .then(serviciu => {
      if (!serviciu) {
        return res.redirect('/');
      }
      res.render('admin/editeaza-serviciu', {
        pageTitle: 'Editeaza Serviciu',
        path: '/admin/editeaza-serviciu',
        eAdmin: req.user.eAdmin,
        editing: modEditare,
        serviciu: serviciu,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};




exports.postEditeazaServiciu = (req, res, next) => {
  const serviciuId = req.body.serviciuId;
  const nouTipServiciu = req.body.tipServiciu;
  const nouTipVehicul = req.body.tipVehicul;
  const nouPret = req.body.pret;

  const errors = validationResult(req);
  let totalServicii;

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/editeaza-serviciu', {
      pageTitle: 'Editeaza Serviciu',
      path: '/admin/editeaza-serviciu',
      editing: true,
      hasError: true,
      eAdmin: req.user.eAdmin,

      serviciu: {
        tipServiciu: nouTipServiciu,
        tipVehicul: nouTipVehicul,
        pret: nouPret,
        _id: serviciuId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Serviciu.findById(serviciuId)
    .then(serviciu => {
      
      serviciu.tipServiciu = nouTipServiciu;
      serviciu.tipVehicul = nouTipVehicul;
      serviciu.pret = nouPret;
      
      return serviciu.save().then(result => {
        console.log('Serviciu modificat!');
        Serviciu.find()
          .then((servicii) => {
            totalServicii = servicii;
            return Serviciu.distinct("tipVehicul")
          })
          .then(servicii_titlu => {
            res.render("admin/servicii", {
              
              pageTitle: "Admin Servicii",
              path: "/admin/servicii",
              eAdmin: req.user.eAdmin,
              servicii: totalServicii,
              servicii_titlu: servicii_titlu,
              succesModificareAdaugare: true,
              succesStergere: false
            });
            
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
        
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getServicii = (req, res, next) => {
  let totalServicii;

  Serviciu.find()
    .then((servicii) => {
      totalServicii = servicii;
      return Serviciu.distinct("tipVehicul")
    })
    .then(servicii_titlu => {
      res.render("admin/servicii", {
        
        pageTitle: "Admin Servicii",
        path: "/admin/servicii",
        eAdmin: req.user.eAdmin,
        servicii: totalServicii,
        servicii_titlu: servicii_titlu,
        succesModificareAdaugare: false,
        succesStergere: false
      });
      
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getstergeServiciu = (req, res, next) => {
  const serviciuId = req.params.serviciuId;
  let totalServicii;

  Serviciu.findById(serviciuId)
    .then(serviciu => {
      if(!serviciu){
        return next(new Error('Nu exista serviciul.'));
      }
      return Serviciu.deleteOne({ _id: serviciuId});

    })
    .then(() => {
      console.log('Serviciu sters.');

      Serviciu.find()
        .then((servicii) => {
          totalServicii = servicii;
          return Serviciu.distinct("tipVehicul")
        })
        .then(servicii_titlu => {
          res.render("admin/servicii", {
            
            pageTitle: "Admin Servicii",
            path: "/admin/servicii",
            eAdmin: req.user.eAdmin,
            servicii: totalServicii,
            servicii_titlu: servicii_titlu,
            succesModificareAdaugare: false,
            succesStergere: true
          });
          
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch(err => {
      res.status(500).json({message: 'Nu s-a putut sterge serviciul..'});
    });

};




exports.getTabelRezervari = (req, res, next) => {
  dataCurenta = new Date();

  date.locale(ro);
  const pattern = date.compile("ddd DD/MM/YYYY");
  const azi = date.format(dataCurenta, pattern);

  // console.log(azi);

  Rezervare.find({ data: azi })
    .then((rezervari) => {
      Spatiu.find().sort({ora: 1})
      .then((spatii) =>
        res.render("admin/tabelRezervari", {
          pageTitle: "Admin Tabel Rezervari",
          path: "/admin/tabelRezervari",
          eAdmin: req.user.eAdmin,

          rezervari: rezervari,
          spatii: spatii,
          spatiiTotaleSpalatorie: spatiiTotaleSpalatorie
        })
      );
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.getRezervareUser = (req, res, next) => {
  const rezervareId = req.params.rezervareId;
  console.log(rezervareId);

  Rezervare.findById(rezervareId)
  .then(rezervare => {
    res.render("admin/rezervareUser", {
      pageTitle: "Rezervare User",
      path: "/admin/rezervareUser",
      eAdmin: req.user.eAdmin,
      rezervare: rezervare
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
 
};

exports.postRezervareUser = (req, res, next) => {
  const rezervareId = req.params.rezervareId;

  Rezervare.findById(rezervareId)
  .then(rezervare => {
    rezervare.plata.platit = true;
    rezervare.save();

    res.render("admin/rezervareUser", {
      pageTitle: "Rezervare User",
      path: "/admin/rezervareUser",
      eAdmin: req.user.eAdmin,
      rezervare: rezervare
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
 
};

exports.postRezervareNeplatitaUser = (req, res, next) => {
  const rezervareId = req.params.rezervareId;

  Rezervare.findById(rezervareId)
  .then(rezervare => {
    rezervare.plata.platit = false;
    rezervare.save();

    res.render("admin/rezervareUser", {
      pageTitle: "Rezervare User",
      path: "/admin/rezervareUser",
      eAdmin: req.user.eAdmin,
      rezervare: rezervare
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
 
};