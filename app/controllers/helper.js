const PDFDocument = require('pdfkit');

function generateReport(data) {
    const report = data.map(record => ({
      invoiceId: record.invoiceId,
      recipients: record.recipients,
      sent: record.sent,
      dateTime: record.dateTime,
    }));
    return report;
}

const ejs = require('ejs');
const fs = require('fs');

async function sendReportResponse(res, format, report) {
  switch (format) {
    case 'json': {
      const renderedJSON = ejs.render(fs.readFileSync('static/report.ejs', 'utf-8'), {format, report });
      res.send(renderedJSON);
      break;
    }
    case 'html': {
      report = await generateHTMLReport(report);
      const renderedHtml = ejs.render(fs.readFileSync('static/report.ejs', 'utf-8'), {format, report});
      res.setHeader('Content-Type', 'text/html');
      res.send(renderedHtml);
      break;
    }
    case 'pdf': {
      const pdfReport = await generatePDFReport(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      res.send(pdfReport);
      break;
    }
    default: {
      res.status(404).send({
        message: `Format '${format}' does not exist!`
      });
    }
  }
}

async function generateHTMLReport(report) {
  let htmlReport = `
  `;

  report.forEach((data) => {
    htmlReport += `
        <p>Invoice ID: ${data.invoiceId}</p>
        <p>Recipients: ${data.recipients}</p>
        <p>Sent: ${data.sent}</p>
        <p>Date Time: ${data.dateTime}</p>
        <br>
    `;
  });

  htmlReport += `
      </body>
    </html>
  `;
  
  return htmlReport;
}

function generatePDFReport(report) {
  return new Promise(resolve => {
    const doc = new PDFDocument({ compress: false });
    const buffers = [];

    // Write report data to the PDF document for each record in the report array
    doc.font('Helvetica-Bold').text((`Communication Report: ${report[0].invoiceId}`), { align: 'center' }).moveDown();

    for (let i = 0; i < report.length; i++) {
      doc.font('Helvetica').text(`Invoice ID: ${report[i].invoiceId}`);
      doc.text(`Recipients: ${report[i].recipients}`);
      doc.text(`Date: ${report[i].dateTime}`);
      doc.text(`Status: ${report[i].sent}`);
      doc.moveDown();
    }

    // Save the PDF document to a buffer
    doc.on('data', buffer => buffers.push(buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
}

// ------------ Helper Functions called by ivoice.controller.js ---------------------
module.exports = {
    generateReport,
    sendReportResponse
};