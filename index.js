import express from 'express';
import User from './models/user.js';
import RefreshToken from './models/refreshtoken.js';
import { sequelize } from './config/db.js';
import authRoutes from './routes/routes.js';
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRoutes);

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