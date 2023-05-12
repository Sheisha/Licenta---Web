const User = require("../models/user");

exports.get404 = (req, res, next) => {
  if (req.user) {
    User.findById({ _id: req.user._id })
      .then((user) => {
        res.status(404).render("404", {
          pageTitle: "Pagina nu a fost gasita.",
          path: "/404",
          eAdmin: user.eAdmin,
          //isAuthenticated: req.session.isLoggedIn
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
      eAdmin: undefined,
    });
  }
};

exports.get500 = (req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Eroare",
    path: "/500",
    eAdmin: false,
    // isAuthenticated: req.session.isLoggedIn
  });
};

exports.getDejaInCos = (req, res, next) => {
  res.render("deja-in-cos", {
    pageTitle: "Eroare",
    path: "/deja-in-cos",
    eAdmin: req.user.eAdmin,
    // isAuthenticated: req.session.isLoggedIn
  });
};

exports.getAltTipVehiculAles = (req, res, next) => {
  res.render("alt-tip-vehicul", {
    pageTitle: "Eroare",
    path: "/alt-tip-vehicul",
    eAdmin: req.user.eAdmin,
    // isAuthenticated: req.session.isLoggedIn
  });
};

exports.getNeautorizat = (req, res, next) => {
  res.render("neautorizat", {
    pageTitle: "Neautorizat",
    path: "/neautorizat",
    eAdmin: req.user.eAdmin,
    // isAuthenticated: req.session.isLoggedIn
  });
};
