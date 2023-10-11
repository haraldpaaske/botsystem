const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let data = []; // Your data array

app.get("/api/data", (req, res) => res.json(data));
app.post("/api/data", (req, res) => {
  data.push(req.body);
  res.json(data);
});
app.put("/api/data/:id", (req, res) => {
  const { id } = req.params;
  const update = req.body;
  data[id] = update;
  res.json(data);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
