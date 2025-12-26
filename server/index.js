require("dotenv").config()

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;

// when using default config (no args), it allows requests from ANY origin
// app.use(cors());
const clientUrlEnv = process.env.CLIENT_URL;
const allowedOrigins =
  clientUrlEnv && clientUrlEnv !== "*"
    ? clientUrlEnv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!clientUrlEnv || clientUrlEnv === "*") return callback(null, true);
      if (allowedOrigins?.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);

app.get('/api/home', (req, res) => {
    res.json({ 
        message: "Hello World!",
        people: ["Harry", "Jack", "Mary"]
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
