import { generateToken } from "../lib/utils.js"
import User from "../models/user.js"
import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js"


//signup new user
export const signup = async (req, res) => {

    const { fullName, email, password, bio = "" } = req.body;

    try {
        const missingFields = [];
        if (!fullName?.trim()) missingFields.push("fullName");
        if (!email?.trim()) missingFields.push("email");
        if (!password?.trim()) missingFields.push("password");

        if (missingFields.length) {
            return res.json({ success: false, msg: `Missing required fields: ${missingFields.join(", ")}` })
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.json({ success: false, msg: "user already exist" })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName: fullName.trim(),
            email: email.trim(),
            password: hashedPassword,
            bio: bio.trim()
        })

        const token = generateToken(newUser._id);

        return res.json({ success: true, userData: newUser, token, msg: "New user created successfully" })

    } catch (error) {
        console.log(error.message)
        return res.json({ success: false, msg: error.message })
    }
}



// function for login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.json({ success: false, msg: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, msg: "Invalid credentiales" });
        }

        const token = generateToken(userData._id);

        return res.json({ success: true, userData, token, msg: "user login successfully" });

    } catch (error) {
        console.log(error.message)
        return res.json({ success: false, msg: error.message });
    }
}

//is user is authenticated or not 
export const checkAuth = (req, res) => {

    res.json({ success: true, user: req.user });

}


//to update user profile details
export const updateProfile = async (req, res) => {

    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id; // user comes from middleware 
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });

        } else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, bio, fullName }, { new: true });

        }

        return res.json({ success: true, user: updatedUser, msg: "user updated successfully" });
 

    } catch (error) {
        console.log(error.message)
        return res.json({ success: false, msg: error.message });
    }

}
