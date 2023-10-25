import { useState, useRef, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, off } from "firebase/database";
import "./regStyles.css";
//dreaft.js

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
      off(dbRef, handleDataChange); // Use the same function reference for cleaning up
    };
  }, []);

  const saveContent = () => {
    setContent(contentRef.current.innerHTML);
    setIsEditing(false);
    updateContent();
  };

  const updateContent = () => {
    set(ref(db, "regler/0"), { text: content }).catch((error) => {
      console.error("There was an error:", error);
    });
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
              onBlur={saveContent}
            />
            <button onClick={() => saveContent()}>Save</button>
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
