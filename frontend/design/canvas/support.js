/*
 * Runtime mínimo para abrir as telas do canvas no navegador, sem o runtime do Claude.
 * Serve de referência visual: com o modo demo rodando, abra
 * http://localhost:5173/design/canvas/<Tela>.dc.html e troque a etapa pela URL
 * (?etapa=PAGO, ?cenario=propostas, ?perfil=motorista).
 *
 * Faz só o que os arquivos exportados usam: DCLogic com state, props e setState; {{expr}} em texto
 * e atributos; <sc-if value>; <sc-for list as>; on*="{{fn}}" como listener. Não é o runtime
 * oficial: um detalhe de comportamento pode diferir, o layout e os textos não.
 */
(function () {
  'use strict'

  const BOOLEANOS = new Set(['disabled', 'checked', 'selected', 'hidden', 'readonly', 'required', 'open', 'multiple', 'autofocus'])
  const EXPR = /\{\{([\s\S]*?)\}\}/g
  const compiladas = new Map()

  function avaliar(expr, escopo) {
    let f = compiladas.get(expr)
    if (!f) {
      try {
        // `with` só funciona fora do modo estrito; o corpo de new Function não herda o 'use strict'.
        f = new Function('__e', 'with (__e) { return (' + expr + '); }')
      } catch (erro) {
        console.warn('[canvas] expressão que não compila:', JSON.stringify(expr), erro.message)
        f = () => undefined
      }
      compiladas.set(expr, f)
    }
    try {
      return f(escopo)
    } catch (erro) {
      console.warn('[canvas] expressão com erro:', expr, erro)
      return undefined
    }
  }

  /** Atributo inteiro numa expressão só devolve o valor cru (função, booleano); misturado com texto vira texto. */
  function resolver(texto, escopo) {
    // Uma expressão só: sem outro {{ ou }} no meio ("{{a}} · {{b}}" são duas, não uma).
    const unica = texto.match(/^\s*\{\{((?:(?!\{\{|\}\})[\s\S])*)\}\}\s*$/)
    if (unica) return avaliar(unica[1], escopo)
    return texto.replace(EXPR, (_, expr) => {
      const v = avaliar(expr, escopo)
      return v == null || v === false ? '' : String(v)
    })
  }

  class DCLogic {
    constructor(props) {
      this.props = props
      this.state = {}
    }
    setState(parcial) {
      const antes = this.state
      const novo = typeof parcial === 'function' ? parcial(antes, this.props) : parcial
      this.state = Object.assign({}, antes, novo)
      agendar(this, antes)
    }
    forceUpdate() {
      agendar(this, this.state)
    }
  }

  let pendente = null
  function agendar(instancia, estadoAnterior) {
    if (pendente) return
    pendente = Promise.resolve().then(() => {
      pendente = null
      desenhar(instancia)
      if (typeof instancia.componentDidUpdate === 'function') instancia.componentDidUpdate(instancia.props, estadoAnterior)
    })
  }

  function eventoDe(nome, el) {
    const tipo = nome.slice(2).toLowerCase()
    // Como no React: onChange de campo de texto dispara a cada tecla.
    if (tipo === 'change' && (el.localName === 'textarea' || (el.localName === 'input' && !/^(checkbox|radio|file)$/.test(el.type)))) return 'input'
    return tipo
  }

  function copiarAtributos(origem, destino, escopo) {
    for (const { name, value } of Array.from(origem.attributes)) {
      if (name.startsWith('hint-placeholder')) continue
      const v = value.includes('{{') ? resolver(value, escopo) : value
      if (name.startsWith('on') && value.includes('{{')) {
        if (typeof v === 'function') destino.addEventListener(eventoDe(name, destino), v)
        continue
      }
      if (BOOLEANOS.has(name) && value.includes('{{')) {
        if (v) destino.setAttribute(name, '')
        continue
      }
      if (v == null) continue
      destino.setAttribute(name, typeof v === 'boolean' ? String(v) : v)
    }
  }

  function renderizar(no, escopo, pai) {
    if (no.nodeType === Node.TEXT_NODE) {
      const v = no.nodeValue.includes('{{') ? resolver(no.nodeValue, escopo) : no.nodeValue
      pai.appendChild(document.createTextNode(v == null || v === false ? '' : String(v)))
      return
    }
    if (no.nodeType !== Node.ELEMENT_NODE) return
    const tag = no.localName
    if (tag === 'helmet') return
    if (tag === 'sc-if') {
      if (resolver(no.getAttribute('value') || '', escopo)) for (const f of Array.from(no.childNodes)) renderizar(f, escopo, pai)
      return
    }
    if (tag === 'sc-for') {
      const lista = resolver(no.getAttribute('list') || '', escopo) || []
      const nome = no.getAttribute('as') || 'item'
      Array.from(lista).forEach((item, indice) => {
        const filho = Object.create(escopo)
        filho[nome] = item
        filho.index = indice
        for (const f of Array.from(no.childNodes)) renderizar(f, filho, pai)
      })
      return
    }
    const el = document.createElementNS(no.namespaceURI, no.localName)
    copiarAtributos(no, el, escopo)
    for (const f of Array.from(no.childNodes)) renderizar(f, escopo, el)
    // value de select e o texto digitado só valem como propriedade.
    if ((tag === 'select' || tag === 'input' || tag === 'textarea') && no.getAttribute('value')) {
      const v = resolver(no.getAttribute('value'), escopo)
      if (v != null) queueMicrotask(() => { el.value = v })
    }
    if (tag === 'input' && no.getAttribute('checked') && no.getAttribute('checked').includes('{{')) {
      el.checked = Boolean(resolver(no.getAttribute('checked'), escopo))
    }
    pai.appendChild(el)
  }

  let raiz = null
  let modelo = []

  function desenhar(instancia) {
    const ativo = document.activeElement
    const foco = ativo && (ativo.id || ativo.getAttribute('name'))
    const cursor = ativo && typeof ativo.selectionStart === 'number' ? ativo.selectionStart : null

    const valores = instancia.renderVals() || {}
    const base = Object.create({ s: instancia.state, state: instancia.state, props: instancia.props })
    const escopo = Object.assign(base, valores)
    const fragmento = document.createDocumentFragment()
    for (const no of modelo) renderizar(no, escopo, fragmento)
    raiz.replaceChildren(fragmento)

    if (foco) {
      const de_novo = document.getElementById(foco) || raiz.querySelector(`[name="${foco}"]`)
      if (de_novo) {
        de_novo.focus()
        if (cursor != null && typeof de_novo.setSelectionRange === 'function') {
          try { de_novo.setSelectionRange(cursor, cursor) } catch { /* campos sem cursor (number, date) */ }
        }
      }
    }
  }

  function iniciar() {
    raiz = document.querySelector('x-dc')
    const script = document.querySelector('script[type="text/x-dc"]')
    if (!raiz || !script) return

    // O <helmet> (fontes e estilos) fica onde está; o resto vira modelo e sai da página.
    modelo = Array.from(raiz.childNodes).filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.localName === 'helmet'))
    for (const n of modelo) raiz.removeChild(n)
    const helmet = raiz.querySelector('helmet')
    if (helmet) document.head.append(...Array.from(helmet.childNodes))

    const definicao = JSON.parse(script.dataset.props || '{}')
    const url = new URLSearchParams(location.search)
    const props = {}
    for (const [chave, spec] of Object.entries(definicao)) {
      if (chave.startsWith('$')) continue
      props[chave] = url.has(chave) ? url.get(chave) : spec && spec.default
    }

    const Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic)
    const instancia = new Component(props)
    desenhar(instancia)
    if (typeof instancia.componentDidMount === 'function') instancia.componentDidMount()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar)
  else iniciar()
})()
