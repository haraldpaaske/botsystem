import usePlayers from "../../hooks/usePlayers";
import { useState, useEffect } from "react";
import "../oversikt/oversiktStyles.css";

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
    fetch("https://jsonkeeper.com/b/NB8Z/boter", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    fetch("http://localhost:8000/saks", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setSaksData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
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
    // Update the bot with the new units
    const updatedBot = {
      ...data.find((bot) => bot.id === id),
      enheter: Number(value),
    };

    // Make a PUT request to update the server
    fetch(`http://localhost:8000/boter/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedBot),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
      })
      .then((updatedData) => {
        // Update the local state with the updated data
        const updatedBots = data.map((bot) =>
          bot.id === id ? updatedData : bot
        );
        setData(updatedBots);
      })
      .catch((err) => {
        console.error(`Failed to update bot with id ${id}:`, err);
        // Handle error appropriately, possibly with user feedback or error logging
      });
  };

  const handleSaksomkostning = (name, botId) => {
    const newSaks = {
      person: name,
      bot_id: botId,
    };

    fetch("https://jsonkeeper.com/b/NB8Z/saks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSaks),
    }).catch((error) => {
      console.error("Fetch error:", error);
    });
  };

  const handleSaksomkostning1 = (personType, botId) => {
    const botEntry = data.find((bot) => bot.id === botId);
    const person =
      personType === "forbryter" ? botEntry.brutt : botEntry.melder;

    // Define the new bot to be added
    const newBot = {
      // Adjust these properties as necessary
      id: Date.now(), // a simple unique identifier
      brutt: person,
      melder: "System", // Just an example, you can set any default or a system name
      paragraf: "Saksomkostning", // Set the rule name for saksomkostning
      dato: new Date().toISOString().split("T")[0], // today's date
      beskrivelse: botEntry.paragraf + ", " + botEntry.dato,
      enheter: 1, // 1 unit for saksomkostning
    };

    // Make a POST request to add the new bot
    fetch("http://localhost:8000/boter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newBot),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
      })
      .then((addedBot) => {
        // Update the local state with the new bot
        setData([...data, addedBot]);
      })
      .catch((err) => {
        console.error(`Failed to add new bot for ${person}:`, err);
        // Handle error appropriately, possibly with user feedback or error logging
      });

    setSaksomkostningApplied((prevState) => [
      ...prevState,
      { id: botId, person: personType },
    ]);
  };

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
              <th className="mobile-hide">Innsender</th>
              <th>Paragraf</th>
              <th className="mobile-hide">Dato</th>
              <th className="mobile-hide">Beskrivelse</th>
              <th>Antall enheter</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((bot) => (
              <tr key={bot.id}>
                <td>
                  {Array.isArray(bot.brutt) ? bot.brutt.join(", ") : bot.brutt}
                  {!saksomkostningApplied.some(
                    (entry) => entry.id === bot.id
                  ) && (
                    <button
                      onClick={() => handleSaksomkostning(bot.brutt[0], bot.id)}
                      className={rettsak}
                    >
                      saksomkostning
                    </button>
                  )}
                  {saksomkostningApplied.some(
                    (entry) =>
                      entry.id === bot.id && entry.person === "forbryter"
                  ) && (
                    <span className="saksomkostning-text">saksomkostning</span>
                  )}
                </td>
                <td className="mobile-hide">
                  {bot.melder}{" "}
                  {!saksomkostningApplied.some(
                    (entry) => entry.id === bot.id
                  ) && (
                    <button
                      onClick={() => handleSaksomkostning(bot.melder, bot.id)}
                      className={rettsak}
                    >
                      saksomkostning
                    </button>
                  )}
                  {saksomkostningApplied.some(
                    (entry) => entry.id === bot.id && entry.person === "melder"
                  ) && (
                    <span className="saksomkostning-text">saksomkostning</span>
                  )}
                </td>
                <td>{bot.paragraf}</td>
                <td className="mobile-hide">{bot.dato}</td>
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
};

export default Oversikt;
