import usePlayers from "../../hooks/usePlayers";
import useRules from "../../hooks/fetchRules";
import { useState, useEffect, useCallback, useMemo } from "react";
import "../oversikt/oversiktStyles.css";
import { db } from "../../firebaseConfig";
import {
  ref,
  onValue,
  set,
  off,
  update,
  getDatabase,
  query,
  orderByChild,
  equalTo,
  get,
  remove,
  push,
} from "firebase/database";

const Oversikt = (props) => {
  const players = usePlayers();
  const rules = useRules();
  const [sortedPlayers, setSortedPlayers] = useState([]);
  const [data, setData] = useState([]);
  const [saksData, setSaksData] = useState([]);
  const [antallBoter, setAntallBoter] = useState(1000);
  const [rettsak, setRettsak] = useState("notRettsak");
  const [editing, setEditing] = useState(false);
  const [saksomkostningApplied, setSaksomkostningApplied] = useState([]);
  const [registreringsMode, setRegistreringsMode] = useState(false);
  const [medbrakt, setMedbrakt] = useState({});
  const [medbraktRegistrertClicked, setMedbraktRegistertClicked] = useState({});
  const [jsonDataFull, setJsonDataFull] = useState(null);
  const [jsonDataBoter, setJsonDataBoter] = useState(null);
  const dato = new Date().toDateString().split(" ");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    forbryter: "",
    innsender: "",
    paragraf: "",
    dato: "",
    beskrivelse: "",
    enheter: "",
  });
  const [filteredData, setFilteredData] = useState([]);
  const reversedData = [...filteredData].reverse();

  const playersWithoutBoter = useMemo(
    () =>
      players.filter((player) => !data.some((bot) => bot.melder === player)),
    [players, data]
  );

  const handleCheckboxChange = (player) => {
    setMedbraktRegistertClicked((prevClicked) => ({
      ...prevClicked,
      [player]: !prevClicked[player],
    }));
  };

  const areAllCheckboxesChecked = () => {
    return sortedPlayers.every((player) => medbraktRegistrertClicked[player]);
  };

  const getSumForPlayer = useCallback(
    (player) => {
      let total = data
        .filter(
          (entry) => entry.brutt.includes(player) && entry.id < antallBoter
        )
        .reduce((sum, entry) => sum + entry.enheter, 0);

      const saksomkostningCount = saksData.filter(
        (entry) => entry.person === player
      ).length;
      total += saksomkostningCount;

      if (total < 6) {
        total = 6;
      }
      if (playersWithoutBoter.includes(player)) {
        total += 6;
      }
      return total;
    },
    [antallBoter, data, saksData, playersWithoutBoter]
  );

  const getTotalBoter = () => {
    return players.reduce(
      (total, player) => total + getSumForPlayer(player),
      0
    );
  };

  //sort players based on antall enheter
  useEffect(() => {
    const calculateAndSetSortedPlayers = () => {
      const sortedPlayers = players.slice().sort((playerA, playerB) => {
        const unitsA = getSumForPlayer(playerA);
        const unitsB = getSumForPlayer(playerB);
        return unitsB - unitsA; // Sort in descending order based on units
      });

      setSortedPlayers(sortedPlayers);
    };

    calculateAndSetSortedPlayers();
  }, [players, data, antallBoter, saksData, getSumForPlayer]);

  //get antall bøter før rettsak
  useEffect(() => {
    const dbRef = ref(db, "antall_boter/0/antall");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val()) {
        setAntallBoter(snapshot.val());
      }
    };

    onValue(dbRef, handleDataChange);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
    };
  }, []);

  //get bøter
  useEffect(() => {
    const dbRef = ref(db, "boter");
    const fullRef = ref(db);

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val()) {
        const jsonDataFromFirebase = snapshot.val();
        const jsonDataAsString = JSON.stringify(jsonDataFromFirebase);
        setData(snapshot.val());
        setJsonDataBoter(jsonDataAsString);
      }
    };

    const handleDataChange2 = (snapshot) => {
      if (snapshot && snapshot.val()) {
        const jsonDataFromFirebase = snapshot.val(); // Assuming it's an object
        const jsonDataAsString = JSON.stringify(jsonDataFromFirebase);

        setJsonDataFull(jsonDataAsString);
      }
    }; // This closing brace was missing.

    onValue(dbRef, handleDataChange);
    onValue(fullRef, handleDataChange2);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
      off(fullRef, handleDataChange2); // Use the same function reference for cleaning up
    };
  }, []);

  //get saksomkostninger
  useEffect(() => {
    const dbRef = ref(db, "saks");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val()) {
        setSaksData(snapshot.val());
        setSaksomkostningApplied(snapshot.val());
      }
    };

    onValue(dbRef, handleDataChange);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
    };
  }, []);

  const setRettsakAntall = () => {
    const db = getDatabase();
    set(ref(db, "antall_boter/0"), { antall: data.length })
      .then(() => {
        console.log("Data written successfully!");
      })
      .catch((error) => {
        console.error("Error writing to Firebase Database", error);
      });
  };

  const handleRettsak = () => {
    if (rettsak === "rettsak") {
      if (window.confirm("Er rettsaken ferdig?")) {
        setRettsak("notRettsak");
        setEditing(false);
        setRettsakAntall();
      } else {
        setRettsak("rettsak");
        setEditing(true);
      }
    } else {
      setRettsak("rettsak");
      setEditing(true);
    }
  };

  const handleUnitsChange = (id, value) => {
    const db = getDatabase();
    const botRef = ref(db, "boter");
    const q = query(botRef, orderByChild("id"), equalTo(id));
    get(q)
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const botKey = childSnapshot.key;

            const updatedBot = {
              ...childSnapshot.val(),
              enheter: Number(value),
            };

            const specificBotRef = ref(db, `boter/${botKey}`);
            update(specificBotRef, updatedBot)
              .then(() => {
                const updatedBots = data.map((bot) =>
                  bot.id === id ? updatedBot : bot
                );
                setData(updatedBots);
              })
              .catch((error) => {
                console.error(`Failed to update bot with id ${id}:`, error);
              });
          });
        } else {
          console.log(`No bot found with id ${id}`);
        }
      })
      .catch((error) => {
        console.error(`Failed to query bots:`, error);
      });
  };

  const handleRegistrerBoter = (value, player) => {
    setMedbraktRegistertClicked({
      ...medbraktRegistrertClicked,
      [player]: true,
    });
  };

  function confirmNewBotPeriode() {
    var userConfirmation = window.confirm(
      "Vil du fortsette inn i ny bot-periode? dette vil slette alle gamle bøter og legge til de nye som ble meldt inn etter rettsak. De gamle blir lasted ned for sikkhetskyld."
    );

    if (userConfirmation) {
      // User pressed "OK"
      if (window.confirm("Bekreft: Begynne ny bot-periode")) {
        alert("Ny bot periode er i gang!");
        ferdigRegistertMedbrakte();
        handleDownload();
        handleDownloadFull();
        setRegistreringsMode(false);

        // New functionality to delete "saksomkostninger"
        const saksRef = ref(db, "saks");
        get(saksRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const saksData = snapshot.val();
              Object.keys(saksData).forEach((key) => {
                if (key !== "0") {
                  // Skip the entry with key '0'
                  const saksToDeleteRef = ref(db, `saks/${key}`);
                  remove(saksToDeleteRef).catch((error) => {
                    console.error("Failed to delete saksomkostning", error);
                  });
                }
              });
            }
          })
          .catch((error) => {
            console.error("Error fetching saksomkostninger", error);
          });

        const db = getDatabase();
        set(ref(db, "antall_boter/0"), { antall: 10000 })
          .then(() => {
            console.log("Data written successfully!");
          })
          .catch((error) => {
            console.error("Error writing to Firebase Database", error);
          });
      }
    } else {
      // User pressed "Cancel"
      alert("You pressed Cancel!");
    }
  }

  const ferdigRegistertMedbrakte = () => {
    for (let player of players) {
      //får ida pluss hellehvis: man har tatt med mindre ann man skal, trenger maks ta med 30
      if (getSumForPlayer(player) > medbrakt[player] && medbrakt[player] < 30) {
        //regirstrer en ida+helle pluss en bøter fra tidligere bot
        let brutt = player;
        let melder = "Systemet";
        let paragraf = "§ 27 Ida/Helle-paragrafen";
        let dato = new Date().toDateString();
        let beskrivelse = `Tildelte bøter er ikke medbrakt, vedkommende staffes med 6, pluss ${
          getSumForPlayer(player) - medbrakt[player]
        } enhet(er) fra tidligere botfest`;
        let enheter = getSumForPlayer(player) - medbrakt[player] + 6;
        let id = data.length;
        const idahelle = {
          brutt,
          melder,
          paragraf,
          dato,
          beskrivelse,
          enheter,
          id,
        };
        console.log(idahelle);

        const botRef = ref(db, `boter/${id}`);
        set(botRef, idahelle).catch((error) => {
          console.error("Failed to submit data", error);
        });
      } else if (
        medbrakt[player] >= 30 &&
        getSumForPlayer(player) > 30 &&
        medbrakt[player] <= getSumForPlayer(player)
      ) {
        //regirtrer en "bot fra tidlige bot"
        let brutt = player;
        let melder = "Systemet";
        let paragraf = "Enheter fra tidligere botfest";
        let dato = new Date().toDateString();
        let beskrivelse = `Vedkommende har tatt med sine 30+ bøter, men skylder fortsatt ${
          getSumForPlayer(player) - medbrakt[player]
        }`;
        let enheter = getSumForPlayer(player) - medbrakt[player];
        let id = data.length;
        const restebot = {
          brutt,
          melder,
          paragraf,
          dato,
          beskrivelse,
          enheter,
          id,
        };
        console.log(restebot);

        const botRef = ref(db, `boter/${id}`);
        set(botRef, restebot).catch((error) => {
          console.error("Failed to submit data", error);
        });
      }
    }
  };

  const handleMedbraktChange = (playerName, newValue) => {
    const updatedMedbrakt = {
      ...medbrakt,
      [playerName]: parseInt(newValue, 10),
    };
    setMedbrakt(updatedMedbrakt);
  };

  const handleRegMode = () => {
    if (registreringsMode) {
      setRegistreringsMode(false);
    } else {
      setRegistreringsMode(true);

      const allUpdates = {};
      for (let player of players) {
        allUpdates[player] = getSumForPlayer(player);
      }
      setMedbrakt(allUpdates);
    }
  };

  const handleSaksomkostning = async (name, botId) => {
    const newSaks = {
      person: name,
      bot_id: botId,
    };

    const saksRef = ref(db, `saks/${saksData.length}`);
    set(saksRef, newSaks)
      .then(() => {
        setSaksomkostningApplied((prevState) => [...prevState, newSaks]);
      })
      .catch((error) => {
        console.error("Failed to submit data", error);
      });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonDataBoter], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `bot-data(${dato[1]}-${dato[3]}).json`;

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadFull = () => {
    const blob = new Blob([jsonDataFull], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `Backup-data(${dato[1]}-${dato[3]}).json`;

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    restructureBoter();
  };

  async function restructureBoter() {
    const db = getDatabase();
    let boterCount;

    // Step 1: Get the 'antall_boter' value
    try {
      const snapshot = await get(ref(db, "antall_boter/0/antall"));
      if (snapshot.exists()) {
        boterCount = snapshot.val(); // assuming it's an integer
        console.log(boterCount);
      } else {
        console.log("No antall_boter found");
        return;
      }
    } catch (error) {
      console.error("Error fetching antall_boter:", error);
      return;
    }

    try {
      const boterRef = ref(db, "boter");
      const arkivRef = ref(db, "arkiv");

      const boterSnapshot = await get(boterRef);
      if (boterSnapshot.exists()) {
        const boterData = boterSnapshot.val();

        // Filter out the boter entries for archiving (0 to boterCount - 1)
        const entriesToArchive = Object.keys(boterData)
          .filter((key) => parseInt(key, 10) < boterCount)
          .map((key) => boterData[key]);

        // Filter out the boter entries to keep (boterCount and onwards)
        const entriesToKeep = Object.keys(boterData)
          .filter((key) => parseInt(key, 10) >= boterCount)
          .map((key) => boterData[key]);

        // Copy entries to arkiv
        for (const entry of entriesToArchive) {
          const newArkivEntryRef = push(arkivRef); // Get a new unique reference
          await set(newArkivEntryRef, entry);
        }

        // Step 2: Delete the boter
        await remove(boterRef);

        // Step 3: Re-add the kept entries with new IDs and ensure ID 0 is preserved
        const newBoterEntries = { 0: entriesToKeep[0] }; // Initialize with the first entry
        entriesToKeep.slice(1).forEach((entry, index) => {
          // Start from 1 for the new IDs
          newBoterEntries[index + 1] = entry;
        });

        await set(boterRef, newBoterEntries);
        console.log("Boter restructuring and copy to Arkiv complete.");
      } else {
        console.log("No boter found.");
      }
    } catch (error) {
      console.error(
        "Error during boter restructuring and copy to Arkiv:",
        error
      );
    }
  }

  useEffect(() => {
    const filterData = () => {
      const filtered = data.filter((entry) => {
        const matchesForbryter = Array.isArray(entry.brutt)
          ? entry.brutt
              .join(", ")
              .toLowerCase()
              .includes(filterCriteria.forbryter.toLowerCase())
          : entry.brutt
              .toLowerCase()
              .includes(filterCriteria.forbryter.toLowerCase());

        const matchesInnsender = entry.melder
          .toLowerCase()
          .includes(filterCriteria.innsender.toLowerCase());

        const matchesParagraf =
          filterCriteria.paragraf === "" ||
          entry.paragraf === filterCriteria.paragraf;

        const matchesDato =
          filterCriteria.dato === "" ||
          entry.datoBrudd
            .toLowerCase()
            .includes(filterCriteria.dato.toLowerCase());

        const matchesBeskrivelse =
          filterCriteria.beskrivelse === "" ||
          entry.beskrivelse
            .toLowerCase()
            .includes(filterCriteria.beskrivelse.toLowerCase());

        const matchesEnheter =
          filterCriteria.enheter === "" ||
          entry.enheter.toString() === filterCriteria.enheter;

        return (
          matchesForbryter &&
          matchesInnsender &&
          matchesParagraf &&
          matchesDato &&
          matchesBeskrivelse &&
          matchesEnheter
        );
      });

      setFilteredData(filtered);
    };

    filterData();
  }, [filterCriteria, data]); // Assuming `data` is your original dataset

  const handleInputChange = (field, value) => {
    setFilterCriteria((prevFilterCriteria) => ({
      ...prevFilterCriteria,
      [field]: value,
    }));
  };

  if (data.length !== 0) {
    return (
      <>
        {props.botsjef && (
          <>
            <button onClick={handleRegMode}>Registrere medbrakte bøter</button>
            {/* <button onClick={handleRegSpillere}>fjern/legg til spillere</button> */}
          </>
        )}

        <div className="container">
          <h2>Oversikt</h2>
          <ul>
            {sortedPlayers.map((player) => (
              <li key={player} className="player-item">
                <div className="player-name-status">
                  <span className="bold">{player}</span>
                  {playersWithoutBoter.includes(player) && (
                    <span className="status status-missed"> Meldt ❌</span>
                  )}
                  {!playersWithoutBoter.includes(player) && (
                    <span className="status status-done"> Meldt ✅</span>
                  )}
                </div>
                <span className="player-units">
                  {getSumForPlayer(player)} enheter
                </span>
                {registreringsMode && (
                  <>
                    <div>
                      <input
                        id={`registrerteBoter${player}`}
                        type="number"
                        value={medbrakt[player]}
                        max={getSumForPlayer(player)}
                        min={0}
                        onChange={(e) =>
                          handleMedbraktChange(player, e.target.value)
                        }
                        disabled={medbraktRegistrertClicked[player]}
                      />
                      <input
                        type="checkbox"
                        id={`registrerCheckbox-${player}`}
                        checked={medbraktRegistrertClicked[player]}
                        onChange={() => handleCheckboxChange(player)}
                      />
                      <label htmlFor={`registrerCheckbox-${player}`}>
                        motatt
                      </label>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="total-boter">
            Total: {getTotalBoter()} enheter
            <br />
            {registreringsMode && (
              <>
                <button onClick={() => setMedbraktRegistertClicked({})}>
                  begyn på nytt
                </button>
                <button
                  onClick={confirmNewBotPeriode}
                  disabled={!areAllCheckboxesChecked()}
                >
                  Ferdig
                </button>
              </>
            )}
          </div>
        </div>

        <h2>Alle bøter</h2>
        <button
          onClick={() => {
            setIsFilterVisible((prev) => {
              if (prev) {
                setFilterCriteria({
                  forbryter: "",
                  innsender: "",
                  paragraf: "",
                  dato: "",
                  beskrivelse: "",
                  enheter: "",
                });
              }
              return !prev;
            });
          }}
        >
          Toggle Filter
        </button>

        {isFilterVisible && (
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
                onChange={(e) =>
                  handleInputChange("beskrivelse", e.target.value)
                }
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
        )}
        {props.botsjef && <button onClick={handleRettsak}>Rettsak</button>}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th> Forbryter</th>
                <th className="tablet-hide">Innsender</th>
                <th>Paragraf</th>
                <th>Dato_brudd</th>
                <th className="tablet-hide">Dato_meldt</th>
                <th className="mobile-hide">Beskrivelse</th>
                <th>Antall</th>
              </tr>
            </thead>
            <tbody>
              {reversedData.map((bot) => (
                <tr
                  key={bot.id}
                  className={bot.id >= antallBoter ? "faded-row" : ""}
                >
                  <td>
                    {Array.isArray(bot.brutt)
                      ? bot.brutt.join(", ")
                      : bot.brutt}
                    {!saksomkostningApplied.some(
                      (entry) => entry.bot_id === bot.id
                    ) && (
                      <button
                        onClick={() =>
                          handleSaksomkostning(bot.brutt[0], bot.id)
                        }
                        className={rettsak}
                      >
                        saksomkostning
                      </button>
                    )}
                    {saksomkostningApplied.some(
                      (entry) =>
                        entry.bot_id === bot.id && entry.person === bot.brutt[0]
                    ) && (
                      <span className="saksomkostning-text">
                        saksomkostning
                      </span>
                    )}
                  </td>
                  <td className="tablet-hide">
                    {bot.melder}{" "}
                    {!saksomkostningApplied.some(
                      (entry) => entry.bot_id === bot.id
                    ) && (
                      <button
                        onClick={() => handleSaksomkostning(bot.melder, bot.id)}
                        className={rettsak}
                      >
                        saksomkostning
                      </button>
                    )}
                    {saksomkostningApplied.some(
                      (entry) =>
                        entry.bot_id === bot.id && entry.person === bot.melder
                    ) && (
                      <span className="saksomkostning-text">
                        saksomkostning
                      </span>
                    )}
                  </td>
                  <td>{bot.paragraf}</td>
                  <td>{bot.datoBrudd}</td>
                  <td className="tablet-hide">{bot.dato}</td>
                  <td className="mobile-hide">{bot.beskrivelse}</td>
                  <td>
                    {editing ? (
                      <input
                        type="number"
                        value={bot.enheter}
                        onChange={(e) =>
                          handleUnitsChange(bot.id, e.target.value)
                        }
                        className="units-input"
                      />
                    ) : (
                      bot.enheter
                    )}
                  </td>
                  {/* <button className={rettsak}>delete</button> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <br></br>
        {props.botsjef && (
          <button onClick={handleRettsak} style={{ fontSize: "18px" }}>
            Ferdig med rettsak.
          </button>
        )}
      </>
    );
  } else {
    return (
      <>
        <h1>Loading...</h1>
      </>
    );
  }
};

export default Oversikt;
