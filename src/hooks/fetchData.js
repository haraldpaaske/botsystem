const apiBaseURL = "http://localhost:8080";

const fetchData = async (url, method = "GET", body) => {
  const response = await fetch(apiBaseURL + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
};
