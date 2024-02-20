import { useState, useEffect, useRef } from "react";
import usePlayers from "../../hooks/usePlayers";
import "./meldStyles.css";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off } from "firebase/database";

const Melding = ({ formData, updateFormData }) => {
  const { brutt, melder, datoBrudd, paragraf, beskrivelse, enheter, id } =
    formData;
  const players = usePlayers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const submitButtonRef = useRef(null);

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
    "§ 31 Kjeks Paragrafen (3)",
    "§ 32 Botsjefs-passiv-bot-plikt-paragrafen (1-5)",
    "§ 33 Movember-paragrafen (3)",
    "§ 30 Ekstraordinære hendelser (1-30)",
  ];

  useEffect(() => {
    if (submitCooldown) {
      // If cooldown is active, disable the button
      if (submitButtonRef.current) {
        submitButtonRef.current.disabled = true;
      }
      const timer = setTimeout(() => {
        setSubmitCooldown(false);
        if (submitButtonRef.current) {
          submitButtonRef.current.disabled = false;
        }
      }, 5000); // Cooldown period of 5 seconds

      return () => clearTimeout(timer);
    }
  }, [submitCooldown]);

  useEffect(() => {
    const dbRef = ref(db, "boter");
    const handleDataChange = (snapshot) => {
      if (snapshot.exists()) {
        updateFormData("id", Object.keys(snapshot.val()).length);
      }
    };

    onValue(dbRef, handleDataChange);
    return () => off(dbRef, handleDataChange);
  }, [updateFormData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitCooldown) return;

    setIsSubmitting(true);
    setSubmitCooldown(true); // Start cooldown immediately on submit

    const bot = {
      brutt,
      melder,
      datoBrudd,
      paragraf,
      dato: new Date().toDateString(),
      beskrivelse,
      enheter: Number(enheter),
      id,
    };

    try {
      await set(ref(db, `boter/${id}`), bot);
      window.location.href = "/done";
    } catch (error) {
      console.error("Failed to submit data", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumericInputChange = (e) => {
    const value = e.target.value;

    // Update only if the input value is a number or empty (to allow clearing the input)
    if (value === "" || /^\d+$/.test(value)) {
      updateFormData("enheter", value === "" ? "" : Number(value));
    }
  };

  const handleRemoveBrutt = (playerToRemove) => {
    updateFormData(
      "brutt",
      brutt.filter((player) => player !== playerToRemove)
    );
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
                updateFormData("brutt", [...brutt, e.target.value])
              }
              required
            >
              <option value="" disabled>
                Velg en spiller
              </option>
              {players
                .filter((p) => !brutt.includes(p)) // Filter out selected players
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
            Hvem er du?
            <br />
            <select
              value={melder}
              onChange={(e) => updateFormData("melder", e.target.value)}
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
              onChange={(e) => updateFormData("datoBrudd", e.target.value)}
              defaultValue={datoBrudd}
            ></input>
          </label>
          <br />
          <label>
            Hvilken paragraf er brudt?
            <br />
            <select
              value={paragraf}
              onChange={(e) => updateFormData("paragraf", e.target.value)}
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
              onChange={(e) => updateFormData("beskrivelse", e.target.value)}
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
              inputmode="numeric"
              pattern="[0-9]*"
              onChange={handleNumericInputChange}
              min={1}
              max={30}
              required
            />
          </label>
          <br />
          <button
            ref={submitButtonRef}
            type="submit"
            disabled={isSubmitting || submitCooldown}
          >
            {submitCooldown ? "Sender inn..." : "Meld bot"}
          </button>
          {submitCooldown && <p>Sender inn</p>}
        </div>
      </form>
    </>
  );
};

export default Melding;
