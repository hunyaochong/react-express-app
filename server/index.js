require("dotenv").config()

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;

// when using default config (no args), it allows requests from ANY origin
// app.use(cors());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000' // Only allow your client app
}));

app.get('/api/home', (req, res) => {
    res.json({ 
        message: "Hello World!",
        people: ["Harry", "Jack", "Mary"]
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
