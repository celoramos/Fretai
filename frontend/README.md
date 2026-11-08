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
| Motorista · Frete (detalhe, aceitar, proposta, retirar a proposta, andamento, iniciar viagem, cancelar, fretes de volta, avaliar a empresa) | `GET /api/fretes/{id}`, `/eventos`, `/pagamento`, `/retorno`, `POST /aceite`, `/propostas`, `/inicio`, `/cancelamento`, `POST /api/propostas/{id}/retirada`, `GET`/`POST /api/fretes/{id}/avaliacoes`, `GET /api/motoristas/{id}/veiculos` |
| Motorista · Registrar entrega (foto, assinatura, GPS) | `POST /api/fretes/{id}/canhoto` (multipart) |
| Motorista · Meus fretes (com o resumo do dinheiro) | `GET /api/propostas/minhas`, `GET /api/fretes/{id}/pagamento` |
| Motorista · Calculadora ("esse frete paga a viagem?") | `POST /api/calculadora/frete` |
| Motorista · Perfil (chave Pix, caminhões, base dos avisos, feriado, contato) | `GET`/`PUT /api/motoristas/{id}`, `PUT /chave-pix`, `PUT /base`, `PATCH /preferencias`, `POST`/`DELETE /api/motoristas/{id}/veiculos`, `GET /api/motoristas/{id}/perfil` |
| Empresa · Fretes (precisa de você, filtros por situação) | `GET /api/fretes/empresa/{empresaId}`, `GET /api/fretes/{id}/pagamento` |
| Empresa · Publicar frete | `POST /api/fretes/empresa/{empresaId}`, `GET /api/calendario/verificacao` |
| Empresa · Frete (comparador de propostas, Pix, entrega com canhoto e contestação, avaliar o motorista, histórico, cancelar) | `GET /api/fretes/{id}/propostas`, `POST /api/propostas/{id}/aceite`, `/recusa`, `POST /api/fretes/{id}/pagamento`, `GET /api/fretes/{id}/canhoto`, `POST /canhoto/contestacao`, `/avaliacoes`, `/cancelamento`, `GET /api/motoristas/{id}/perfil` |
| Contestar entrega (pública, com o código do recebedor) | `POST /api/canhotos/contestacao` |
| Privacidade e termos de uso | nenhum |

Ainda não implementado: envio de documentos (CNH, CRLV) e o link para a empresa abrir, edição de frete publicado, dados da empresa, extrato completo de pagamentos e as telas do administrador (verificar documentos, resolver contestação, piso ANTT).

## Design

As decisões de design partem de `docs/briefing-design-figma.md`. Os valores ficam em `src/styles/tokens.css`, com o contraste de cada par calculado, e nenhuma regra fora desse arquivo digita cor, tamanho ou duração. As raízes, a rota escolhida e os desvios do briefing estão em `anti-slop-brief.md`.
