const db = require("../models");
const Invoice = db.invoices;
const Op = db.Sequelize.Op;
const sid = "SID";
const auth_token = "AUTHTOKEN";
const twilio = require("twilio")(sid, auth_token);

var path = require("path");

// Create Nodemailer transporter
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'USERMAIL',
    pass: 'MAILPASS',
  },
});

// XML parser
const xml2js = require('xml2js');
const bodyParser = require('body-parser');
const parser = new xml2js.Parser({ explicitArray: false });

// Helper functions
const { generateReport, sendReportResponse} = require('./helper.js');

// ------------------------------------ Home page ------------------------------------
exports.homePage = (req, res) => {
  res.sendFile(path.join(__dirname,"../../static/home.page.html"));
}

// ------------------------------------ Send Email Page ------------------------------------
exports.emailPage = (req, res) => {
  res.sendFile(path.join(__dirname,"../../static/email.page.html"));
}

exports.emailSend = async (req, res) => {
  // Validate - do error checking for each parameter
  if (!req.body.xmlString) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Declare user inputs --> error checking
  const xmlString = req.body.xmlString // try to change to attatchement to attatch xml file later
  const recipients = Array.isArray(req.body.recipients) ? req.body.recipients.join(', ') : req.body.recipients
  const subject = req.body.subject
  const message = req.body.message
  const format = req.body.format

  // Parse XML input (currently a string)
  const result = await parser.parseStringPromise(xmlString);
  // Extract details from XML
  const invoiceId = result['Invoice']['cbc:ID'];
  const supplierParty = result['Invoice']['cac:AccountingSupplierParty']['cac:Party']['cac:PartyName']['cbc:Name'];

  // Generate an email
  const mailOptions = {
    from: 'sengapplepie@gmail.com',
    to: recipients,
    subject: subject,
    attachments: [
      {
        filename: `${invoiceId}.xml`,
        content: Buffer.from(xmlString),
      },
    ],
    text: message,
  };

  // send email if there is no error generated, use async await to make it asynchronous 
  transporter.sendMail(mailOptions, async (err, info) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error sending email');
    } 
    else {
      console.log('Email sent: ' + info.res);
    }
  });

  // FIX hardcoded rn - check whether sent or not
  const sent = req.body.sent ? req.body.sent : true

  // Create an invoice send request to be stored into database
  const invoice = {
    invoiceId,
    supplierParty,
    recipients,
    sent
  };

  // Save invoice in the database
  Invoice.create(invoice)
    .then(data => {
      // once email is sent and saved to db, redirect the user to the confirmation report
      res.redirect(`/sent/${data.id}/${format}`);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while saving the invoice to the database."
      });
    });
};

// ------------------------------------ Send SMS Page ------------------------------------
exports.smsPage = (req, res) => {
  res.sendFile(path.join(__dirname,"../../static/sms.page.html"));
}

exports.smsSend = async (req, res) => {
  // ****** user inputs
  const xmlString = req.body.xmlString 
  const recipients = req.body.recipients 
  const subject = req.body.subject
  const message = req.body.message
  const format = req.body.format

  // Parse XML input (currently a string)
  const result = await parser.parseStringPromise(xmlString);
  // Extract details from XML --> we assume they all exist, maybe implement NULL if it doesn't exist
  const invoiceId = result['Invoice']['cbc:ID'];
  const supplierParty = result['Invoice']['cac:AccountingSupplierParty']['cac:Party']['cac:PartyName']['cbc:Name'];
  const customerParty = result['Invoice']['cac:AccountingCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name'];
  const quantity = result['Invoice']['cac:InvoiceLine'][0]['cbc:InvoicedQuantity']['_'];
  const due = result['Invoice']['cbc:DueDate'];
  const description = result['Invoice']['cac:InvoiceLine'][0]['cac:Item'] ? result['Invoice']['cac:InvoiceLine'][0]['cac:Item']['cbc:Description'] : '';
  const payAmount = result['Invoice']['cac:LegalMonetaryTotal']['cbc:PayableAmount']['_'];

  // send sms
  twilio.messages.create({
    from: "+15673612504",
    to: recipients,
    body: "Dear " + customerParty + "," + 
          "\nSubject: " + subject +
          "\nMessage: " + message +
          "\nHere are your e-invoice details." + 
          "\nInvoiceID: " + invoiceId + 
          "\nFrom (supplier): " + supplierParty + 
          "\nQuantity: " + quantity + 
          "\nDue Date: " + due + 
          "\nDescription: " + description + 
          "\nPayable Amount: $" + payAmount,
  })

  // FIX hardcoded rn - check whether sent or not
  const sent = req.body.sent ? req.body.sent : true

  // Create an invoice send request to be stored into database
  const invoice = {
    invoiceId,
    supplierParty,
    recipients,
    sent
  };

  // Save invoice in the database
  Invoice.create(invoice)
    .then(data => {
      // once sms is sent and saved to db, redirect the user to the confirmation report
      res.redirect(`/sent/${data.id}/${format}`);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while saving the invoice to the database."
      });
    });
}

