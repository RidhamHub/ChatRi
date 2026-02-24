import User from "../models/user.js";
import jwt from "jsonwebtoken";

// middleware to protect the routes
// Basically it check is the user is logged in or not
const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, msg: "Unauthorized: token missing" });
        }
        // console.log("TOKEN RECEIVED:", token);   // 👈 ADD


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("DECODED:", decoded);        // 👈 ADD

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ success: false, msg: "Unauthorized: invalid token payload" });
        }

        const foundUser = await User.findById(decoded.userId).select("-password");
        // console.log("USER FOUND:", foundUser?._id);   // 👈 ADD

        if (!foundUser) {
            return res.json({ success: false, msg: "User not found in database" });
        }

        req.user = foundUser;
        next();

    } catch (error) {
        // console.log("Error in protectRoute middleware:", error.message);
        // return res.json({ success: false, msg: error.message });
        console.log("FULL AUTH ERROR:");
        console.log(error);
        return res.json({ success: false, msg: error.message });
    }
}

export default protectRoute;
