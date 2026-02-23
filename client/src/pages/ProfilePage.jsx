import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);
  const profilePic = authUser.profilePic;
  const navigate = useNavigate();

  const [isuploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isuploading) return; // prevent double submit which gives double toast notifications

    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }


    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    setIsUploading(true); // start uploading

    reader.onload = async () => {
      try {
        const base64Img = reader.result;
        await updateProfile({ profilePic: base64Img, fullName: name, bio });
        navigate("/");
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false); // stop uploading
        e.target.value = "";
      }
    };
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
          action=""
        >
          <h3 className="text-lg">Profile Details</h3>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your Name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}
            placeholder="Write profile bio"
            required
          ></textarea>

          <button
            type="submit"
            disabled={isuploading}
            className={`bg-linear-to-r from-purple-400 to-violet-600 text-white rounded-full text-lg px-4 py-2 transition ${
              isuploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isuploading ? "Saving..." : "Save"}
          </button>
        </form>

        <label
          htmlFor="avatar"
          className="text-center items-center gap-3 cursor-pointer"
        >
          <input
            disabled={isuploading}
            onChange={(e) => setSelectedImg(e.target.files[0])}
            type="file"
            id="avatar"
            accept=".png , .jpg , .jpeg"
            hidden
          />
          <img
            src={selectedImg ? URL.createObjectURL(selectedImg) : profilePic}
            alt=""
            className={` max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && "rounded-full"}`}
          />
          <p className="mt-2 text-gray-500">Change/Upload profile Image</p>
        </label>
      </div>
    </div>
  );
};

export default ProfilePage;
