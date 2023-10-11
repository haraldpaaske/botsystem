import { useState } from "react";
import usePlayers from "../../hooks/usePlayers";
import "./meldStyles.css";
const Melding = () => {
  const [brutt, setBrutt] = useState([]);
  const [melder, setMelder] = useState("");
  const [paragraf, setParagraf] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [enheter, setEnheter] = useState();
  const dato = new Date().toDateString();
  const players = usePlayers();
  console.log(players);
  const rules = [
    "§ 1 For Glein til trening",
    "§ 2 Forsinket til kamp",
    "§ 3 Forfall til trening",
    "§ 4 Forfall til kamp",
    "§ 5 Forfall til klubbens sosiale arrangementer",
    "§ 6 Utvisning",
    "§ 7 Oppkast",
    "§ 8 CV-hor",
    "§ 9 NAV-paragrafen",
    "§ 10 Innebandybilde på sosiale medier",
    "§ 11 Indianer",
    "§ 12 Desertering",
    "§ 13 Snurre-paragrafen",
    "§ 14 Ole Magnus paragrafen",
    "§ 15 Lohrmann-paragrafen",
    "§ 16 van der Lee-paragrafen",
    "§ 17 Dobbel Dusch-paragrafen",
    "§ 18 Sonic-paragrafen",
    "§ 19 Cock Block-paragrafen",
    "§ 20 Tapsparagrafen",
    "§ 21 Gull på gulv",
    "§ 22 Stemningsparagrafen",
    "§ 23 Meldeparagrafen",
    "§ 24 Fattigparagrafen",
    "§ 25 Idiot-paragrafen",
    "§ 27 Ida/Helle-paragrafen",
    "§ 28 Forakt forettenparagrafen",
    "§ 29 Friendly fire",
    "§ 30 Ekstraordinære hendelser",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const bot = {
      brutt,
      melder,
      paragraf,
      dato,
      beskrivelse,
      enheter,
    };
    console.log(bot);

    fetch("https://botsystem.onrender.com/boter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bot),
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/done";
        } else {
          console.error("Failed to submit data");
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <div id="formDiv">
          <label>
            Hvem har brutt loven?
            <br />
            <select
              value={brutt}
              onChange={(e) =>
                setBrutt((prevBrutt) => [...prevBrutt, e.target.value])
              }
              required
            >
              <option value="" disabled>
                Select a player
              </option>
              {players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <p>{brutt.join(", ")}</p>
          </label>
          <br />
          <label>
            Hvem er du?
            <br />
            <select
              value={melder}
              onChange={(e) => setMelder(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a player
              </option>
              {players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label>
            Hvilken paragraf er brudt?
            <br />
            <select
              value={paragraf}
              onChange={(e) => setParagraf(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a rule
              </option>
              {rules.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label>
            Beskrivelse av situasjonen:
            <br />
            <textarea
              value={beskrivelse}
              onChange={(e) => setBeskrivelse(e.target.value)}
              rows="5" // You can adjust the number of rows
              cols="50" // You can adjust the number of columns
              placeholder="Beskriv hendelsen her..."
              required
            ></textarea>
          </label>

          <br />
          <label>
            Antall enheter:
            <br />
            <input
              type="number"
              value={enheter}
              onChange={(e) => setEnheter(Number(e.target.value))}
              min={1}
              max={30}
              required
            />
          </label>
          <br />
          <button type="submit">Meld bot</button>
        </div>
      </form>
    </>
  );
};

export default Melding;
