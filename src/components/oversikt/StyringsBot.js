import { useState, useEffect, useRef } from "react";
import usePlayers from "../../hooks/usePlayers";
import useRules from "../../hooks/fetchRules";
import "../melding/meldStyles.css";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off } from "firebase/database";

const StyringsBot = () => {
  const players = usePlayers() || []; // Ensure it's always an array
  const rules = useRules() || [];

  // Local state for form fields
  const [brutt, setBrutt] = useState([]);
  const [beskrivelse, setBeskrivelse] = useState("");
  const [enheter, setEnheter] = useState(1);
  const [id, setId] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const submitButtonRef = useRef(null);
  const [selectedBrutt, setSelectedBrutt] = useState("");

  useEffect(() => {
    if (submitCooldown) {
      if (submitButtonRef.current) submitButtonRef.current.disabled = true;
      const timer = setTimeout(() => {
        setSubmitCooldown(false);
        if (submitButtonRef.current) submitButtonRef.current.disabled = false;
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitCooldown]);

  // Fetch the next available ID from the database
  useEffect(() => {
    const dbRef = ref(db, "boter");
    const handleDataChange = (snapshot) => {
      if (snapshot.exists() && snapshot.val()) {
        setId(Object.keys(snapshot.val()).length);
      } else {
        setId(0); // Prevent undefined issues
      }
    };
    onValue(dbRef, handleDataChange);
    return () => off(dbRef, handleDataChange);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitCooldown) return;

    setIsSubmitting(true);
    setSubmitCooldown(true);

    const bot = {
      brutt,
      melder : "Systemet",
      datoBrudd : "",
      paragraf: "§ 0 Rettssamfunnets prinsipp",
      dato: new Date().toDateString(),
      beskrivelse,
      enheter,
      id,
    };

    try {
      await set(ref(db, `boter/${id}`), bot);
      setBrutt([]);
      setBeskrivelse("");
      setEnheter(1);
      setSelectedBrutt("");
    } catch (error) {
      console.error("Failed to submit data", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBruttSelectChange = (e) => {
    const newBrutt = e.target.value;
    if (newBrutt) {
      setBrutt([...brutt, newBrutt]);
    }
    setSelectedBrutt("");
  };

  const handleRemoveBrutt = (playerToRemove) => {
    setBrutt(brutt.filter((player) => player !== playerToRemove));
  };

  return (
    <>
      <form id="mform" onSubmit={handleSubmit}>
        <div id="formDiv">
          <label>
            Hvem skal justeres?
            <br />
            <select
              value={selectedBrutt}
              onChange={handleBruttSelectChange}
              required={brutt.length === 0}
            >
              <option value="" disabled>
                Velg spiller
              </option>
              {players.length > 0 &&
                players
                  .filter((p) => !brutt.includes(p))
                  .map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
            </select>
          </label>
          {brutt.map((selectedPlayer) => (
            <span key={selectedPlayer}>
              {selectedPlayer}
              <button
                className="remove_button"
                type="button"
                onClick={() => handleRemoveBrutt(selectedPlayer)}
              >
                fjern
              </button>
              <br />
            </span>
          ))}

          <br />
          <label>
            Notat
            <br />
            <textarea
              value={beskrivelse}
              onChange={(e) => setBeskrivelse(e.target.value)}
              rows="5"
              cols="50"
              placeholder="Beskriv justeringen..."
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
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => setEnheter(Number(e.target.value))}
              required
            />
          </label>
          <br />
          <button ref={submitButtonRef} type="submit" disabled={isSubmitting || submitCooldown}>
            {submitCooldown ? "Sender inn..." : "Meld justering"}
          </button>
          {submitCooldown && <p>Sender inn</p>}
        </div>
      </form>
    </>
  );
};

export default StyringsBot;