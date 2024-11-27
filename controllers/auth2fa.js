import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.js";

export const generateSecret = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ length: 20 });
    const { id } = req.params;
    const [updated] = await User.update(
      { two_factor_secret: secret.base32 },
      {
        where: { id: id },
      }
    );
    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error generating QR code" });
      }
      res.json({
        message: "QR code generated",
        data_url,
        secret: secret.base32,
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verify2FA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;
    const secret = await User.findByPk(id, {
      attributes: ["two_factor_secret"],
    });
    const scr = secret.two_factor_secret;
    
    const verified = speakeasy.totp.verify({
      secret: scr,
      encoding: "base32",
      token,
    });
    if (verified) {
      res.json({ message: "2FA verification successful" });
    } else {
      res.status(401).json({ message: "Invalid 2FA token" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
