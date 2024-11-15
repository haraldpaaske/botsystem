import { useState, useRef, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off, push } from "firebase/database";
import "./regStyles.css";

const Reglement = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef(null);
  const [content, setContent] = useState("");
  const [newRule, setNewRule] = useState(""); // State for the new rule input field

  useEffect(() => {
    const dbRef = ref(db, "regler/0");

    const handleDataChange = (snapshot) => {
      if (snapshot && snapshot.val() && snapshot.val().text) {
        setContent(snapshot.val().text);
      }
    };

    onValue(dbRef, handleDataChange);

    // Cleanup
    return () => {
      off(dbRef, handleDataChange);
    };
  }, []);

  const saveContent = async () => {
    const newContent = contentRef.current.innerHTML;
    setIsEditing(false);

    // Update the content state immediately
    setContent(newContent);

    // Update the content in the database
    await updateContent(newContent);
  };

  const updateContent = async (newContent) => {
    try {
      await set(ref(db, "regler/0"), { text: newContent });
      console.log("Content saved:", newContent);
    } catch (error) {
      console.error("Error saving content:", error);
    }
  };

  const insertElements = () => {
    const currentHTML = contentRef.current.innerHTML;
    const newHTML = `
      ${currentHTML}
      <h2>§ New Paragraph</h1>
      <p>New Paragraph</p>
      <ul>
        <li>Bullet Point 1</li>
      </ul>
    `;
    contentRef.current.innerHTML = newHTML;
  };

  const saveNewRule = async () => {
    try {
      if (newRule.trim() !== '') {
        // Get a reference to the 'regler/1' path
        const rulesRef = ref(db, '/regler/1');
  
        // Generate a new unique key for the new rule
        const newRuleRef = push(rulesRef);
  
        // Save the new rule content directly under the generated key
        await set(newRuleRef, newRule);
  
        console.log(`${newRule} added to regler/1`);
  
        // Optionally, clear the input field or update UI state here
        setNewRule('');  // Clear the input field after adding the rule
  
      } else {
        console.error("New rule content is empty.");
      }
    } catch (error) {
      console.error('Error adding rule: ', error);
      alert('Error adding rule: ', error);
    }
  };

  return (
    <>
    {isEditing ? (
      <button onClick={saveContent}>Save</button>
    ):(
      <>
      {props.botsjef && (
        <button onClick={() => setIsEditing(true)}>Rediger</button>
      )}
      </>
    )}
      <div className="reglement">
        {isEditing ? (
          <div>
            <div
              ref={contentRef}
              contentEditable={true}
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <button onClick={saveContent}>Save</button><br/><br/>
            {isEditing && (
              <>
                <button onClick={insertElements}>legg til paragraf</button><br/><br/>
                <button onClick={saveNewRule}>legg til paragraf i systemet</button><br/>
                <input
                  id="newRule"
                  placeholder="§ 3 Forfall til trening (1-3)"
                  value={newRule} // Bind the input value to the state
                  onChange={(e) => setNewRule(e.target.value)} // Update the state on input change
                /><br/>
                
              </>
            )}
          </div>
        ) : (
          <div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
            {props.botsjef && (
              <button onClick={() => setIsEditing(true)}>Rediger</button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Reglement;