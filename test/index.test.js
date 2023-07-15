const request = require('supertest');
const app = require('../server');

describe('GET /nonexistent', () => {

    let server;

    beforeAll(async () => {
      return new Promise((resolve) => {
        server = app.listen(3000, () => {
          console.log('Server is running on port 3000.');
          resolve();
        });
      });
    });

    afterAll(async () => {
        await server.close(); 
    });


    it('should return 404 Not Found', async () => {
      const response = await request(app).get('/nonexistent');
      expect(response.status).toBe(404);
    });
  });

/* 
describe('GET /', () => {
    it('should load home page', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
    });
});

describe('POST /send-xml', () => {

    let server;

    beforeAll(async () => {
        server = app.listen(3001); 
    });

    afterAll(async () => {
        server.close(); 
    });

    it('should reject email address without @ symbol', async () => {
      const data = {
        email: 'invalid_email',
        xml: '<Invoice><cbc:ID>123</cbc:ID></Invoice>',
        format: 'json'
      };
  
      const res = await request(app)
        .post('/send-xml')
        .send(data);
  
      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('Invalid email address');
    }, 10000);
  });
  

describe('POST /send-xml', () => {

    beforeAll(async () => {
        await app.listen(3001); 
        });

    afterAll(async () => {
    await server.close(); 
    });

    it('should send an email with an attachment and return a communication report in JSON format', async () => {
        const res = await request(app)
        .post('/send-xml')
        .send({
            email: ['sengapplepie@gmail.com'],
            xml: '<Invoice><cbc:ID>EBWASP1002</cbc:ID></Invoice>',
            format: 'json',
        });

        expect(res.status).toBe(200);
        expect(res.body.invoiceId).toBe('EBWASP1002');
        expect(res.body.recipients).toEqual(['sengapplepie@gmail.com']);
        expect(res.body.status).toBe('Sent');
        expect(res.body.dateTime).toBeTruthy();
    });
});
 */