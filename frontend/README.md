# Fretaí: front-end

PWA em React + Vite + TypeScript que consome a API deste repositório. O motorista usa no celular, com tema escuro por padrão. A empresa usa no computador, com tema claro por padrão.

## Rodar

```bash
npm install
npm run demo   # sem backend: dados de exemplo em memória
npm run dev    # com a API em http://localhost:8080 (docker compose up na raiz)
```

No modo demo a senha é `demo123`, com `motorista@demo.fretai`, `empresa@demo.fretai`, `cliente@demo.fretai` ou `admin@demo.fretai`. A tela de login tem botões que preenchem esses dados.

No modo demo também dá para testar o Google: o botão "Entrar com Google (demonstração)" simula a conta `voce@gmail.com`. As contas criadas no demo ficam no `localStorage` do navegador.

O modo demo emula também os endpoints do redesign: consulta de CEP, fotos da carga, contato depois do aceite, senha nova por link (o e-mail vai para o `localStorage`), os dados do cliente e o Pix, que confirma na terceira consulta. O motorista de exemplo tem fretes em andamento, uma proposta aberta e três concluídos (dois pagos e um cancelado). As telas do canvas abrem em `http://localhost:5173/design/canvas/<Tela>.dc.html`.

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
| Criar conta (motorista, empresa ou cliente pessoa física, com senha ou com Google) | `POST /api/motoristas`, `POST /api/empresas`, `POST /api/clientes`, `GET /api/empresas/{cnpj}` |
| Motorista · Fretes perto (CEP ou GPS, raio 10/25/50 km; frete que o veículo não leva aparece apagado) | `GET /api/fretes/busca`, `GET /api/enderecos/cep/{cep}`, `GET /api/motoristas/{id}/veiculos`, `GET /api/empresas/{id}/perfil` |
| Motorista · Frete (fotos da carga, aceitar com o veículo que leva, propor e retirar, esperar o Pix, iniciar viagem, desistir com motivo, WhatsApp depois de fechar, fretes de volta, avaliar; fora da vitrine, diz o que aconteceu: cancelado e por quem, fechado com outro motorista, saldo a cair ou parado por contestação, pago com cada parcela) | `GET /api/fretes/{id}`, `/eventos`, `/pagamento`, `/fotos`, `/contato`, `/retorno`, `POST /aceite`, `/propostas`, `/inicio`, `/cancelamento`, `POST /api/propostas/{id}/retirada`, `/avaliacoes` |
| Motorista · Registrar entrega (foto, assinatura, localização; envio diz o que falta; nota para quem contratou) | `POST /api/fretes/{id}/canhoto` (multipart), `POST /api/fretes/{id}/avaliacoes` |
| Motorista · Meus fretes (a receber, recebido no mês pela data de cada parcela, três abas com o total, concluídos em tabela no computador) | `GET /api/propostas/minhas`, `GET /api/fretes/{id}`, `/pagamento`, `POST /api/propostas/{id}/retirada` |
| Motorista · Extrato (adiantamentos e saldos, a receber e recebidos por mês) | `GET /api/propostas/minhas`, `GET /api/fretes/{id}`, `GET /api/fretes/{id}/pagamento` |
| Motorista · Calculadora (conta no aparelho, com a volta vazio; piso ANTT opcional) | `POST /api/calculadora/frete` |
| Motorista · Perfil (contato, chave Pix com o tipo, veículos por tamanho e dados de caminhão, base por CEP e raio, feriado, documentos, tema e sair) | `GET`/`PUT /api/motoristas/{id}`, `PUT /chave-pix`, `PUT /base`, `PATCH /preferencias`, `POST`/`PUT`/`DELETE /api/motoristas/{id}/veiculos`, `GET /api/motoristas/{id}/perfil` |
| Empresa · Fretes (precisa de você, filtros por situação) | `GET /api/fretes/empresa/{empresaId}`, `GET /api/fretes/{id}/pagamento` |
| Empresa · Publicar e editar frete (editar só antes da primeira proposta) | `POST /api/fretes/empresa/{empresaId}`, `PUT /api/fretes/{id}`, `GET /api/calendario/verificacao` |
| Empresa · Frete (comparador de propostas, Pix, entrega com canhoto e contestação, avaliar o motorista, histórico, cancelar) | `GET /api/fretes/{id}/propostas`, `POST /api/propostas/{id}/aceite`, `/recusa`, `POST /api/fretes/{id}/pagamento`, `GET /api/fretes/{id}/canhoto`, `POST /canhoto/contestacao`, `/avaliacoes`, `/cancelamento`, `GET /api/motoristas/{id}/perfil` |
| Documentos do motorista (enviar CNH, CRLV e comprovantes; quem contratou abre por link temporário; o motorista vê quem abriu e o motivo de uma recusa) | `POST`/`GET /api/fretes/{id}/documentos` (multipart), `POST /api/documentos/{id}/link`, `GET /api/documentos/{id}/acessos` |
| Cliente · Início (atalhos do que levar, frete em andamento, anteriores que abrem com a nota dada e "Pedir de novo") | `GET /api/auth/eu`, `GET /api/fretes/cliente/{clienteId}`, `/propostas`, `/pagamento`, `/avaliacoes` |
| Cliente · Pedir frete (dois passos no celular, uma página no computador; CEP com bairro e cidade, tipo, peso em faixas, até 5 fotos, tamanho do veículo) | `POST /api/fretes`, `POST /api/fretes/{id}/fotos`, `GET /api/enderecos/cep/{cep}`, `GET /api/calendario/verificacao` |
| Cliente · Frete antes do Pix (procurando, propostas, aceitou; Pix com QR e copia e cola; cancelar com motivo) | `GET /api/fretes/{id}/propostas`, `POST /api/propostas/{id}/aceite`, `/recusa`, `POST`/`GET /api/fretes/{id}/pagamento`, `/cancelamento`, `GET /api/motoristas/{id}/perfil` |
| Cliente · Acompanhar (etapas, WhatsApp do motorista, canhoto e contestação, nota, cancelar antes da saída) | `GET /api/fretes/{id}/eventos`, `/contato`, `/canhoto`, `POST /canhoto/contestacao`, `/avaliacoes`, `/cancelamento` |
| Cliente · Meus dados (nome e celular; o e-mail aparece e não muda por ali), pelo menu da conta | `GET`/`PUT /api/clientes/{id}`, `GET /api/auth/eu` |
| Empresa · Pagamentos (Pix pagos, em garantia, a pagar, devolvidos, e o repasse de cada frete) | `GET /api/fretes/empresa/{empresaId}`, `GET /api/fretes/{id}/pagamento` |
| Empresa · Dados da empresa (como o motorista vê, nome fantasia e telefone, cadastro da Receita) | `GET`/`PUT /api/empresas/{id}`, `GET /api/empresas/{id}/perfil` |
| Administrador · Documentos para verificar (verificar ou recusar com motivo) | `GET /api/documentos/pendentes`, `POST /api/documentos/{id}/link`, `POST /api/documentos/{id}/verificacao`, `POST /api/documentos/{id}/recusa`, `GET /api/motoristas/{id}/perfil` |
| Administrador · Contestações (decidir com a prova da entrega ao lado) | `GET /api/canhotos/contestacoes`, `GET /api/fretes/{id}`, `/pagamento`, `POST /api/fretes/{id}/canhoto/resolucao` |
| Administrador · Piso ANTT (CCD e CC por carga e eixos) | `GET /api/piso-antt`, `PUT /api/piso-antt/{tipoCarga}/{eixos}` |
| Contestar entrega (pública, com o código do recebedor) | `POST /api/canhotos/contestacao` |
| Privacidade e termos de uso | nenhum |

Formulário preenchido pergunta antes de sair, seja por link do app, voltar do navegador ou fechar a aba.

## Testes

```bash
npm test
```

As contas que não dependem de tela ficam em módulos sem React e têm teste em `testes/`: o que já caiu para o motorista e o "recebido no mês" (`src/recebimentos.ts`), a conta da calculadora (`src/calculo.ts`), o link do WhatsApp (`src/whatsapp.ts`) e os formatos de telefone, peso, valor e contagem (`src/formato.ts`). Roda com o `node --test`, sem dependência nova; o Node executa o TypeScript direto, então precisa do Node 22.18 ou mais novo.

## Design

As decisões de design partem de `docs/briefing-design-figma.md`. Os valores ficam em `src/styles/tokens.css`, com o contraste de cada par calculado, e nenhuma regra fora desse arquivo digita cor, tamanho ou duração. As raízes, a rota escolhida e os desvios do briefing estão em `anti-slop-brief.md`.
