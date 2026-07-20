import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({
        message: "User not found or deleted",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid Token",
    });
  }
};

export default authMiddleware;