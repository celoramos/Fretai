const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const Frete = require("./models/frete");

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

app.use(mongoSanitize());

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../src/pages")));
app.use("/styles", express.static(path.join(__dirname, "../src/styles")));
app.use("/scripts", express.static(path.join(__dirname, "../src/scripts")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERRO: MONGODB_URI não encontrada nas variáveis de ambiente (.env)!");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas com sucesso!"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB Atlas:", err.message));
}

setInterval(async () => {
  try {
    const CINCO_MINUTOS_MS = 5 * 60 * 1000;
    const limite = new Date(Date.now() - CINCO_MINUTOS_MS);

    const resultado = await Frete.deleteMany({
      $or: [
        { status: "aceito", dataAceite: { $lte: limite } },
        { status: "entregue", dataEntrega: { $lte: limite } }
      ]
    });

    if (resultado.deletedCount > 0) {
      console.log(`Limpeza MongoDB: ${resultado.deletedCount} frete(s) expirado(s) removido(s).`);
    }
  } catch (err) {
    console.error("Erro na rotina de limpeza do MongoDB:", err.message);
  }
}, 60000);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/fretes", require("./routes/fretes"));
app.use("/api/motoristas", require("./routes/motoristas"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/pages/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Fretaí rodando unificado na porta ${PORT}`);
  console.log(`Aplicação Web: http://localhost:${PORT}`);
  console.log(`API MongoDB: http://localhost:${PORT}/api/fretes`);
});

