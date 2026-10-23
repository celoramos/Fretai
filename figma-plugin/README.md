# Plugin local: gerar as telas do Fretaí no Figma

Este plugin monta no arquivo do Figma as telas que faltam do briefing (`docs/briefing-design-figma.md`), os componentes complementares e o protótipo dos 5 fluxos. Ele roda dentro do Figma Desktop. Não usa a integração MCP, então não conta no limite de chamadas do plano Starter.

## Como rodar

1. Abra o arquivo do Fretaí no **Figma Desktop**. O navegador não roda plugins locais.
2. Menu **Plugins → Development → Import plugin from manifest…**
3. Escolha `figma-plugin/manifest.json` desta pasta.
4. Rode em **Plugins → Development → Fretaí — gerar telas**.
5. Espere a mensagem final, que mostra quantos blocos foram gerados e quantos avisos houve. Leva de 1 a 3 minutos.
6. Na página `03`, o quadro **"Relatório do plugin"** lista cada aviso. Se ele estiver verde, deu tudo certo.

## O que ele cria

- **`01 Sistema`**
  - Quadro "Componentes · complementares" com:
    - Campo (5 estados)
    - Segmentado SIM/NÃO/TANTO FAZ
    - Seletor de adiantamento
    - Área de assinatura
    - QR Code Pix
    - Toast
    - Skeleton
    - Estado vazio
    - Silhuetas dos 10 veículos
  - Frame `00 Capa`.
- **`02 Motorista · Mobile`**, seção "Gerado · Motorista":
  - Busca: mapa, filtros e estados de carregando, vazio e erro.
  - Detalhe do frete, com valor e "a combinar".
  - Enviar proposta.
  - Calculadora.
  - Meus fretes.
  - Frete em andamento: aguardando Pix e garantido.
  - Canhoto: 3 passos, erro de GPS e enviado.
  - Avaliar, Fretes de retorno, Carteira e Perfil.
- **`03 Empresa · Admin · Público`**
  - Seção "Gerado · Empresa":
    - Painel e Publicar frete.
    - Fretes em lista e quadro.
    - Abas do detalhe: Pagamento, Entrega, Documentos, Histórico e Avaliar.
    - Pagamentos e Perfil.
  - Seção "Gerado · Admin": documentos, contestações e tabela do piso ANTT.
  - Seção "Gerado · Público":
    - Landing desktop e mobile.
    - Escolha de perfil.
    - Cadastro do motorista em 3 passos, cadastro da empresa e login.
    - Contestação pública.
- **Protótipo:** 5 pontos de partida.
  - Na página 02: fluxos 1, 3 e 5.
  - Na página 03: fluxos 2 e 4.
  - Para ver, abra no modo Present.

Cada tela tem uma nota acima com o endpoint que a alimenta. Quando falta endpoint, a nota diz "precisa de API".

## Rodar de novo

O plugin pode rodar quantas vezes você quiser:

- As seções "Gerado · …", a capa e o relatório são apagados e refeitos.
- Os componentes complementares já criados são reaproveitados, e não duplicados.
- As 3 telas-vitrine e os componentes originais não são tocados.

## Editar o código

O código fica em `src/`, separado por área. Depois de editar, junte tudo de novo no `code.js`:

```sh
cat src/01-base.js src/02-componentes.js src/03-layout.js src/04-motorista.js src/05-empresa-admin.js src/06-publico-fluxos.js > code.js
```
