//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// WARNING: USE DOTENV
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("home");
})

app.get("/payments/new", function(req, res) {
  res.render("amount");
})

app.get("/payments/success", function(req, res) {
  res.render("success");
})

app.get("/payments/view", async(req, res) => {
  const charges = await stripe.charges.list({
    limit: 25,
  });
  res.render("view-payments", { payments: charges });
})

app.post("/payments/new", async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.paymentAmount * 100,
    currency: "gbp",
  });
  res.render("payment", { client_secret: paymentIntent.client_secret });
})

app.post("/payments/refund", async (req, res) => {
  const refund = await stripe.refunds.create({
    charge: req.body.charge,
    reason: "requested_by_customer"
  });
  res.redirect("/payments/view");
})

app.use(function (req, res, next) {
  res.status(404).render("404")
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
