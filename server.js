const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');

const app = express();

// MongoDB atlas connection/////////////////////////////////////////////////////////////////////////////
const uri = "mongodb+srv://rajeshgupta01457:3tlFFJBy1uEJiT2r@cluster0.emtam.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri);



app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

////////////////// Setup routes////////////////////////////////////////////////////////////
app.use('/api', routes);



// Serve the index.html file///////////////////////////////////////////////
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});





// Start the server///////////////////////////////////////////////////////////////
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
