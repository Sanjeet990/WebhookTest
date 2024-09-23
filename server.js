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

const colors = [
    '#E38627', '#C13C37', '#6A2135', '#8E44AD', '#2980B9', '#1ABC9C', '#2ECC71', '#F39C12', '#D35400', '#E74C3C',
    '#3498DB', '#9B59B6', '#27AE60', '#F1C40F', '#E67E22', '#34495E', '#7F8C8D', '#16A085', '#BDC3C7', '#2C3E50'
];

// Define a Mongoose schema and model for storing webhook data
const webhookSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: false, default: "" },
    html: { type: String, required: false, default: "" },
    category: { type: String, required: false, default: "other" },
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
        const subject = req.body.subject.toLowerCase();

        if(subject.includes("order")) {
            category = "order";
        } else if(subject.includes("payment")) {
            category = "payment";
        } else if(subject.includes("delivery")) {
            category = "delivery";
        } else if(subject.includes("refund")) {
            category = "refund";
        } else if(subject.includes("billing")) {
            category = "billing";
        } else if(subject.includes("rfq")) {
            category = "rfq";
        } else if(subject.includes("quote")) {
            category = "quote";
        } else if(subject.includes("invoice")) {
            category = "invoice";
        } else if(subject.includes("shipment")) {
            category = "shipment";
        } else if(subject.includes("enquiry")) {
            category = "enquiry";
        } else if(subject.includes("enquiries")) {
            category = "enquiry";
        } else if(subject.includes("purchase order")) {
            category = "po";
        } else if(subject.includes("contract")) {
            category = "po";
        } else if(subject.includes("negotiation")) {
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
        // Retrieve lastVisit from the query parameter (expecting Unix epoch timestamp in seconds)
        const lastVisitParam = req.query.lastVisit;

        // Validate that lastVisit is a valid 10-digit Unix epoch timestamp (numeric)
        const lastVisitEpoch = parseInt(lastVisitParam, 10);
        if (isNaN(lastVisitEpoch) || lastVisitEpoch <= 0) {
            return res.status(400).json({ error: "Invalid or missing lastVisit parameter" });
        }

        // Convert Unix epoch timestamp (seconds) to Date object by multiplying by 1000 (milliseconds)
        const lastVisit = new Date(lastVisitEpoch * 1000);

        // Step 1: Get total count of webhooks filtered by `lastVisit`
        const totalCount = await Webhook.countDocuments({ date: { $gt: lastVisit } });

        // Step 2: Get category-wise counts
        const categoryCounts = await Webhook.aggregate([
            {
                $match: { date: { $gt: lastVisit } } // Filter by `date` greater than `lastVisit`
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Step 3: Prepare category data in the desired format
        const categoryData = categoryCounts.map((item, index) => ({
            title: item._id,
            value: item.count,
            color: colors[index % colors.length] // Dynamically assign colors from the array, loop if needed
        }));

        // Step 4: Return the result in the required format
        res.json({
            total: totalCount,
            categoryData: categoryData
        });
    } catch (error) {
        console.error("Error fetching webhook counts:", error);
        res.status(500).json({ error: "Internal server error" });
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
