# Fretaí: front-end

PWA em React + Vite + TypeScript que consome a API deste repositório. O motorista usa no celular, com tema escuro por padrão. A empresa usa no computador, com tema claro por padrão.

## Rodar

```bash
npm install
npm run demo   # sem backend: dados de exemplo em memória
npm run dev    # com a API em http://localhost:8080 (docker compose up na raiz)
```

No modo demo a senha é `demo123`, com `motorista@demo.fretai` ou `empresa@demo.fretai`. A tela de login tem botões que preenchem esses dados.

No modo demo também dá para testar o Google: o botão "Entrar com Google (demonstração)" simula a conta `voce@gmail.com`. As contas criadas no demo ficam no `localStorage` do navegador.

### Login com Google de verdade

1. No Google Cloud Console, crie um "ID do cliente OAuth" do tipo **Aplicativo da Web** e adicione `http://localhost:5173` (e o domínio de produção) em **Origens JavaScript autorizadas**.
2. No front, defina `VITE_GOOGLE_CLIENT_ID` com esse ID (por exemplo num `.env.local`).
3. Na API, defina `FRETAI_GOOGLE_CLIENT_ID` com o mesmo ID. Ela confere a assinatura, o emissor e esse ID em cada credencial.

Sem o ID, o botão não aparece fora do modo demo, e a API responde 422 em `/api/auth/google`.

No `npm run dev`, o Vite repassa `/api` para a API, então o backend não precisa de CORS. Para apontar para outra API, defina `FRETAI_API`.

## O que já existe

| Tela | Endpoints |
|---|---|
| Entrar (e-mail e senha, ou Google) | `POST /api/auth/login`, `/google`, `/refresh`, `/logout` |
| Criar conta (motorista ou empresa, com senha ou com Google) | `POST /api/motoristas`, `POST /api/empresas`, `GET /api/empresas/{cnpj}` |
| Motorista · Fretes perto de você (CEP ou GPS, raio 50/100/200 km) | `GET /api/fretes/busca`, `GET /api/empresas/{id}/perfil` |
| Motorista · Frete (detalhe, aceitar, proposta, andamento, iniciar viagem) | `GET /api/fretes/{id}`, `/eventos`, `/pagamento`, `POST /aceite`, `/propostas`, `/inicio`, `GET /api/motoristas/{id}/veiculos` |
| Motorista · Meus fretes | `GET /api/propostas/minhas` |
| Empresa · Fretes (filtros por situação) | `GET /api/fretes/empresa/{empresaId}` |
| Empresa · Frete (comparador de propostas, Pix, histórico) | `GET /api/fretes/{id}/propostas`, `POST /api/propostas/{id}/aceite`, `/recusa`, `POST /api/fretes/{id}/pagamento`, `GET /api/motoristas/{id}/perfil` |

Ainda não implementado: publicar frete, carteira, perfil, canhoto digital, calculadora, avaliação, admin e contestação pública.

## Design

As decisões de design partem de `docs/briefing-design-figma.md`. Os valores ficam em `src/styles/tokens.css`, com o contraste de cada par calculado, e nenhuma regra fora desse arquivo digita cor, tamanho ou duração. As raízes, a rota escolhida e os desvios do briefing estão em `anti-slop-brief.md`.
