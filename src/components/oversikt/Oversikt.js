import usePlayers from "../../hooks/usePlayers";
import { useState, useEffect } from "react";
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
} from "firebase/database";

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
    const dbRef = ref(db, "saks");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val()) {
        setSaksData(snapshot.val());
      }
    };

    onValue(dbRef, handleDataChange);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
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