// --------------------------- Generate communication report after send request ---------------------
// --------------------------------- Get report via reportId ---------------------------------------
exports.sentReport = (req, res) => {
  const id = req.params.id;
  const format = req.params.format;

  Invoice.findByPk(id)
  .then(async data => {
    if (data.length === 0) { // check if data array is empty
      res.status(404).send({
        message: `Invoice with reportId = ${id} not found.`
      });
    } else {
      const report = generateReport([data]);
      sendReportResponse(res, format, report);
    }
  })
  .catch(err => {
    res.status(500).send({
      message: "Error retrieving data for invoice(s) with reportId = " + id
    });
  });
};

// ------------------ Retrieve page - Get report via invoiceId ------------------
exports.retrieveReport = (req, res) => {
  const invoiceId = req.params.invoiceId;
  const format = req.params.format;
  Invoice.findAll({
    where: { invoiceId: invoiceId }
  })
  .then(data => {
    const report = generateReport(data);
    sendReportResponse(res, format, report);
  })
  .catch(err => {
    res.status(500).send({
      message: "Error retrieving Invoice with invoiceId=" + invoiceId
    });
  })
};

// ------------------Validation Page----------------

exports.validatePage = (req, res) => {
  res.sendFile(path.join(__dirname,"../../static/validation.html"));
}

const axios = require("axios");
const FormData = require('form-data');


exports.validateInvoice = (req, res) => {
  const formData = new FormData();
  formData.append("file", req.body.xmlString, { contentType: "application/xml" });

  //const { peppol, ubl, schema, selfBilling} = req.query;

  const peppol = req.query.peppol;
  const ubl = req.query.ubl;
  const schema = req.query.schema;
  const selfBilling = req.query.selfBilling;
 
  const config = {
    params: {
      peppol: peppol,
      ubl: ubl,
      schema: schema,
      selfBilling: selfBilling,
    },
    headers: {
      "Content-Type": "multipart/form-data",
      ...formData.getHeaders(),
    },
  };

  axios
    .post("http://validate-v1-dev2.ap-southeast-2.elasticbeanstalk.com/validate/v1", formData, config)
    .then((response) => {
      res.json({ valid: response.data.valid, errors: response.data.errors });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Validation failed" });
    });
};


// ------------------Rendering Page----------------
const fs = require('fs');


exports.renderPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../../static/render.html"));
};

// Route to get API key
exports.getAPIKey = (req, res) => {
  axios.get("https://macroservices.masterofcubesau.com/api/v3/generateKey")
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Failed to generate API key" });
    });
};

// Middleware to validate API key
exports.validateAPIKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).json({ message: "API key is required" });
  } else {
    axios.get("https://macroservices.masterofcubesau.com/api/v3/validateKey", {
      headers: { "x-api-key": apiKey }
    })
      .then(() => {
        next();
      })
      .catch((error) => {
        console.error(error);
        res.status(403).json({ message: "Invalid API key" });
      });
  }
};

// Route to render invoice into PDF
exports.renderPDF = (req, res) => {
  const formData = new FormData();
  formData.append('ubl', fs.createReadStream(req.file.path), { contentType: 'application/xml' });
  formData.append("style", 4);
  formData.append("language", "en");

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      ...formData.getHeaders(),
      "x-api-key": req.headers["x-api-key"]
    },
    responseType: "stream"
  };

  axios.post("https://macroservices.masterofcubesau.com/api/v3/invoice/render/pdf", formData, config)
    .then((response) => {
      res.set("Content-Type", "application/pdf");
      response.data.pipe(res);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Failed to render PDF" });
    });
};

// Route to render invoice into HTML
exports.renderHTML = (req, res) => {
  const formData = new FormData();
  formData.append('ubl', fs.createReadStream(req.file.path), { contentType: 'application/xml' });
  formData.append("style", 4);
  formData.append("language", "en");

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      ...formData.getHeaders(),
      "x-api-key": req.headers["x-api-key"]
    }
  };

  axios.post("https://macroservices.masterofcubesau.com/api/v3/invoice/render/html", formData, config)
    .then((response) => {
      res.set("Content-Type", "text/html");
      res.send(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Failed to render HTML" });
    });
};

// Route to render invoice into JSON
exports.renderJSON = (req, res) => {
  const formData = new FormData();
  formData.append('ubl', fs.createReadStream(req.file.path), { contentType: 'application/xml' });
  formData.append("style", 4);
  formData.append("language", "en");

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      ...formData.getHeaders(),
      "x-api-key": req.headers["x-api-key"]
    }
  };

  axios.post("https://macroservices.masterofcubesau.com/api/v3/invoice/render/json", formData, config)
    .then((response) => {
      res.set("Content-Type", "text/json");
      res.send(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Failed to render JSON" });
    });
};



// ------------------ Healthcheck----------------
exports.healthCheck = async (req, res) => {
  try {
    //await sequelize.authenticate(); // check database connection
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.status(500).json({ status: 'error' });
  }
};