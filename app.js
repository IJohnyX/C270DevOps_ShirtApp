const express = require('express'); // Import the Express framework
const mysql = require('mysql2'); // Import the MySQL database driver
const multer = require('multer'); // Import Multer, a middleware for handling file uploads
const session = require('express-session'); // Import session management middleware
const bodyParser = require('body-parser'); // Import body-parser to parse incoming request bodies
const { body, validationResult } = require('express-validator'); // Import express-validator for validating request data
const flash = require('connect-flash');
const app = express(); // Create an instance of an Express application

module.exports = app;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(bodyParser.json()); // Parse JSON bodies
app.use(flash());
app.use(express.static('public')); // Serve static files from the "public" directory
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

app.use(session({
  secret: 'secret', // Secret key for signing the session ID cookie
  resave: false, // Don't save session if unmodified
  saveUninitialized: true, // Save uninitialized sessions
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // Use secure cookies if using HTTPS
}));



app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session.user; // Make the user session data available to templates
  next(); // Continue to the next middleware or route handler
});

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original file name
  }
});

const upload = multer({ storage: storage }); // Configure Multer with the defined storage settings

const connection = mysql.createConnection({
  connectionLimit: 10, // Maximum number of concurrent connections
  host: 'sql12.freesqldatabase.com', // Database host
  user: 'sql12758935', // Database user
  password: 'gMrYKnfR9k', // Database password
  database: 'sql12758935' // Database name
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err); // Log connection error
    return;
  }
  console.log('Connected to MySQL database'); // Log successful connection
});

app.set("view engine", "ejs"); // Set EJS as the templating engine

app.get('/', (req, res) => {
  res.render('index'); // Render the "index" template for the root route
});

app.get('/about', (req, res) => {
  res.render('about'); // Render the "about" template for the root route
});

app.get('/product', (req, res) => {
  const sql = 'SELECT * FROM product'; // SQL query to select all products
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); // Log query error
      return res.status(500).send('Error retrieving products'); // Send error response
    }
    res.render('product', { products: results }); // Render the "product" template with the retrieved products
  });
});

// Route to get the cart items
app.get('/cart', (req, res) => {
  const session_id = req.sessionID; // Get the current session ID
  const sql = `
    SELECT p.product_id, p.product_name, p.price, p.image, c.quantity, (p.price * c.quantity) AS total_price
    FROM cart c
    JOIN product p ON c.product_id = p.product_id
    WHERE c.session_id = ?
  `; // SQL query to select cart items for the current session
  connection.query(sql, [session_id], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); // Log query error
      return res.status(500).send('Error retrieving cart'); // Send error response
    }
    const cart = results; // Get the cart items
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0); // Calculate the subtotal
    const tax = subtotal * 0.09; // Calculate the tax (9%)
    const total = subtotal + tax; // Calculate the total
    res.render('cart', { cart: results, subtotal, tax, total }); // Render the "cart" template with cart details
  });
});

// Route to add items to the cart
app.post('/cart', (req, res) => {
  const { product_id, quantity } = req.body; // Extract product ID and quantity from the request body
  const session_id = req.sessionID; // Get the current session ID
  const sql = `
    INSERT INTO cart (session_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
  `; // SQL query to insert or update cart item
  connection.query(sql, [session_id, product_id, quantity], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); // Log query error
      return res.status(500).send('Error adding to cart'); // Send error response
    }
    res.redirect('/cart'); // Redirect to the cart page
  });
});

// Route to update the quantity of items in the cart
app.post('/cart/update', (req, res) => {
  const { product_id, quantity } = req.body; // Extract product ID and quantity from the request body
  const session_id = req.sessionID; // Get the current session ID
  const sql = 'UPDATE cart SET quantity = ? WHERE session_id = ? AND product_id = ?'; // SQL query to update cart item quantity
  connection.query(sql, [quantity, session_id, product_id], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); // Log query error
      return res.status(500).send('Error updating cart'); // Send error response
    }
    res.redirect('/cart'); // Redirect to the cart page
  });
});

