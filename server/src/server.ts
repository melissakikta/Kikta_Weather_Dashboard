import dotenv from 'dotenv';
import express from 'express';
dotenv.config();

// Import the routes
import routes from './routes/index.js';

const app = express();

const PORT = process.env.PORT || 3001;

// Done: Serve static files of entire client dist folder
app.use(express.static('..client/dist'));


// DONE: Middleware for parsing JSON and urlencoded form data 
app.use(express.json()); //for JSON
app.use(express.urlencoded({extended: true})); //for URL-encoded

// Done: Implement middleware to connect the routes
app.use(routes);

// Start the server on the port
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));