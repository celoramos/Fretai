import type { Papel } from './api/tipos'

/** Onde cada papel começa depois de entrar. Todo papel tem a sua: sem ela, o login voltaria para o próprio login. */
export const INICIO: Record<Papel, string> = { MOTORISTA: '/motorista', EMPRESA: '/empresa', CLIENTE: '/cliente', ADMIN: '/admin' }
