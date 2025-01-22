const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const full = require("./models/adminUser");
const routes = require("./routes/routes");
const readonly = require("./models/readOnlyUsers");
const { isAuthenticated } = require("./middlewares/authentication");
require("dotenv").config();

const app = express();

// MongoDB Atlas connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Add this to parse URL-encoded form data
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: "your_secret_key", // Change this secret to something secure
    resave: false,
    saveUninitialized: true,
  })
);

// Serve the login page
app.get("/", (req, res) => {
  // If the user is already logged in, redirect them to the index page
  if (req.session.user) {
    return res.redirect("/index");
  }
  res.sendFile(path.join(__dirname, "public", "html", "login.html"));
});

// User login route (no bcrypt hashing)
app.post("/login", async (req, res) => {
  const { username, password } = req.body; // Correct way to extract form data

  // Find user by username
  let user = await full.findOne({ username });
  if (!user) {
    // If no full access user, check for read-only users
    user = await readonly.findOne({ username });
    if (!user) {
      return res.status(401).send("Invalid credentials");
    }
  }
  // Check if the password matches (direct comparison with plain text password)
  if (password !== user.password) {
    return res.status(401).send("Invalid credentials");
  }

  // Store user info in session
  if (user.constructor.modelName === "AdminUser") {
    req.session.user = { username: user.username, role: "readWrite" };
  } else {
    req.session.user = { username: user.username, role: "read" };
  }

  res.redirect("/index"); // Redirect to the protected page after successful login
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to log out");
    }
    res.redirect("/"); // Redirect to the login page after logging out
  });
});

app.use("/api", isAuthenticated, routes);

// Serve the protected pages
app.get("/index", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

app.get("/patient", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "patient.html"));
});

app.get("/billing", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "billing.html"));
});

const port = process.env.PORT || 3000;
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
