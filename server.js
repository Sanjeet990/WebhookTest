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

//Add CORS header
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

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
        //find category
        let category = "other";

        if(req.body.subject.includes("order")) {
            category = "order";
        } else if(req.body.subject.includes("payment")) {
            category = "payment";
        } else if(req.body.subject.includes("delivery")) {
            category = "delivery";
        } else if(req.body.subject.includes("refund")) {
            category = "refund";
        } else if(req.body.subject.includes("billing")) {
            category = "billing";
        } else if(req.body.subject.includes("rfq")) {
            category = "rfq";
        } else if(req.body.subject.includes("quote")) {
            category = "quote";
        } else if(req.body.subject.includes("invoice")) {
            category = "invoice";
        } else if(req.body.subject.includes("shipment")) {
            category = "shipment";
        } else if(req.body.subject.includes("enquiry")) {
            category = "enquiry";
        } else if(req.body.subject.includes("enquiries")) {
            category = "enquiry";
        } else if(req.body.subject.includes("purchase order")) {
            category = "po";
        } else if(req.body.subject.includes("contract")) {
            category = "po";
        } else if(req.body.subject.includes("negotiation")) {
            category = "negotiation";
        }


        // Create a new webhook document
        const newWebhook = new Webhook({
            sender: req.body.sender,
            subject: req.body.subject,
            text: req.body.text,
            html: req.body.html,
            category: category,
            date: req.body.date
        });

        // Save the webhook data to MongoDB
        await newWebhook.save();

        // Log the data to the console
        //console.log('Saved webhook data:', newWebhook);

        // Send a response back to the client
        res.status(200).send('Webhook received and saved!');
    } catch (error) {
        console.error('Error saving webhook data:', error);
        res.status(500).send('Error processing webhook');
    }
});

app.get('/list', async (req, res) => {
    try {
        //Fetch list of webhooks by date descending and paging 15 records per page. Also return the total count of records, totalPages and current page in response
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const webhooks = await Webhook.find().sort({ date: -1 }).skip(skip).limit(limit);
        const totalRecords = await Webhook.countDocuments();
        const totalPages = Math.ceil(totalRecords / limit);

        res.status(200).json({
            webhooks,
            totalRecords,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching webhook data:', error);
        res.status(500).send('Error fetching webhook data');
    }
});

//add an endpoint to find the statistics starting from a specific date
app.get('/view/:id', async (req, res) => {
    try {
        const id = req.params.id
        const singleData = await Webhook.findOne({_id: id});

        res.status(200).json(singleData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

//add an endpoint to find the statistics from last visit
app.get('/stats', async (req, res) => {
    try {
        //Fetch the statistics from last visit
        const lastVisit = req.query.lastVisit;
        const stats = await Webhook.find({ date: { $gt: lastVisit } });

        res.status(200).json({
            stats
        });
    } catch (error) {
        console.error('Error fetching webhook data:', error);
        res.status(500).send('Error fetching webhook data');
    }
});

//add an endpoint to find the statistics starting from a specific date
app.get('/stats/:date', async (req, res) => {
    try {
        //Fetch the statistics from last visit
        const stats = await Webhook.find({ date: { $gt: req.params.date } });

        res.status(200).json({
            stats
        });
    } catch (error) {
        console.error('Error fetching webhook data:', error);
        res.status(500).send('Error fetching webhook data');
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
