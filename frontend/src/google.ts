import { MODO_DEMO } from './api/cliente'

/** Client ID OAuth do Google (VITE_GOOGLE_CLIENT_ID). Sem ele, o login com Google só existe no modo demo. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
export const GOOGLE_DISPONIVEL = Boolean(GOOGLE_CLIENT_ID) || MODO_DEMO
