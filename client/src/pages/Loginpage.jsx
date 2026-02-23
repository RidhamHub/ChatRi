import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/authContext";

const Loginpage = () => {
  
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (e) => {
    e.preventDefault();

    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    if (currState === "Sign up") {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setIsDataSubmitted(false);
        return;
      }
    }

    login(currState === "Sign up" ? "signup" : "login", {
      fullName,
      email,
      password, 
      bio,
    });
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      {/* left part */}
      <img src={assets.logo_icon} alt="" className=" w-[min(30vw,250px)]" />

      {/* right part */}

      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg"
        action=""
      >
        <h2 className="font-medium text-2xl flex justify-baseline items-center">
          {currState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
            />
          )}
        </h2>

        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            placeholder="Enter Full name "
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:right-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              required
            />
          </>
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:right-2 focus:ring-indigo-500"
              placeholder="Enter your Password"
              required
            />
          </>
        )}

        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:right-2 focus:ring-indigo-500"
            placeholder="Provide your short bio..."
          ></textarea>
        )}

        <button className="py-3 bg-linear-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer">
          {currState === "Sign up" ? "Create Account " : "Login Now"}
        </button>

        <div className="flex items-center gap-2 text-sm  text-gray-500">
          <input type="checkbox" name="" id="" />
          <p>Agree to all the terms and condiotions & privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2">
          {currState === "Sign up" ? (
            <p className="text-sm text-gray-600">
              Already have an account?
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Create an account
              <span
                onClick={() => {
                  setCurrState("Sign up");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Loginpage;
