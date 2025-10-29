const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Vinted bot is running ✅");
});

// Render te donne un PORT dans process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("HTTP keep-alive server listening on port " + PORT);
});
