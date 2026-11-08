import type { Papel } from './api/tipos'

/** Onde cada papel começa depois de entrar. Cliente pessoa física ainda não tem tela no app. */
export const INICIO: Partial<Record<Papel, string>> = { MOTORISTA: '/motorista', EMPRESA: '/empresa', ADMIN: '/admin' }
