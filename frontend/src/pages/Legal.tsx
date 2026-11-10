import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Marca } from '../components/Marca'
import { useTitulo } from '../useTitulo'

/*
 * Privacidade e termos. Escritos a partir do que o código faz (campos do cadastro, migrações do
 * banco, serviços chamados pelo back-end). O que ninguém respondeu ainda aparece na página como
 * lacuna, em vez de ser inventado: razão social, contato, prazos de guarda, taxa.
 * Não é parecer jurídico: um advogado precisa revisar antes de publicar.
 */

/** Cada página tem a sua data: os termos prometem que ela muda quando o texto deles muda, não o da outra. */
const PRIVACIDADE_ATUALIZADA_EM = '10 de novembro de 2026'
const TERMOS_ATUALIZADOS_EM = '7 de novembro de 2026'

/** Fato que falta. Fica visível de propósito: a página não está pronta sem ele. */
function Lacuna({ children }: { children: ReactNode }) {
  return (
    <p className="legal__lacuna">
      <strong>Falta preencher:</strong> {children} Esta página não está completa sem isso.
    </p>
  )
}

function Pagina({ titulo, atualizadaEm, children }: { titulo: string; atualizadaEm: string; children: ReactNode }) {
  useTitulo(titulo)
  return (
    <div className="legal">
      <header className="legal__topo">
        <Link to="/" className="legal__marca" aria-label="Fretaí, página inicial"><Marca /></Link>
      </header>
      <main className="legal__texto" id="conteudo">
        <h1>{titulo}</h1>
        <p className="legal__data">Atualizada em {atualizadaEm}.</p>
        <p className="legal__rascunho">
          Rascunho escrito a partir do que o sistema faz hoje. Ainda precisa da revisão de um advogado.
        </p>
        {children}
      </main>
      <footer className="legal__rodape">
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos de uso</Link>
        <Link to="/">Início</Link>
      </footer>
    </div>
  )
}

export function Privacidade() {
  return (
    <Pagina titulo="Privacidade" atualizadaEm={PRIVACIDADE_ATUALIZADA_EM}>
      <section>
        <h2>Quem cuida dos seus dados</h2>
        <Lacuna>o nome da empresa que opera o Fretaí (razão social), o CNPJ e o endereço.</Lacuna>
        <Lacuna>o e-mail para pedidos sobre seus dados e o nome do encarregado (DPO).</Lacuna>
      </section>

      <section>
        <h2>O que a gente guarda e por quê</h2>
        <dl className="legal__lista">
          <div>
            <dt>Nome, CPF, e-mail e telefone</dt>
            <dd>Para criar sua conta, saber que é você e avisar sobre seus fretes. Base: execução do contrato (LGPD, art. 7, V).</dd>
          </div>
          <div>
            <dt>Senha</dt>
            <dd>Guardada só como código embaralhado (hash). Ninguém da equipe consegue ler.</dd>
          </div>
          <div>
            <dt>Conta Google, se você entrar com ela</dt>
            <dd>O Google manda para a gente seu e-mail, seu nome e um número que identifica sua conta. A gente não recebe sua senha do Google.</dd>
          </div>
          <div>
            <dt>Motorista: placa, RNTRC, tipo de caminhão, CNH, CRLV e chave Pix</dt>
            <dd>Para a empresa saber quem vai levar a carga, e para o dinheiro do frete cair na sua chave Pix. Base: execução do contrato.</dd>
          </div>
          <div>
            <dt>Empresa: CNPJ, razão social, nome fantasia e telefone</dt>
            <dd>Para o motorista saber com quem está negociando. Os dados do CNPJ são conferidos na base pública da Receita, pela BrasilAPI.</dd>
          </div>
          <div>
            <dt>Fotos da carga, se você mandar no pedido</dt>
            <dd>Até cinco fotos do que vai no veículo. Os motoristas que veem o pedido veem as fotos antes de aceitar, para decidir se o veículo leva. Base: execução do contrato.</dd>
          </div>
          <div>
            <dt>Seu e-mail, quando você pede uma senha nova</dt>
            <dd>Mandamos para ele um link que vale por pouco tempo e serve uma vez só. Base: execução do contrato e segurança.</dd>
          </div>
          <div>
            <dt>Seu telefone para o outro lado do frete</dt>
            <dd>O motorista e quem contratou só recebem o telefone um do outro depois que o frete fecha, para combinar a coleta e a entrega pelo WhatsApp. Antes disso, ninguém vê. Endereço completo e quem recebe também só aparecem depois de fechar.</dd>
          </div>
          <div>
            <dt>Sua localização, quando você toca em "Usar minha localização"</dt>
            <dd>Só para mostrar fretes perto de você. O navegador pede sua permissão antes.</dd>
          </div>
          <div>
            <dt>No canhoto: foto, assinatura, nome de quem recebeu e o GPS</dt>
            <dd>Para provar que a carga chegou ao destino (a até 500 m do endereço) e liberar o saldo do motorista. Base: execução do contrato e exercício de direitos.</dd>
          </div>
          <div>
            <dt>Quem abriu cada documento, quando e de qual endereço de internet (IP)</dt>
            <dd>Para saber quem viu CNH, CRLV e comprovantes, e investigar acesso indevido. Base: legítimo interesse e segurança.</dd>
          </div>
          <div>
            <dt>Fretes, propostas, pagamentos e avaliações</dt>
            <dd>É o próprio serviço: o histórico de cada frete e a reputação dos dois lados.</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Quem mais recebe</h2>
        <ul className="legal__itens">
          <li><strong>Asaas</strong> (pagamentos): nome e CPF ou CNPJ de quem paga, e a chave Pix de quem recebe.</li>
          <li><strong>Google</strong>: só se você escolher entrar com o Google.</li>
          <li><strong>WhatsApp (Meta)</strong>: seu telefone, para os avisos de frete, quando os avisos estiverem ligados.</li>
          <li><strong>Armazenamento de arquivos</strong> (S3 ou compatível): fotos de documentos e do canhoto.</li>
          <li><strong>BrasilAPI</strong>: o CNPJ da empresa, para buscar os dados públicos dela.</li>
        </ul>
        <Lacuna>onde o sistema fica hospedado e qual empresa guarda os arquivos.</Lacuna>
        <p>A gente não vende seus dados e não usa seus dados para treinar inteligência artificial.</p>
      </section>

      <section>
        <h2>Por quanto tempo</h2>
        <p>Você fica conectado por até 30 dias sem precisar entrar de novo. Ao sair, essa conexão é cancelada.</p>
        <Lacuna>por quanto tempo a conta, os fretes, os pagamentos, os documentos e as fotos do canhoto ficam guardados depois que o frete acaba ou a conta é fechada.</Lacuna>
      </section>

      <section>
        <h2>No seu navegador</h2>
        <p>
          O Fretaí guarda no seu navegador só o que precisa para funcionar: sua sessão e o tema (claro ou escuro).
          Não tem propaganda nem rastreamento de terceiros, e as fontes vêm do próprio Fretaí. A exceção é o botão
          "Entrar com Google", nas telas de entrar e de criar conta: ele é carregado do Google, que pode ler os cookies
          dele no seu navegador.
        </p>
      </section>

      <section>
        <h2>Seus direitos</h2>
        <p>Pela LGPD (art. 18), você pode pedir:</p>
        <ul className="legal__itens">
          <li>se a gente tem dados seus, e uma cópia deles;</li>
          <li>correção do que estiver errado;</li>
          <li>que dados desnecessários sejam apagados ou anonimizados;</li>
          <li>levar seus dados para outro serviço;</li>
          <li>saber com quem seus dados foram compartilhados;</li>
          <li>apagar seus dados e retirar o consentimento, quando o uso depender dele.</li>
        </ul>
        <p>
          Parte disso você mesmo corrige no app: o cliente muda o nome e o celular em Meus dados, o motorista muda o
          celular no Perfil e a empresa muda o nome fantasia e o telefone em Empresa.
        </p>
        <p>Você também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).</p>
        <Lacuna>o canal para fazer esses pedidos e em quantos dias a resposta chega.</Lacuna>
      </section>
    </Pagina>
  )
}

