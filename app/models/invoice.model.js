module.exports = (sequelize, Sequelize) => {
  const Invoice = sequelize.define("invoice", {
    invoiceId: {
      type: Sequelize.STRING
    },
    supplierParty: {
      type: Sequelize.STRING
    },
    recipients: {
      type: Sequelize.STRING
      // this will be either emails or phone numbers
    },
    sent: {
      type: Sequelize.BOOLEAN
    }
  }, {
    createdAt: 'dateTime'
  });
  return Invoice;
};