const express = require("express");
const { body } = require("express-validator/check");

const magazinController = require("../controllers/magazin");
const eAuth = require("../middleware/e-auth");


const router = express.Router();

router.get("/", magazinController.getIndex);

router.get('/detalii_servicii', magazinController.getDetaliiServicii);

router.get("/rezervare", eAuth, magazinController.getRezervare);

router.post('/rezervare', eAuth, magazinController.postRezervareAlegeTipVehicul);

router.get('/rezervare_alegeOra', eAuth, magazinController.getAlegeOra);

router.get("/cos", eAuth, magazinController.getCos);

router.post("/cos",eAuth, magazinController.postCos);

router.post('/cos-sterge-serviciu',eAuth, magazinController.postCosStergeServiciu);

router.get('/checkout',eAuth, magazinController.getCheckout);
router.post('/checkout',eAuth, magazinController.postCheckout);

router.post('/checkoutCash',eAuth, magazinController.postCheckoutCash);

router.get('/checkout/success/:ora', eAuth, magazinController.getCheckoutSuccess);

router.get('/checkout/cancel', magazinController.getCheckout);

router.get('/rezervari', eAuth, magazinController.getRezervari);

router.get('/rezervari/:rezervareId',eAuth, magazinController.getFactura);


module.exports = router;
