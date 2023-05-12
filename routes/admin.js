const express = require("express");
const { body } = require("express-validator/check");

const adminController = require("../controllers/admin");
const eAuth = require("../middleware/e-auth");
const eAdmin = require("../middleware/e-admin");

const router = express.Router();

router.get(
  "/adauga-serviciu",
  eAuth,
  eAdmin,
  adminController.getAdaugaServiciu
);

router.get("/servicii", eAuth, eAdmin, adminController.getServicii);

router.post(
  "/adauga-serviciu",
  [
    body("tipVehicul").isString().trim(),
    body("tipServiciu").isString().trim(),
    body("pret").isFloat(),
  ],
  eAuth,
  eAdmin,
  adminController.postAdaugaServiciu
);

router.get(
  "/editeaza-serviciu/:serviciuId",
  eAuth,
  eAdmin,
  adminController.getEditeazaServiciu
);

router.post(
  "/editeaza-serviciu",
  [
    body("tipServiciu").isString().isLength({ min: 3 }).trim(),
    body("tipVehicul").isLength({ min: 3 }).trim(),
    body("pret").isFloat(),
  ],
  eAuth,
  eAdmin,
  adminController.postEditeazaServiciu
);

router.get('/sterge-serviciu/:serviciuId',eAuth, eAdmin, adminController.getstergeServiciu);

router.get("/tabelRezervari", eAuth, eAdmin, adminController.getTabelRezervari);

router.get(
  "/rezervare/:rezervareId",
  eAuth,
  eAdmin,
  adminController.getRezervareUser
);

router.post(
  "/rezervare/:rezervareId",
  eAuth,
  eAdmin,
  adminController.postRezervareUser
);

router.post(
  "/rezervareNeplatita/:rezervareId",
  eAuth,
  eAdmin,
  adminController.postRezervareNeplatitaUser
);

module.exports = router;
