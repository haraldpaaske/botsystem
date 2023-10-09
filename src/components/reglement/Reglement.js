import { useState, useRef, useEffect } from "react";
import "./regStyles.css";

const Reglement = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/regler", {
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
        if (data && data[0] && data[0].text) {
          // Ensuring data exists and has the expected structure
          setContent(data[0].text); // Setting the content to the "text" property of the first object
        }
        console.log(data);
      });
  }, []);

  const saveContent = () => {
    setContent(contentRef.current.innerHTML);
    setIsEditing(false);
    updateContent();
  };

  const updateContent = () => {
    fetch("http://localhost:8000/regler/0", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
      })
      .catch((error) => {
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
