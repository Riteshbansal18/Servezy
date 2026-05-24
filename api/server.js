require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const port = process.env.PORT || 3001;
const MongoConnection = require("./config/database");
const userRoutes = require("./routes/UserRoutes");
const freelancerRoutes = require("./routes/FreelancerRoutes");
const clientRoutes = require("./routes/ClientRoutes");
const chatRoutes = require("./routes/ChatRoutes");

// Security headers — allow cross-origin images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ["http://localhost:3000"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// NoSQL injection sanitization
app.use(mongoSanitize());

// Rate limiting — auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { msg: "Too many requests, please try again later.", status: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/user/login", authLimiter);
app.use("/user/register", authLimiter);
app.use("/user/forgot-password", authLimiter);

MongoConnection();

app.use("/user", userRoutes);
app.use("/freelancer", freelancerRoutes);
app.use("/client", clientRoutes);
app.use("/chat", chatRoutes);

app.use("/ProfilePic", express.static(__dirname + "/uploads/Users_imgs"));
app.use("/ServicePic", express.static(__dirname + "/uploads/UsersServices"));

app.listen(port, (err) => {
  if (err) console.log("Server Error :" + err.message);
  else console.log("Server Running on Port: " + port);
});
