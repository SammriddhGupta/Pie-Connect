module.exports = app => {
  const invoices = require("../controllers/invoice.controller.js");

  var router = require("express").Router();

  // **************** HOME PAGE "/"" ***********************
  // // Home page route --> is in server.js
  router.get("/", invoices.homePage)

  // **************** EMAIL PAGE "/email" ***********************
  // // Get email page
  router.get("/email", invoices.emailPage);

  // Send an e-invoice as email
  router.post("/email", invoices.emailSend);

  // // **************** SMS PAGE "/sms" ***********************
  // // Get sms page
  router.get("/sms", invoices.smsPage);

  // // Send an e-invoice as sms
  router.post("/sms", invoices.smsSend);

  // **************** COMM REPORT PAGE "/retrieve" ***********************
  // // Retrieve the details for invoice with report_id
  router.get("/sent/:id/:format", invoices.sentReport);

  // Retrieve the details for invoice with id
  router.get("/retrieve/:invoiceId/:format", invoices.retrieveReport);

  router.get("/validate", invoices.validatePage);

  // validate invoice
  router.post("/validate", invoices.validateInvoice);

  router.get("/render", invoices.renderPage);

  // Route to render invoice into PDF
  router.post("/render/pdf", invoices.validateAPIKey, invoices.renderPDF);

  // Route to render invoice into HTML
  router.post("/render/html", invoices.validateAPIKey, invoices.renderHTML);

  // Route to render invoice into JSON
  router.post("/render/json", invoices.validateAPIKey, invoices.renderJSON);

  // healthcheck 
  router.get('/healthcheck', invoices.healthCheck);

  app.use("/", router);
};