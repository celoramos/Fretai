const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { removeExpiredFretes } = require("./data/store");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas requisições originadas deste IP. Tente novamente mais tarde." }
});
app.use("/api/", limiter);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../src/pages")));
app.use("/styles", express.static(path.join(__dirname, "../src/styles")));
app.use("/scripts", express.static(path.join(__dirname, "../src/scripts")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));

setInterval(removeExpiredFretes, 60000);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/fretes", require("./routes/fretes"));
app.use("/api/motoristas", require("./routes/motoristas"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/pages/login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Fretaí rodando unificado na porta ${PORT}`);
  console.log(`Aplicação Web: http://localhost:${PORT}`);
  console.log(`API de fretes: http://localhost:${PORT}/api/fretes`);
});

