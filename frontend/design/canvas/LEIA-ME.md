# Canvas do Fretaí (referência de design)

As 25 telas do redesign do cliente e do motorista, exportadas do canvas de design do
Claude em 2026-11-09. O que implementar está em
`docs/superpowers/specs/2026-11-09-redesign-cliente-motorista-design.md`.

- Cada tela é um `.dc.html`: marcação com estilos inline dentro de `<x-dc>` e a lógica
  em `renderVals()` no `<script type="text/x-dc">` do fim do arquivo.
- `{{valor}}` vem de `renderVals()`, `<sc-if>` é condicional e `<sc-for>` é lista.
- O `data-props` do script lista as etapas que o canvas deixa ver (`etapa`, `cenario`).
- Telas com `-PC` são do computador; sem `-PC`, do celular (390×844).
- `canvas.json` é a organização do canvas (posição e título de cada tela).
- Servem de referência de layout, texto e comportamento. Não importar no app.
- `support.js` é um runtime mínimo, nosso, para abrir as telas no navegador sem o canvas: com
  `npm run demo` rodando, `http://localhost:5173/design/canvas/<Tela>.dc.html`, e a etapa
  pela URL (`?etapa=PAGO`, `?cenario=propostas`, `?perfil=motorista`).
