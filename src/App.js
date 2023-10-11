import "./App.css";
import Navbar from "./components/navbar/Navbar";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Reglement from "./components/reglement/Reglement";
import Oversikt from "./components/oversikt/Oversikt";
import Melding from "./components/melding/Melding";
import Done from "./components/melding/Done";
import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";

function App() {
  const [inputPassword, setInputPassword] = useState("");
  const [hashedPassword, setHashedPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const hashPassword = () => {
    // Use bcryptjs to hash and check passwords
    const salt = bcrypt.genSaltSync(10);
    setHashedPassword(bcrypt.hashSync(inputPassword, salt));
  };

  const handleLogin = async () => {
    hashPassword();
    try {
      const response = await fetch(
        "https://api.npoint.io/84df09c2d98b53a80fb4/passord/0"
      );
      const data = await response.json();
      if (bcrypt.compareSync(inputPassword, data.passord1)) {
        setIsLoggedIn(true);
      } else {
        alert("Incorrect Password");
      }
    } catch (error) {
      console.error("An error occurred while fetching the data", error);
    }
  };

  const handlePasswordChange = (event) => {
    setInputPassword(event.target.value);
  };

  return (
    <>
      <label>
        Botsjefs passord
        <br />
        <input
          type="password"
          value={inputPassword}
          onChange={handlePasswordChange}
        />
        <input type="button" value="botsjef" onClick={handleLogin} />
      </label>
      <Router>
        <Navbar />
        <Routes>
          <Route
            path="/reglement"
            element={<Reglement botsjef={isLoggedIn} />}
          />
          <Route path="/oversikt" element={<Oversikt botsjef={isLoggedIn} />} />
          <Route path="/" element={<Oversikt botsjef={isLoggedIn} />} />
          <Route path="/melding" element={<Melding />} />
          <Route path="/done" element={<Done />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
