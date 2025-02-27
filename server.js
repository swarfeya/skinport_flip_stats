const express = require('express');
const path = require('path');

// Example output: Authorization: Basic <Base64_Encoded_String>

const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors())
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/transactions', async (req, res) => {
    if (req.query.secret == undefined) {
        res.status(400);
        res.send("no secret param found")
        return;
    }
    if (req.query.clientId == undefined) {
        res.status(400);
        res.send("no clientId param found")
        return;
    }
    if (req.query.page == undefined) {
        res.status(400);
        res.send("no page param found")
        return;
    }
    if (req.query.limit == undefined) {
        res.status(400);
        res.send("no limit param found")
        return;
    }
    const clientId = req.query.clientId;
    const clientSecret = req.query.secret;

    // Combine Client ID and Client Secret with a colon
    const encodedData = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Generate the Authorization header
    const authorizationHeaderString = `Basic ${encodedData}`;

    const params = new URLSearchParams({
        page: req.query.page,
        limit: req.query.limit,
        order: 'desc'
    });
    const response = await fetch(`https://api.skinport.com/v1/account/transactions?${params}`, {
        method: 'GET',
        headers: {
            'Authorization': authorizationHeaderString,
            'Accept-Encoding': 'br'
        }
    });
    console.log(req.query.api_key, req.query.page)
    const data = await response.json();
    // return data;
    res.status(response.status);
    res.send(data);


});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});