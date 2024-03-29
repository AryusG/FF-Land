import React, { useState, useContext} from "react";
import { UserContext} from "../../contexts/UserContext";
import { CalculatorContext } from "../../contexts/CalculatorContext";
import { Link, useNavigate} from "react-router-dom";
import GooglePng from "../../assets/sign-in-svgs/Google.png";
import { auth } from "../../firebase-config/firebase-config";
import { dbGetUser, dbUserExists} from "../../ApiCalls/calls";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

function LoginCard() {

  const [user, setUser] = useState({
    email: "",
    password: "",
  }) 
  const [isAuth, setAuth] = useState(false);
  const [stayLogged, setStayLogged] = useState(false);
  const navigate = useNavigate();
  
  const {calculatorStorage, setCalculatorStorage} = useContext(CalculatorContext)
  const {globalUser, setGlobalUser} = useContext(UserContext);


  async function LogInEmailPass(user) {
    try {
      const email = user.email;
      const password = user.password;

      const result = await signInWithEmailAndPassword(auth, email, password); 
      const uid = result.user.uid;

      const fetchedCalculatorStorage = (await dbGetUser(uid)).calculatorStorage;

      setCalculatorStorage(fetchedCalculatorStorage);
      setGlobalUser({email: email, uid: uid});

      window.sessionStorage.setItem("calculatorStorage", JSON.stringify(fetchedCalculatorStorage));

      if (stayLogged) {
        window.localStorage.setItem("globalUser", JSON.stringify({email: email, uid: uid}));
      }
      else {
        window.sessionStorage.setItem("globalUser", JSON.stringify({email: email, uid: uid}));
      }

      // Check the calculator storage, if any properties are blank or 0 or an empty object,
      // send user to the calculator to finish calculating before engaging in the main app.
      for (const key in fetchedCalculatorStorage) {
        if (key === "totalSaved" || key === "totalGained" || key === "totalTotal")
          continue;
        if (fetchedCalculatorStorage[key] === "" || fetchedCalculatorStorage[key] === 0 || fetchedCalculatorStorage[key] === {}) {
          setAuth(true);
          return;
        }
      }
      navigate("/");
    }
    catch (err){
      if (typeof err === "object") {
        alert("Incorrect email or password, please try again!")
        return;
      }
      console.log(err);
      alert(err);
    }
  }


  async function LoginGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential) 
        throw "Error: could not connect to Google"

      const uid = result.user.uid;
      const email = result.user.email;
      const userExists = await dbUserExists(uid);

      if (!userExists) {
        navigate("/portal/signup");
        throw `User "${email}" doesn't exist, please sign up to FF Land using Google!`;
      }

      const fetchUserData = await dbGetUser(uid);
      const fetchedCalculatorStorage = fetchUserData.calculatorStorage;

      setCalculatorStorage(fetchedCalculatorStorage);
      setGlobalUser({email: email, uid: uid});

      window.sessionStorage.setItem("calculatorStorage", JSON.stringify(fetchedCalculatorStorage));

      if (stayLogged) {
        window.localStorage.setItem("globalUser", JSON.stringify({email: email, uid: uid}));
      }
      else {
        window.sessionStorage.setItem("globalUser", JSON.stringify({email: email, uid: uid}));
      }

      for (const key in fetchedCalculatorStorage) {
        if (key === "totalSaved" || key === "totalGained" || key === "totalTotal")
          continue;
        if (fetchedCalculatorStorage[key] === "" || fetchedCalculatorStorage[key] === 0 || fetchedCalculatorStorage[key] === {}) {
          setAuth(true);
          return;
        }
      }
      navigate("/");
    }
    catch (err) {
      alert(err);
      console.log(err);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    LogInEmailPass(user);
  }

  const handleStayLoggedIn = (e) => {
    if (e.target.checked) {
      setStayLogged(true);   
    }
    else {
      setStayLogged(false);  
    }
  }

  return !isAuth ? (
    <div
      className="flex card-white font-ubuntu sm:ml-4 sm:mr-10 mx-16 px-8
      max-w-sm"
    >
      <div className="justify-center">
        <div className="flex">
          <div className="text-3xl font-medium px-7">Log In</div>
        </div>

        <form className="flex-col pb-4 pt-7 px-7" onSubmit={(e)=> handleSubmit(e)}>
          <div id="login-form-1" className="relative">
            <input
              placeholder="Email"
              className="peer input-gray w-full"
              required
              value={user.email}
              onChange={(e) => setUser({...user, email: e.target.value})}
            />
            <label className="absolute floating-label">Email</label>
          </div>
          <div id="login-form-2" className="relative">
            <input
              placeholder="Password"
              className="peer input-gray w-full"
              type="password"
              required
              value={user.password}
              onChange={(e) => setUser({...user, password: e.target.value})}
            />
            <label className="absolute floating-label">Password</label>
          </div>
          <div className="flex mx-8 pt-2 pb-5 justify-center">
            <div className="content-center flex">
              <input 
              type="checkbox" 
              id="checkbox-logged-in" 
              className="mr-3"
              value = {stayLogged}
              onChange = {(e) => handleStayLoggedIn(e)}
              />
              <label for="checkbox-logged-in" className="text-sm cursor-pointer hover:underline">Stay logged in for this device</label>
            </div>
          </div>
          <div>
            <button className="btn-pink w-full mt-1" type="submit">Log In</button>
          </div>
        </form>

        <div className="px-7 ">
          <button onClick={()=> LoginGoogle(user)}
            className="btn-white border border-pink inline-flex 
            justify-center items-center w-full px-7 mb-2"
          >
            <img src={GooglePng} alt="Google SVG" className="h-4 mr-3" />
            <span>Log in with Google</span>
          </button>
          <div className="font-light text-sm">
            <Link to="/portal/signup">
              <button className="hover:underline">
                Don’t have an account? Join FF-Land
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  ) : (
    navigate("/calculator")
  );
}

export default LoginCard;
