import React, { useState, useEffect } from "react";
import { ref, onValue, off, set } from "firebase/database";
import { db } from "../../firebaseConfig";

const BugReport = () => {
  const [inputText, setInputText] = useState("");
  const [id, setId] = useState(0); // Default ID value

  useEffect(() => {
    const dbRef = ref(db, "bugReports");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val().length) {
        setId(snapshot.val().length);
      }
    };

    onValue(dbRef, handleDataChange);
    return () => {
      off(dbRef, handleDataChange);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bugReport = {
        id,
        text: inputText,
      };

      const bugReportRef = ref(db, `bugReports/${id}`);
      await set(bugReportRef, bugReport);

      console.log("Bug report submitted successfully!");
      window.location.href = "/motatt";
    } catch (error) {
      console.error("Failed to submit bug report:", error.message);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Submit desired feature:
          <br />
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows="6" // Adjust the number of rows as needed
            cols="50" // Adjust the number of columns as needed
            required
          />
        </label>
        <br />
        <button type="submit">Submit Request</button>
      </form>
    </>
  );
};

export default BugReport;
