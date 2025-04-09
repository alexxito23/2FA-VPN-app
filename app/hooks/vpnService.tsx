import {useAtom} from 'jotai';
import RNSimpleOpenvpn from 'react-native-simple-openvpn';
import {Alert} from 'react-native';
import RNFS from 'react-native-fs';
import {logContent, vpnFile} from './useVPN';

export const useVPNConnection = () => {
  const [file] = useAtom(vpnFile); // Extraer solo el valor de vpnFile
  const [, setLog] = useAtom(logContent); // Usar el atom para gestionar el perfil activo

  const connectVPN = async () => {
    // Verificar que file no sea null antes de continuar
    if (!file || !file.path) {
      Alert.alert(
        'Error',
        'No se ha seleccionado un archivo de configuración de VPN.',
      );
      return false;
    }
    try {
      const vpnConfig = await RNFS.readFile(file.path);
      await RNSimpleOpenvpn.connect({
        ovpnString: vpnConfig,
        providerBundleIdentifier: 'com.projecto',
        username: file.user,
        password: file.password,
      });
      updateLog('VPN conectada exitosamente');
      return true;
    } catch (error) {
      updateLog(`Error conectando la VPN - ${error}`);
      Alert.alert('Error', 'No se pudo conectar al VPN.');
      return false;
    }
  };

  const disconnectVPN = async () => {
    try {
      // Desconectar del VPN
      await RNSimpleOpenvpn.disconnect();
      updateLog('VPN desconectada exitosamente');
      return true; // Indicamos que la desconexión fue exitosa
    } catch (error) {
      updateLog(`Error desconectando la VPN - ${error}`);
      Alert.alert('Error', 'No se pudo desconectar del VPN.');
      return false; // Si hubo un error, devolvemos false
    }
  };

  const getVPNState = async () => {
    try {
      const state = await RNSimpleOpenvpn.getCurrentState();
      return state; // Retornamos el estado actual de la VPN
    } catch (error) {
      updateLog(`Error obteniendo el estado de la VPN - ${error}`);
      return -1; // Si hay un error, devolvemos -1 (indicado como error)
    }
  };

  const getVPNStates = async () => {
    try {
      const states = RNSimpleOpenvpn.VpnState;
      return states; // Retornamos el estado actual de la VPN
    } catch (error) {
      updateLog(`Error obteniendo los estados de la VPN - ${error}`);
      return -1; // Si hay un error, devolvemos -1 (indicado como error)
    }
  };

  const updateLog = (newLog: any) => {
    const now = new Date().toLocaleTimeString();
    setLog(prevLog => `${prevLog}\n[${now}] ${newLog}`);
  };

  return {
    connectVPN,
    disconnectVPN,
    getVPNState,
    getVPNStates,
    updateLog,
  };
};