export function Termos() {
  return (
    <Pagina titulo="Termos de uso" atualizadaEm={TERMOS_ATUALIZADOS_EM}>
      <section>
        <h2>Quem oferece o serviço</h2>
        <Lacuna>o nome da empresa que opera o Fretaí (razão social), o CNPJ e o endereço.</Lacuna>
      </section>

      <section>
        <h2>O que o Fretaí faz</h2>
        <p>
          Liga empresas que têm carga a motoristas que levam. A empresa publica o frete, o motorista aceita ou faz uma
          proposta, e a empresa escolhe. O Fretaí não transporta nada: quem transporta é o motorista.
        </p>
      </section>

      <section>
        <h2>Como o dinheiro anda</h2>
        <ol className="legal__itens">
          <li>No aceite, a empresa paga o frete por Pix. O dinheiro fica guardado, e o motorista vê que está garantido antes de carregar.</li>
          <li>O adiantamento combinado é liberado quando o motorista sai com a carga.</li>
          <li>O saldo é liberado com o canhoto: foto, assinatura de quem recebeu e GPS a até 500 m do destino.</li>
          <li>Quem recebeu a carga tem um prazo para contestar a entrega. Com contestação, o saldo fica parado até a análise.</li>
        </ol>
        <p>Todo frete mostra o piso mínimo da ANTT para a rota. Proposta abaixo do piso aparece marcada.</p>
        <Lacuna>se o Fretaí cobra alguma taxa, de quem e quanto.</Lacuna>
      </section>

      <section>
        <h2>O que cada um precisa fazer</h2>
        <ul className="legal__itens">
          <li>Dar dados verdadeiros e manter a conta só sua. Não passe sua senha para ninguém.</li>
          <li>Motorista: ter CNH e documento do veículo válidos e levar a carga como combinado.</li>
          <li>Empresa: descrever a carga como ela é e pagar no aceite.</li>
          <li>Os dois: avaliar com honestidade. A reputação é o que dá confiança para o outro lado.</li>
        </ul>
        <p>Conta com dados falsos, golpe ou calote pode ser suspensa.</p>
      </section>

      <section>
        <h2>Fechar a conta</h2>
        <Lacuna>como pedir o fechamento da conta e o que acontece com fretes e pagamentos em andamento.</Lacuna>
      </section>

      <section>
        <h2>Limites</h2>
        <Lacuna>até onde vai a responsabilidade do Fretaí por carga, atraso e dano. Esta parte precisa ser escrita por um advogado.</Lacuna>
      </section>

      <section>
        <h2>Mudanças e lei</h2>
        <p>Quando estes termos mudarem, a data no topo muda.</p>
        <Lacuna>como quem já tem conta fica sabendo de uma mudança.</Lacuna>
        <Lacuna>a cidade do foro.</Lacuna>
        <p>Vale a lei brasileira.</p>
      </section>
    </Pagina>
  )
}
