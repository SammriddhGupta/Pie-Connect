module.exports = {
  HOST: "HOST-LINK",
  USER: "DBUSER",
  PASSWORD: "DBPASS",
  DB: "invoice",
  dialect: "postgres",
  pool: {
    max: 5, 
    min: 0, 
    acquire: 30000, 
    idle: 10000
  }
};