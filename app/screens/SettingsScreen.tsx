import React, {useEffect, useRef, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import RNSimpleOpenvpn from 'react-native-simple-openvpn';
import {useVPNConnection} from '../hooks/vpnService';
import {useAtom} from 'jotai';
import {logContent} from '../hooks/useVPN';

const VPNStatusScreen = () => {
  const [conected, setConected] = useState<boolean>(false);
  const [log] = useAtom(logContent);

  const logScrollView = useRef<ScrollView | null>(null); // Especificamos que logScrollView es un ScrollView o null

  const {getVPNState, getVPNStates, updateLog} = useVPNConnection();

  useEffect(() => {
    const checkVpnState = async () => {
      try {
        const state = await RNSimpleOpenvpn.getCurrentState();
        setConected(state === 2); // Asumiendo que 2 es el estado "conectado"
      } catch (error) {
        console.error('Error obteniendo el estado del VPN', error);
        setConected(false); // Si hay un error, consideramos que no está conectado
      }
    };

    checkVpnState();

    // Si deseas que se ejecute cada vez que haya un cambio en el estado de la VPN, puedes configurar un intervalo o escuchador de eventos (dependiendo de las capacidades de la librería).
  }, []);

  const handleCurrentState = async () => {
    const state = await getVPNState(); // Obtener el estado actual
    updateLog('Current State: ' + JSON.stringify(state));
  };

  const handleVPNState = async () => {
    const state = await getVPNStates(); // Obtener estados de la VPN
    updateLog(JSON.stringify(state, undefined, 2));
  };

  return (
    <View className="flex flex-1 bg-[#121212]">
      <Text className="font-bold text-2xl color-white mt-10 px-5">
        CONEXIÓN
      </Text>
      <View className="px-5 mt-4">
        <View className="bg-[#1e1e1e] my-2 p-3 flex flex-row justify-between rounded-lg">
          <Text className="font-bold text-lg color-white">ESTADO VPN:</Text>
          <Text className="font-bold text-lg color-white">
            {conected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
        <View className="bg-[#1e1e1e] my-2 p-3 flex flex-row justify-between rounded-lg">
          <Text className="font-bold text-lg color-white">PROTOCOLO:</Text>
          <Text className="font-bold text-lg color-white">OpenVPN</Text>
        </View>
        <View className="my-2 flex flex-row gap-4 items-center justify-center">
          <TouchableOpacity
            className="bg-[#1e1e1e] my-2 p-3 rounded-lg flex items-center w-[48%]"
            onPress={handleCurrentState}>
            <Text className="font-bold text-lg color-white">
              OBTENER ESTADO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#1e1e1e] my-2 p-3 rounded-lg flex items-center w-[48%]"
            onPress={handleVPNState}>
            <Text className="font-bold text-lg color-white">ESTADOS</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text className="font-bold text-2xl color-white mt-6 px-5">LOGS</Text>
      <View className="flex-1 w-[91%] border-[#0fab94] border-2 m-5 p-3 rounded-xl">
        <ScrollView
          className="flex-1"
          ref={logScrollView}
          onContentSizeChange={() => {
            if (logScrollView.current) {
              logScrollView.current.scrollToEnd({animated: true});
            }
          }}>
          <Text className="text-white">{log}</Text>
        </ScrollView>
      </View>
    </View>
  );
};

export default VPNStatusScreen;
