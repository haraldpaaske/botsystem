import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue, off } from "firebase/database";
import "./arkivStyles.css";

const Arkiv = () => {
  const [arkivData, setArkivData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    forbryter: "",
    innsender: "",
    paragraf: "",
    dato: "",
    beskrivelse: "",
    enheter: "",
  });
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

  useEffect(() => {
    const dbRef = ref(db, "arkiv");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val()) {
        const reversedData = Object.values(snapshot.val()).reverse();
        setArkivData(reversedData);
        setFilteredData(reversedData); // Initialize filteredData with all data
      }
    };

    onValue(dbRef, handleDataChange);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange);
    };
  }, []);

  const filterData = () => {
    const filtered = arkivData.filter((entry) => {
      return (
        (entry.brutt
          .join(", ")
          .toLowerCase()
          .includes(filterCriteria.forbryter.toLowerCase()) &&
          entry.melder
            .toLowerCase()
            .includes(filterCriteria.innsender.toLowerCase()) &&
          entry.paragraf
            .toLowerCase()
            .includes(filterCriteria.paragraf.toLowerCase()) &&
          entry.datoBrudd
            .toLowerCase()
            .includes(filterCriteria.dato.toLowerCase()) &&
          entry.beskrivelse
            .toLowerCase()
            .includes(filterCriteria.beskrivelse.toLowerCase()) &&
          filterCriteria.enheter === "") ||
        entry.enheter.toString() === filterCriteria.enheter
      );
    });

    setFilteredData(filtered);
  };

  const handleInputChange = (field, value) => {
    setFilterCriteria((prevFilterCriteria) => ({
      ...prevFilterCriteria,
      [field]: value,
    }));
  };

  useEffect(() => {
    filterData();
  }, [filterCriteria, arkivData]);

  return (
    <>
      <div>
        <h1 className="h">Arkivet</h1>
        <div className="filter">
          <h2>Filtrer</h2>
          <label>
            Forbryter
            <input
              type="text"
              value={filterCriteria.forbryter}
              onChange={(e) => handleInputChange("forbryter", e.target.value)}
            />
          </label>
          <label>
            indsender
            <input
              type="text"
              value={filterCriteria.innsender}
              onChange={(e) => handleInputChange("innsender", e.target.value)}
            />
          </label>
          <label>
            Paragraf
            <select
              value={filterCriteria.paragraf}
              onChange={(e) => handleInputChange("paragraf", e.target.value)}
              required
            >
              <option value="">alle paragrafer</option>
              {rules.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            dato
            <input
              type="text"
              value={filterCriteria.dato}
              onChange={(e) => handleInputChange("dato", e.target.value)}
            />
          </label>
          <label>
            Beskrivelse
            <input
              type="text"
              value={filterCriteria.beskrivelse}
              onChange={(e) => handleInputChange("beskrivelse", e.target.value)}
            />
          </label>
          <label>
            antall enheter
            <input
              type="number"
              value={filterCriteria.enheter}
              onChange={(e) => handleInputChange("enheter", e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Forbryter</th>
              <th className="tablet-hide">Innsender</th>
              <th>Paragraf</th>
              <th>Dato brudd</th>
              <th className="tablet-hide">Dato meldt</th>
              <th className="mobile-hide">Beskrivelse</th>
              <th>Antall</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredData) &&
              filteredData.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {Array.isArray(entry.brutt)
                      ? entry.brutt.join(", ")
                      : entry.brutt}
                  </td>
                  <td className="tablet-hide">{entry.melder}</td>
                  <td>{entry.paragraf}</td>
                  <td>{entry.datoBrudd}</td>
                  <td className="tablet-hide">{entry.dato}</td>
                  <td className="mobile-hide">{entry.beskrivelse}</td>
                  <td>{entry.enheter}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Arkiv;
