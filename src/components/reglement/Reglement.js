import { useState, useRef, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off } from "firebase/database";
import "./regStyles.css";

const Reglement = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef(null);
  const [content, setContent] = useState("");

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

  return (
    <>
      <div className="reglement">
        {isEditing ? (
          <div>
            <div
              ref={contentRef}
              contentEditable={true}
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <button onClick={saveContent}>Save</button>
            {isEditing && (
              <button onClick={insertElements}>legg til paragraf</button>
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
