//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
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
  res.render("amount", { error: false});
})

app.get("/payments/success", function(req, res) {
  res.render("success");
})

app.get("/payments/error", function(req, res) {
  res.render("error");
})

app.get("/payments/view", async(req, res) => {
  const charges = await stripe.charges.list({
    limit: 25,
  });
  res.render("view-payments", { payments: charges });
})

app.get("/customers/new", function(req, res) {
  res.render("new-customer");
})

app.get("/customers/view", async(req, res) => {
  const customers = await stripe.customers.list({
    limit: 25,
  });
  res.render("view-customers", { customers: customers });
})

app.get("/customers/view/:customerID", async(req, res) => {
  const customer = await stripe.customers.retrieve(
    "cus_" + req.params.customerID
  );
  const paymentMethods = await stripe.paymentMethods.list({
    customer: "cus_" + req.params.customerID,
    type: 'card',
  });
  const subscriptions = await stripe.subscriptions.list({
    limit: 25,
    customer: "cus_" + req.params.customerID
  });
  res.render("customer-details", { customer: customer, paymentMethods: paymentMethods, subscriptions: subscriptions });
})

app.get("/customers/edit/:customerID/add-subscription", async(req, res) => {
  const products = await stripe.products.list({
    limit: 25
  });
  const prices = await stripe.prices.list({
    limit: 25,
  });
  res.render("customer-subscription", { products: products, prices: prices});
})

app.get("/customers/edit/:customerID/add-payment-method", async(req, res) => {
  const products = await stripe.products.list({
    limit: 25
  });
  const prices = await stripe.prices.list({
    limit: 25,
  });
  res.render("customer-payment-method", { products: products, prices: prices, customerID: req.params.customerID});
})

app.get("/customers/edit/:customerID/add-payment-method/attach/:paymentMethod", async(req, res) => {
  const paymentMethod = await stripe.paymentMethods.attach(
    req.params.paymentMethod,
    {customer: "cus_" + req.params.customerID}
  );
  if(paymentMethod){
    res.redirect("/customers/view/" + req.params.customerID);
  }
})

app.post("/customers/edit/:customerID/add-subscription", async(req, res) => {
  const subscription = await stripe.subscriptions.create({
    customer: 'cus_' + req.params.customerID,
    items: [
      {price: req.body.productSelect},
    ],
  });
  res.redirect("/customers/view/" + req.params.customerID);
})

app.get("/products/new", function(req, res) {
  res.render("new-product");
})

app.get("/products/view", async(req, res) => {
  const products = await stripe.products.list({
    limit: 25,
  });
  const prices = await stripe.prices.list({
    limit: 25,
  });
  res.render("view-products", { products: products, prices: prices });
})

app.get("/products/view/:productID", async(req, res) => {
  const product = await stripe.products.retrieve(
    "prod_" + req.params.productID
  );
  const prices = await stripe.prices.list({
    limit: 1,
    product: "prod_" + req.params.productID
  });
  res.render("product-details", { product: product, price: prices });
})

app.get("/products/view/:productID/customers", async(req, res) => {
  const product = await stripe.products.retrieve(
    "prod_" + req.params.productID
  );
  const prices = await stripe.prices.list({
    limit: 1,
    product: "prod_" + req.params.productID
  });
  const subscriptions = await stripe.subscriptions.list({
    limit: 25,
    price: prices.data[0].id
  });
  res.render("product-details-customers", { product: product, price: prices, subscriptions: subscriptions });
})

app.post("/payments/new", async (req, res) => {
  if (req.body.paymentAmount <= 0 || req.body.paymentAmount > 995000) {
    res.render("amount", { error: true});
  }
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

app.post("/customers/new", async (req, res) => {
  const customer = await stripe.customers.create({
    name: req.body.customerName,
    email: req.body.customerEmail
  });
  res.render("customer-success");
})

app.post("/customers/edit/:customerID/default-method", async (req, res) => {
  const customer = await stripe.customers.update(
    "cus_" + req.params.customerID,
    {invoice_settings: {default_payment_method: req.body.makeDefault}}
  );
  res.redirect("/customers/view/" + req.params.customerID);
})

app.post("/customers/edit/:customerID/delete-method", async (req, res) => {
  const paymentMethod = await stripe.paymentMethods.detach(
    req.body.deletePaymentMethod
  );
  res.redirect("/customers/view/" + req.params.customerID);
})

app.post("/customers/edit/:customerID/cancel-subscription", async (req, res) => {
  const deleted = await stripe.subscriptions.del(
    req.body.cancelSubscription
  );
  res.redirect("/customers/view/" + req.params.customerID);
})

app.post("/products/new", async (req, res) => {
  const product = await stripe.products.create({
    name: req.body.productName,
    description: req.body.productDescription
  });
  const price = await stripe.prices.create({
    unit_amount: Math.ceil(req.body.productPrice * 100),
    currency: 'gbp',
    recurring: {interval: 'month'},
    product: product.id
  });
  res.render("product-success");
})

app.use(function (req, res, next) {
  res.status(404).render("404")
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