// Route to delete items from the cart
app.post('/cart/delete', (req, res) => {
  const { product_id } = req.body; // Extract product ID from the request body
  const session_id = req.sessionID; // Get the current session ID
  const sql = 'DELETE FROM cart WHERE session_id = ? AND product_id = ?'; // SQL query to delete cart item
  connection.query(sql, [session_id, product_id], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); // Log query error
      return res.status(500).send('Error deleting from cart'); // Send error response
    }
    res.redirect('/cart'); // Redirect to the cart page
  });
});

app.get('/contact', (req, res) => {
  res.render('contact'); // Render the "contact" template
});

// Set up the contact route
app.post('/contact', (req, res) => {
  console.log(req.body); // Log the received form data
  const { first_name, last_name, email, hp_number, message } = req.body; // Extract form data from the request body
  
  if (!first_name || !last_name || !email || !hp_number || !message) {
    return res.status(400).send('All fields are required'); // Send error response if any field is missing
  }

  const sql = 'INSERT INTO contact (first_name, last_name, email, hp_number, message) VALUES (?, ?, ?, ?, ?)'; // SQL query to insert contact form data
  connection.query(sql, [first_name, last_name, email, hp_number, message], (error, results) => {
    if (error) {
      console.error('Error inserting data:', error); // Log query error
      return res.status(500).send({ error: 'Database insertion failed' }); // Send error response
    } 
    console.log('New record created successfully'); // Log success message
    res.status(200).send('New record created successfully'); // Send success response
    
    
  });
});

// Middleware function to validate registration
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('All fields are required.');
  }

  if (password.length < 6) {
    req.flash('error', 'Password should be at least 6 or more characters long');
    req.flash('formData', req.body);
    return res.redirect('/register');
  }

  next(); // Proceed to the next middleware or route handler
};

// Route for rendering the register page
app.get('/register', (req, res) => {
  res.render('register'); // Render the "register" template
});

// Updated POST route for registration
app.post('/register', [
  validateRegistration,
  body('username').notEmpty().withMessage('Username is required'), // Validate username
  body('email').isEmail().withMessage('Email is required and must be valid'), // Validate email
  body('password').notEmpty().withMessage('Password is required') // Validate password
], (req, res) => {
  const errors = validationResult(req); // Get validation errors
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Send error response if validation fails
  }

  const { username, email, password } = req.body; // Extract form data from the request body
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, SHA1(?))'; // SQL query to insert user data
  connection.query(query, [username, email, password], (err, result) => {
    if (err) {
      throw err
    }; // Throw error if query fails
    console.log(result);
    req.flash('success', 'Registration successful! Please Login.')
    res.redirect('/login'); // Redirect to the login page
  });
});


app.get('/login', (req, res) => {
  res.render('login', {
    messages: req.flash('success'), // Retrieve success messages from the session
    errors: req.flash('error') // Retrieve error messages from the session
  }); // Render the "login" template
});

app.post('/login', (req, res) => {
  const { email, password } = req.body; // Extract form data from the request body

  // Validate email and password fields
  if (!email || !password) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/login'); // Redirect back to login page
  }

  const query = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)'; // SQL query to check credentials
  connection.query(query, [email, password], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const user = results[0]; // Get the user data
      req.session.user = user; // Store user in session
      req.flash('success', 'Login successful');

      // Redirect based on user role
      if (email === 'admin@gmail.com') {
        res.redirect('/admin'); // Redirect to admin page
      } else{
         res.redirect('/'); // Redirect to home page
      }
    } else {
      req.flash('error', 'Invalid email or password.'); // Flash error message
      res.redirect('/login'); // Redirect back to login page
    }
  });
});


app.get('/', (req, res) => {
  res.render('index', {
    user: req.session.user, // Pass user data from session
    messages: req.flash('success') // Pass success messages to the view
  });
});


app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/'); // Redirect to home page if error occurs
    }
    
    res.redirect('/'); // Redirect to home page
  });
});

app.get('/admin', (req, res) => {
  connection.query('SELECT * FROM product', (error, results) => {
    if (error) throw error; // Throw error if query fails
    res.render('admin', { products: results }); // Render the "admin" template with products
  });
});

