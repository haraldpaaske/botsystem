import usePlayers from "../../hooks/usePlayers";
import { useState, useEffect } from "react";
import "../oversikt/oversiktStyles.css";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off, update } from "firebase/database";

const Oversikt = (props) => {
  const players = usePlayers();
  const [data, setData] = useState([]);
  const [saksData, setSaksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rettsak, setRettsak] = useState("notRettsak");
  const [editing, setEditing] = useState(false);
  const [saksomkostningApplied, setSaksomkostningApplied] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const playersWithoutBoter = players.filter(
    (player) => !data.some((bot) => bot.melder === player)
  );

  const getSumForPlayer = (player) => {
    let total = data
      .filter((entry) => entry.brutt.includes(player))
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
  };

  const getTotalBoter = () => {
    return players.reduce(
      (total, player) => total + getSumForPlayer(player),
      0
    );
  };

  useEffect(() => {
    const dbRef = ref(db, "boter");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val()) {
        console.log(snapshot.val()); //this dont log
        setData(snapshot.val());
      }
    };

    onValue(dbRef, handleDataChange);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
    };
  }, []);

  useEffect(() => {
    console.log(data);
  }, [data]);

  //   method: "GET",
  //   headers: { "Content-Type": "application/json" },
  // })
  //   .then((response) => {
  //     if (!response.ok) {
  //       throw new Error(`Error: ${response.statusText}`);
  //     }
  //     return response.json();
  //   })
  //   .then((data) => {
  //     setData(data);
  //     setLoading(false);
  //   })
  //   .catch((err) => {
  //     setError(err.message);
  //     setLoading(false);
  //   });

  // fetch("https://botsystem.onrender.com/saks", {
  //   method: "GET",
  //   headers: { "Content-Type": "application/json" },
  // })
  //   .then((response) => {
  //     if (!response.ok) {
  //       throw new Error(`Error: ${response.statusText}`);
  //     }
  //     return response.json();
  //   })
  //   .then((data) => {
  //     setSaksData(data);
  //     setLoading(false);
  //   })
  //   .catch((err) => {
  //     setError(err.message);
  //     setLoading(false);
  //   });

  useEffect(() => {
    const dbRef = ref(db, "saks");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val()) {
        setSaksData(snapshot.val());
        setLoading(false);
      }
    };

    const unsubscribe = onValue(dbRef, handleDataChange, (error) => {
      console.error("Firebase read failed:", error.code);
      setError(error);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRettsak = () => {
    if (rettsak == "rettsak") {
      setRettsak("notRettsak");
      setEditing(false);
    } else {
      setRettsak("rettsak");
      setEditing(true);
    }
  };

  // const handleUnitsChange = (id, value) => {
  //   // Update the bot with the new units
  //   const updatedBot = {
  //     ...data.find((bot) => bot.id === id),
  //     enheter: Number(value),
  //   };

  //   // Make a PUT request to update the server
  //   fetch(`https://botsystem.onrender.com/boter/${id}`, {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(updatedBot),
  //   })
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error(`Error: ${response.statusText}`);
  //       }
  //       return response.json();
  //     })
  //     .then((updatedData) => {
  //       // Update the local state with the updated data
  //       const updatedBots = data.map((bot) =>
  //         bot.id === id ? updatedData : bot
  //       );
  //       setData(updatedBots);
  //     })
  //     .catch((err) => {
  //       console.error(`Failed to update bot with id ${id}:`, err);
  //       // Handle error appropriately, possibly with user feedback or error logging
  //     });
  // };

  const handleUnitsChange = (id, value) => {
    // Assuming `data` is an array of objects and each object has a unique id.
    const botIndex = data.findIndex((bot) => bot.id === id);
    if (botIndex === -1) return; // exit function if id is not found

    // Update the bot with the new units
    const updatedBot = {
      ...data[botIndex],
      enheter: Number(value),
    };

    // Find the firebase key for the bot
    const botRef = ref(db, `boter/${id}`);

    // Make a PUT-like request to update Firebase
    update(botRef, updatedBot)
      .then(() => {
        // On success, update local state
        const updatedBots = data.map((bot) =>
          bot.id === id ? updatedBot : bot
        );
        setData(updatedBots);
      })
      .catch((error) => {
        console.error(`Failed to update bot with id ${id}:`, error);
        // Handle error appropriately, possibly with user feedback or error logging
      });
  };

  const handleSaksomkostning = async (name, botId) => {
    const newSaks = {
      person: name,
      bot_id: botId,
    };

    try {
      // Await ensures that we wait for the fetch to complete before moving on
      const response = await fetch("https://botsystem.onrender.com/saks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSaks),
      });

      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        throw new Error("Network response was not ok" + response.statusText);
      }

      setSaksomkostningApplied((prevState) => [...prevState, newSaks]);

      setRefresh((prevRefresh) => prevRefresh + 1);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  if (data.length !== 0) {
    console.log(data);
    return (
      <>
        <div className="container">
          <h2>Oversikt</h2>
          <ul>
            {players.map((player) => (
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
              </li>
            ))}
          </ul>
          <div className="total-boter">Total: {getTotalBoter()} enheter</div>
        </div>

        <h2>Alle bøter</h2>
        {props.botsjef && <button onClick={handleRettsak}>Rettsak</button>}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th> Forbryter</th>
                <th className="tablet-hide">Innsender</th>
                <th>Paragraf</th>
                <th className="tablet-hide">Dato</th>
                <th className="mobile-hide">Beskrivelse</th>
                <th>Antall enheter</th>
              </tr>
            </thead>
            <tbody>
              {[...(data || [])].reverse().map((bot) => (
                <tr key={bot.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
};

export default Oversikt;
