import jwt from "jsonwebtoken";

// funtion to geneate token for user 
export const generateToken = (userId) => {

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    return token;
}

export const getPublicIdFromUrl = (url) => {
    try {
        // https://res.cloudinary.com/.../upload/v123/chat_app/abc123.jpg
        // Public ID = chat_app / abc123


        if (!url) return null;

        const parts = url.split("/upload/")[1];   // v123/chat_app/abc123.jpg
        const withoutVersion = parts.replace(/^v\d+\//, ""); // chat_app/abc123.jpg
        const publicId = withoutVersion.split(".")[0]; // chat_app/abc123

        return publicId;
    } catch (e) {
        console.log("error in getting pulic id :", e);
        return null;
    }
}