app.post('/admin/add', upload.single('image'), (req, res) => {
  const { product_id, product_name, price, quantity } = req.body; // Extract form data from the request body
  let image;
  if (req.file) {
    image = req.file.filename; // Save the uploaded file name
  } else {
    image = 'null'; // Default image if no file is uploaded
  }
  const sql = 'INSERT INTO product (product_id, product_name, price, image, quantity) VALUES (?, ?, ?, ?, ?)'; // SQL query to insert product data
  connection.query(sql, [product_id, product_name, price, image, quantity], (error, results) => {
    if (error) {
      console.error('Error adding product id:', error); // Log query error
      res.status(500).send('Error adding product id'); // Send error response
    } else {
      res.redirect('/admin'); // Redirect to admin page
    }
  });
});

app.post('/admin/delete/:id', (req, res) => {
  const { id } = req.params; // Extract product ID from the request parameters

  // First, delete all entries in the cart that reference this product
  const deleteCartSql = 'DELETE FROM cart WHERE product_id = ?'; // SQL query to delete cart items by product ID
  connection.query(deleteCartSql, [id], (cartError, cartResults) => {
    if (cartError) {
      console.error('Error deleting from cart:', cartError); // Log query error
      return res.status(500).send('Error deleting from cart'); // Send error response
    }

    // Then, delete the product from the product table
    const deleteProductSql = 'DELETE FROM product WHERE product_id = ?'; // SQL query to delete product by ID
    connection.query(deleteProductSql, [id], (productError, productResults) => {
      if (productError) {
        console.error('Error deleting product:', productError); // Log query error
        return res.status(500).send('Error deleting product'); // Send error response
      }
      res.redirect('/admin'); // Redirect to admin page
    });
  });
});

app.get('/updateProduct/:id', (req, res) => {
  const productId = req.params.id; // Extract product ID from the request parameters
  const sql = 'SELECT * FROM product WHERE product_id = ?'; // SQL query to select product by ID
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); // Log query error
      return res.status(500).send('Error retrieving product'); // Send error response
    }
    if (results.length > 0) {
      res.render('updateProduct', { product: results[0] }); // Render the "updateProduct" template with product data
    } else {
      res.status(404).send('Product not found'); // Send error response if product not found
    }
  });
});

app.post('/updateProduct/:id', upload.single('image'), (req, res) => {
  const productId = req.params.id; // Extract product ID from the request parameters
  const { product_name, price, quantity } = req.body; // Extract form data from the request body
  let image = req.body.currentImage; // Retrieve current image filename
  if (req.file) {
    image = req.file.filename; // Set image to be the new image filename
  }
  const sql = 'UPDATE product SET product_name = ?, price = ?, image = ?, quantity = ? WHERE product_id = ?'; // SQL query to update product data
  connection.query(sql, [product_name, price, image, quantity, productId], (error, results) => {
    if (error) {
      console.error('Error updating product:', error.message); // Log query error
      res.status(500).send('Error updating product'); // Send error response
    } else {
      res.redirect('/admin'); // Redirect to admin page
    }
  });
});

app.get('/search', (req, res) => {
  const { query } = req.query;

  if (!query) {
      return res.status(400).send('Query parameter is required.');
  }

  const sql = `SELECT product_id, product_name, price, image, quantity
               FROM product 
               WHERE product_name LIKE ?`;
  connection.query(sql, [`%${query}%`], (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).send('An error occurred while searching.');
      }

      if (results.length === 0) {
          return res.status(404).send('No products found matching your query.');
      }

      res.json(results);
  });
});

app.get('/product/:id', (req, res) => { // 👈 Use path parameter :id
  const productId = req.params.id; // 👈 Access via req.params

  const sql = `
    SELECT product_id, product_name, price, image, quantity 
    FROM product 
    WHERE product_id = ?
  `;

  connection.query(sql, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.render('productDetails', { product: results[0] }); // Render EJS template
  });
});





app.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack trace
  res.status(500).send('Something broke!'); // Send error response
});

const PORT = process.env.PORT || 3001; // Set the port number from environment variable or default to 3001
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`); // Log the server start message
});

module.exports = app;
