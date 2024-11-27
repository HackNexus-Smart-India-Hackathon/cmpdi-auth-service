import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: [
          "id",
          "username",
          "employee_id",
          "email",
          "role",
          "phone_number",
        ],
      });

      next();
    } catch (error) {
      console.error("Error during token verification or user fetching:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
