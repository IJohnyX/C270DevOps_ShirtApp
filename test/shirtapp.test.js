const request = require('supertest');
const app = require('../app');
const mysql = require('mysql2');

// Mock MySQL connection
jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
  }))
}));

// Route Testing Examples
describe('Express Routes', () => {
    test('GET / should render index page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
    });
  
    test('GET /product should fetch and render products', async () => {
      const mockProducts = [
        { product_id: 1, product_name: 'Test Shirt', price: 29.99 }
      ];
      
      mysql.createConnection().query.mockImplementation((sql, callback) => {
        callback(null, mockProducts);
      });
  
      const response = await request(app)
        .get('/product')
        .expect(200);
    });
  
    test('POST /login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
  
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(302); // Expect redirect
    });
  });

 // Testing Cart Options 
  describe('Cart Operations', () => {
    test('POST /cart should add items to cart', async () => {
      const cartItem = {
        product_id: 1,
        quantity: 2
      };
  
      const response = await request(app)
        .post('/cart')
        .send(cartItem)
        .expect(302); // Expect redirect to cart page
    });
  });

  
// Testing Admin Functions
  describe('Admin Operations', () => {
    test('POST /admin/add should create new product', async () => {
      const productData = {
        product_id: '123',
        product_name: 'New Shirt',
        price: 29.99,
        quantity: 100
      };
  
      const response = await request(app)
        .post('/admin/add')
        .field('product_id', productData.product_id)
        .field('product_name', productData.product_name)
        .field('price', productData.price)
        .field('quantity', productData.quantity)
        .attach('image', 'path/to/test/image.jpg')
        .expect(302); // Expect redirect
    });
  });
   