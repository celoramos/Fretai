# Fretaí: front-end

PWA em React + Vite + TypeScript que consome a API deste repositório. O motorista usa no celular, com tema escuro por padrão. A empresa usa no computador, com tema claro por padrão.

## Rodar

```bash
npm install
npm run demo   # sem backend: dados de exemplo em memória
npm run dev    # com a API em http://localhost:8080 (docker compose up na raiz)
```

No modo demo a senha é `demo123`, com `motorista@demo.fretai` ou `empresa@demo.fretai`. A tela de login tem botões que preenchem esses dados.

No `npm run dev`, o Vite repassa `/api` para a API, então o backend não precisa de CORS. Para apontar para outra API, defina `FRETAI_API`.

## O que já existe

| Tela | Endpoints |
|---|---|
| Entrar | `POST /api/auth/login`, `/refresh`, `/logout` |
| Motorista · Fretes perto de você (CEP ou GPS, raio 50/100/200 km) | `GET /api/fretes/busca`, `GET /api/empresas/{id}/perfil` |
| Motorista · Frete (detalhe, aceitar, proposta, andamento, iniciar viagem) | `GET /api/fretes/{id}`, `/eventos`, `/pagamento`, `POST /aceite`, `/propostas`, `/inicio`, `GET /api/motoristas/{id}/veiculos` |
| Motorista · Meus fretes | `GET /api/propostas/minhas` |
| Empresa · Fretes (filtros por situação) | `GET /api/fretes/empresa/{empresaId}` |
| Empresa · Frete (comparador de propostas, Pix, histórico) | `GET /api/fretes/{id}/propostas`, `POST /api/propostas/{id}/aceite`, `/recusa`, `POST /api/fretes/{id}/pagamento`, `GET /api/motoristas/{id}/perfil` |

Ainda não implementado: cadastros, publicar frete, carteira, perfil, canhoto digital, calculadora, avaliação, admin e contestação pública.

## Design

As decisões de design partem de `docs/briefing-design-figma.md`. Os valores ficam em `src/styles/tokens.css`, com o contraste de cada par calculado, e nenhuma regra fora desse arquivo digita cor, tamanho ou duração. As raízes, a rota escolhida e os desvios do briefing estão em `anti-slop-brief.md`.
