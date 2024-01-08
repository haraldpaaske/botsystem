import "./App.css";
import Navbar from "./components/navbar/Navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Reglement from "./components/reglement/Reglement";
import Oversikt from "./components/oversikt/Oversikt";
import Melding from "./components/melding/Melding";
import Done from "./components/melding/Done";
import { useState } from "react";
import bcrypt from "bcryptjs";
import Arkiv from "./components/arkiv/Arkiv";

function App() {
  const [inputPassword, setInputPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
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
      <label id="botsjef">
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
          <Route path="/arkiv" element={<Arkiv botsjef={isLoggedIn} />} />
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
