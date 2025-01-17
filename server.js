const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const User = require("./models/user"); // Ensure you have a User model
const routes = require("./routes/routes"); // Import routes from /routes/routes

const app = express();

// MongoDB Atlas connection
const uri =
  "mongodb+srv://rajeshgupta01457:3tlFFJBy1uEJiT2r@cluster0.emtam.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).send("Invalid credentials");
  }

  // Check if the password matches (direct comparison with plain text password)
  if (password !== user.password) {
    return res.status(401).send("Invalid credentials");
  }

  // Store user info in session
  req.session.user = user;
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

// Protect routes to ensure only authenticated users can access them
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect("/"); // Redirect to login if user is not authenticated
}

// Include the routes from /routes/routes.js
// All routes defined in /routes/routes.js will be protected by the isAuthenticated middleware
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

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
