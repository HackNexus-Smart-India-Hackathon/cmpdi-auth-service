import express from 'express';
import User from './models/user.js';
import RefreshToken from './models/refreshtoken.js';
import cookieParser from 'cookie-parser';
import { sequelize } from './config/db.js';
import authRoutes from './routes/routes.js';
import dotenv from "dotenv";
import cors from "cors";
import chatRoutes from './routes/chatRoutes.js'
dotenv.config();
const app = express();
const corsOptions = {
  origin: ["http://localhost:3000", "http://example.com"], // Replace with your frontend URLs
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRoutes);
app.use('/chat' ,chatRoutes)
sequelize
  .sync()
  .then(() => {
    console.log("Database & tables created!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error creating database & tables: ", error);
  });