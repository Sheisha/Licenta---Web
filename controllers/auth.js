const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { validationResult } = require("express-validator/check");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    eAdmin: undefined,
    oldInput: {
      email: "",
      password: "",
    },
    contCreat: false,
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    eAdmin: undefined,
    oldInput: {
      username: "",
      email: "",
      numarVehicul: "",
      telefon: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      eAdmin: undefined,
      oldInput: {
        email: email,
        password: password,
      },
      contCreat: false,
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "E-mail sau parola invalida.",
          eAdmin: undefined,
          oldInput: {
            email: email,
            password: password,
          },
          contCreat: false,
          validationErrors: [],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            user.golesteCos();
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "E-mail sau parola invalida.",
            eAdmin: undefined,
            oldInput: {
              email: email,
              password: password
            },
            contCreat: false,
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const numarVehicul = req.body.numarVehicul;
  const telefon = req.body.telefon;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      eAdmin: undefined,
      oldInput: {
        username: username,
        numarVehicul: numarVehicul,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        telefon: telefon
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        username: username,
        numarVehicul: numarVehicul,
        email: email,
        password: hashedPassword,
        telefon: telefon,
        cos: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      const mail = {
        to: email,
        from: "alexiaivanof@gmail.com",
        subject: "Creare cont cu succes!",
        text: "Creare cont cu succes!",
        html: "<h1>Creare cont cu succes!</h1>",
      };
      res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "",
        eAdmin: undefined,
        oldInput: {
          email: "",
          password: ""
        },
        contCreat: true,
        validationErrors: [],
      });
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
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getProfil = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  User.findById({_id: req.user._id})
  .then(user => {
    res.render("auth/profil", {
      pageTitle: "Profilul Meu",
      path: "/profil",
      user: user,
      eAdmin: user.eAdmin,
      validationErrors: [],
      errorMessage: message,
      succesModificare: false
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

};

exports.postProfil = (req, res, next) => {
  let userCurent;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).render("auth/profil", {
      path: "/profil",
      pageTitle: "Profil",
      user: req.user,
      eAdmin: req.user.eAdmin,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      succesModificare: false
      
    });
  }

  User.findById({_id: req.user._id})
  .then(user => {
    user.username = req.body.username;
    user.numarVehicul = req.body.numarVehicul;
    user.telefon = req.body.telefon;
    user.save();
    return userCurent = user;
  })
  .then(result => {
    // res.redirect("/profil");
    res.render("auth/profil", {
      pageTitle: "Profilul Meu",
      path: "/profil",
      user: userCurent,
      eAdmin: req.user.eAdmin,
      succesModificare: true,
      errorMessage: "",
      validationErrors: [],
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

};

exports.getResetarePW = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/resetarePW", {
    path: "/resetarePW",
    pageTitle: "Resetare Parola",
    eAdmin: req.user.eAdmin,
    errorMessage: message,
  });
};

exports.postResetarePW = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/resetarePW");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "Nu exista user cu acest email.");
          return res.redirect("/resetarePW");
        }
        user.resetToken = token;
        user.resetTokenExpirare = Date.now() + 3600000; //milisecunde
        return user.save();
      })
      .then((result) => {
        const mail = {
          to: req.body.email,
          from: "alexiaivanof@gmail.com",
          subject: "Schimbare parola",
          text: "Schimbare parola",
          html: `
              <p> Ati cerut schimbarea parolei </p>
              <p> Click aici <a href="http://localhost:4000/resetarePW/${token}">link</a> pentru a schimba parola.</p>
            `
        };
        res.redirect("/login");
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
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getParolaNoua = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpirare: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/parola-noua", {
        path: "/parola-noua",
        pageTitle: "Parola Noua",
        errorMessage: message,
        eAdmin: user.eAdmin,
        userId: user._id.toString(),
        parolaToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postParolaNoua = (req, res, next) => {
  const parolaNoua = req.body.password;
  const userId = req.body.userId;
  const parolaToken = req.body.parolaToken;
  let resetareUser;

  User.findOne({
    resetToken: parolaToken,
    resetTokenExpirare: { $gt: Date.now() },
    _id: userId
  })
    .then((user) => {
      resetareUser = user;
      return bcrypt.hash(parolaNoua, 12);
    })
    .then((hashParola) => {
      resetareUser.password = hashParola;
      resetareUser.resetToken = undefined;
      resetareUser.resetTokenExpirare = undefined;
      return resetareUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
