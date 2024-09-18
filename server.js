// Initialize dotenv
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose'); // Import mongoose
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection URI from environment variables (Make sure you set it in your .env file)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/webhookDB';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Define a Mongoose schema and model for storing webhook data
const webhookSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    html: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Webhook = mongoose.model('Webhook', webhookSchema);

// Set up multer for parsing form-data
const upload = multer();

// Define the /webhook POST endpoint
app.post('/webhook', upload.none(), async (req, res) => {
    try {
        // Create a new webhook document
        const newWebhook = new Webhook({
            sender: req.body.sender,
            subject: req.body.subject,
            text: req.body.text,
            html: req.body.html,
            date: req.body.date
        });

        // Save the webhook data to MongoDB
        await newWebhook.save();

        // Log the data to the console
        console.log('Saved webhook data:', newWebhook);

        // Send a response back to the client
        res.status(200).send('Webhook received and saved!');
    } catch (error) {
        console.error('Error saving webhook data:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Define the / GET endpoint
app.get('/', (req, res) => {
    // Print a simple message to notify the API is working
    console.log('API is working');
    
    // Send a response back to the client
    res.status(200).send('Okay. API is working fine.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
