// app.test.js
const supertest = require('supertest');
const app = require('../app');

describe('GET /', () => {
  it('should return status 200 for the home page', async () => {
    const res = await supertest(app).get('/');
    expect(res.status).toBe(200);
  });
});


describe('GET /product', () => {
  it('should return status 200 for the product page', async () => {
    const res = await supertest(app).get('/product');
    expect(res.status).toBe(200);
  });
});

describe('GET /cart', () => {
  it('should return status 200 for the cart page', async () => {
    const res = await supertest(app).get('/product');
    expect(res.status).toBe(200);
  });
});

describe('GET /about', () => {
  it('should return status 200 for the about page', async () => {
    const res = await supertest(app).get('/about');
    expect(res.status).toBe(200);
  });
});