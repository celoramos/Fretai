const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { removeExpiredFretes } = require("./data/store");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:3000", "https://api.whatsapp.com", "https://viacep.com.br"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Limite global de requisições
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas requisições originadas deste IP. Tente novamente mais tarde." }
});
app.use(limiter);

// Limite estrito de segurança para autenticação (proteção contra brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login/cadastro deste IP. Tente novamente após 15 minutos." }
});
app.use("/api/auth/", authLimiter);

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
app.use("/api/cep", require("./routes/cep"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/pages/login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Fretaí rodando unificado na porta ${PORT}`);
  console.log(`Aplicação Web: http://localhost:${PORT}`);
  console.log(`API de fretes: http://localhost:${PORT}/api/fretes`);
});

