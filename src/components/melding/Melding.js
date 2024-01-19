import { useState, useEffect } from "react";
import usePlayers from "../../hooks/usePlayers";
import "./meldStyles.css";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off, push } from "firebase/database";

const Melding = () => {
  const [brutt, setBrutt] = useState([]);
  const [melder, setMelder] = useState("");
  const [datoBrudd, setDatoBrudd] = useState(
    Date().toString().split(" ").slice(0, 4).join(" ")
  );
  const [paragraf, setParagraf] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [enheter, setEnheter] = useState();
  const dato = new Date().toDateString();
  const players = usePlayers();
  const [id, setId] = useState([]);
  console.log(players);
  const rules = [
    "§ 1 For Glein til trening (2)",
    "§ 2 Forsinket til kamp (3)",
    "§ 3 Forfall til trening (3)",
    "§ 4 Forfall til kamp (3-5)",
    "§ 5 Forfall til klubbens sosiale arrangementer (1-2)",
    "§ 6 Utvisning (1-3)",
    "§ 7 Oppkast (2-4)",
    "§ 8 CV-hor (2)",
    "§ 9 NAV-paragrafen (2)",
    "§ 10 Innebandybilde på sosiale medier (1)",
    "§ 11 Indianer (1-3)",
    "§ 12 Desertering (3)",
    "§ 13 Snurre-paragrafen (1)",
    "§ 14 Ole Magnus paragrafen (2)",
    "§ 15 Lohrmann-paragrafen (2)",
    "§ 16 van der Lee-paragrafen (1-2)",
    "§ 17 Dobbel Dusch-paragrafen (1-6)",
    "§ 18 Sonic-paragrafen (6)",
    "§ 19 Cock Block-paragrafen (2)",
    "§ 20 Tapsparagrafen (1)",
    "§ 21 Gull på gulv (1-3)",
    "§ 22 Stemningsparagrafen (1-3)",
    "§ 23 Meldeparagrafen (6)",
    "§ 24 Fattigparagrafen (2)",
    "§ 25 Idiot-paragrafen (2)",
    "§ 27 Ida/Helle-paragrafen (6)",
    "§ 28 Forakt forettenparagrafen (1)",
    "§ 29 Friendly fire (2-4)",
    "§ 30 Ekstraordinære hendelser (1-30)",
  ];

  useEffect(() => {
    const dbRef = ref(db, "boter");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val()) {
        setId(snapshot.val().length);
      }
    };

    onValue(dbRef, handleDataChange);
    return () => {
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const bot = {
      brutt,
      melder,
      datoBrudd,
      paragraf,
      dato,
      beskrivelse,
      enheter,
      id,
    };
    console.log(bot);

    const botRef = ref(db, `boter/${id}`);
    set(botRef, bot)
      .then(() => {
        window.location.href = "/done";
      })
      .catch((error) => {
        console.error("Failed to submit data", error);
      });
  };
  return (
    <>
      <form id="mform" onSubmit={handleSubmit}>
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
            Når skjedde lovbruddet
            <br />
            <input
              type="date"
              onChange={(e) => setDatoBrudd(e.target.value)}
              defaultValue={datoBrudd}
            ></input>
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
              id="antall_enheter"
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
