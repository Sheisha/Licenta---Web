const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const webdriver = require('selenium-webdriver');



const errorController = require("./controllers/eroare");

const User = require("./models/user");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.j4yjtgd.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

// const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require('./routes/admin');
const magazinRoutes = require("./routes/magazin");
const authRoutes = require('./routes/auth');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); // pentru CSS
app.use('/imagini', express.static(path.join(__dirname, 'imagini'))); // pentru imagini


app.use(
  session({
      secret: 'my secret', 
      resave: false, 
      saveUninitialized: false,
      store: store
  })
);

// app.use(csrfProtection);
app.use(flash());




app.use((req,res,next) => {
  if(!req.session.user){
      return next();
  }
  User.findById(req.session.user._id)
  .then(user => {
      // throw new Error('Dummy');
      if(!user){
          return next();
      }
      req.user = user;
      next();
  })
  .catch(err => {
      next(new Error(err));
  });
});

app.use((req,res,next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

// app.use((req,res,next) => {
//   res.locals.isAdmin = req.session.user.eAdmin;
//   next();
// });

app.use('/admin',adminRoutes);
app.use(magazinRoutes);
app.use(authRoutes);


app.get("/500", errorController.get500);
app.get("/deja-in-cos",errorController.getDejaInCos);
app.get("/alt-tip-vehicul",errorController.getAltTipVehiculAles);
app.get("/neautorizat", errorController.getNeautorizat);
app.use(errorController.get404);


// app.use((error, req, res, next) => {
//   console.log(error);
//   res.status(500).render("500", {
//     pageTitle: "Error",
//     path: "/500",
//     isAuthenticated: req.session.isLoggedIn
//   });
// });

// app.use((error, req, res, next) => {
//   console.log(error);
//   res.render("deja-in-cos", {
//     pageTitle: "Eroare",
//     path: "/deja-in-cos",
//     isAuthenticated: req.session.isLoggedIn
//   });
// });

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(process.env.PORT || 4000);
  })
  .catch((err) => {
    console.log(err);
  });
