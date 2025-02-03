const app = require( '../app.js')

const PORT = process.env.PORT || 3000; // Set the port number from environment variable or default to 3001
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`); // Log the server start message
});