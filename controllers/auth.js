import User from "../models/user.js";
import RefreshToken from "../models/refreshtoken.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

async function encryptPassword(password) {
  try {
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    return hashedPassword;
  } catch (err) {
    console.error("Error hashing password:", err);
    throw err;
  }
}

async function verifyPassword(password, hashedPassword) {
  if (!password || !hashedPassword) {
    console.error("Password or hashed password is missing");
    return false;
  }
  try {
    return await argon2.verify(hashedPassword, password);
  } catch (err) {
    console.error("Error verifying password:", err);
    return false;
  }
}

export const register = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const password_hash = await encryptPassword(password);
    // console.log(hashedPassword);
    const user = await User.create({
      ...userData,
      password_hash,
    });
    delete user.dataValues.password_hash;
    delete user.dataValues.password_reset_token;
    delete user.dataValues.password_reset_expires;
    delete user.dataValues.two_factor_secret;
    delete user.dataValues.two_factor_enabled;

    const temp = { phone: user.phone_number, id: user.id };
    const accessToken = jwt.sign(temp, process.env.ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(temp, process.env.REFRESH_SECRET);

    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const token = accessToken;
    res.status(201).json({user, token});
  } catch (error) {
    res.status(500).json({
      error:
        error.message == "Validation error"
          ? "User already exists"
          : error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    delete user.dataValues.password_hash;
    delete user.dataValues.password_reset_token;
    delete user.dataValues.password_reset_expires;
    delete user.dataValues.two_factor_secret;
    delete user.dataValues.two_factor_enabled;

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const temp = { phone: user.phone_number, id: user.id };
    const accessToken = jwt.sign(temp, process.env.ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(temp, process.env.REFRESH_SECRET);

    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const token = accessToken;
    res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  const tokenExists = await RefreshToken.findOne({
    where: { token: refreshToken },
  });
  if (!tokenExists) {
    return res.status(403).json({ error: "Invalid refresh token" });
  }
  try {
    jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const { phone, id } = jwt.decode(refreshToken);
    console.log(phone, id);

    const accessToken = jwt.sign({ phone, id }, process.env.ACCESS_SECRET, {
      expiresIn: "15m",
    });
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role", "phone_number"],
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.findAll({
      where: { role },
      attributes: ["id", "username", "email", "role", "phone_number"],
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ["id", "username", "email", "role", "phone_number"],
    });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await User.update(req.body, {
      where: { id: id },
    });
    if (updated) {
      const updatedUser = await User.findByPk(id, {
        attributes: ["id", "username", "email", "role", "phone_number"],
      });
      res.status(200).json({ user: updatedUser });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await RefreshToken.destroy({
      where: { user_id: id },
    });
    const deleted = await User.destroy({
      where: { id: id },
    });
    if (deleted) {
      res.status(204).send("User deleted");
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
