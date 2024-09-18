//initialize dotenv
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON data in the request body
app.use(express.json());

// Define the /webhook POST endpoint
app.post('/webhook', (req, res) => {
    // Print the request body to the console
    console.log('Received webhook data:', req.body);
    
    // Send a response back to the client
    res.status(200).send('Webhook received!');
});

// Define the / GET endpoint
app.get('/', (req, res) => {
    // Print a simple message to notify the API is working
    console.log('API is working');
    
    // Send a response back to the client
    res.status(200).send('okay api is working');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
