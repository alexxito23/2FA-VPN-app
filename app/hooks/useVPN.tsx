import {atom} from 'jotai';

// Define el tipo correcto para el archivo
interface VpnProfile {
  name: string;
  user: string;
  path: string;
  password: string;
}

// Define el átomo con el tipo apropiado
export const vpnFile = atom<VpnProfile | null>(null);
export const logContent = atom('');
