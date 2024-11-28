import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.js";

export const generateSecret = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await User.findByPk(id, {
      attributes: ["two_factor_enabled", "two_factor_secret", "username"],
    });

    let secret;
    if (check.two_factor_secret) {
      secret = { base32: check.two_factor_secret };
    } else {
      secret = speakeasy.generateSecret({ length: 20 });
      await User.update(
        { two_factor_secret: secret.base32, two_factor_enabled: true },
        { where: { id: id } }
      );
    }
console.log(secret.base32);

    const otpauthUrl = speakeasy.otpauthURL({
      encoding: "base32",
      type: "totp",
      secret: secret.base32,
      label: encodeURIComponent(`C.M.P.D.I:${check.username}`), // Ensure special characters are encoded
      issuer: "C.M.P.D.I",
    });

    QRCode.toDataURL(otpauthUrl, (err, data_url) => {
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
      console.log(scr,token,verified);
      
      res.status(401).json({ message: "Invalid 2FA token" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
