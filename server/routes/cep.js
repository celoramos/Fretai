const express = require("express");
const router = express.Router();

router.get("/:cep", async (req, res) => {
  try {
    const rawCep = req.params.cep || "";
    const cleanCep = rawCep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return res.status(400).json({
        valido: false,
        erro: "CEP inválido. O CEP deve conter exatamente 8 dígitos numéricos."
      });
    }

    if (/^(\d)\1{7}$/.test(cleanCep)) {
      return res.status(400).json({
        valido: false,
        erro: "CEP inválido. Sequência numérica repetida não permitida."
      });
    }

    const viaCepUrl = `https://viacep.com.br/ws/${cleanCep}/json/`;
    const response = await fetch(viaCepUrl);

    if (!response.ok) {
      return res.status(502).json({
        valido: false,
        erro: "Falha ao se comunicar com o serviço ViaCEP."
      });
    }

    const data = await response.json();

    if (data.erro) {
      return res.status(404).json({
        valido: false,
        erro: "CEP não encontrado na base de dados do ViaCEP."
      });
    }

    return res.json({
      valido: true,
      cep: data.cep,
      logradouro: data.logradouro || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
      ibge: data.ibge || "",
      ddd: data.ddd || ""
    });
  } catch (err) {
    return res.status(500).json({
      valido: false,
      erro: "Erro interno no servidor ao consultar o CEP."
    });
  }
});

module.exports = router;
