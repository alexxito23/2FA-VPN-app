import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNSimpleOpenvpn from 'react-native-simple-openvpn';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useVPNConnection} from '../hooks/vpnService';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import ReactNativeBiometrics from 'react-native-biometrics';
import {sendPublicKeyToServer} from '../hooks/sendServer';

const MAPPING = {
  ES: {name: 'España', x: -50, y: 85},
  FR: {name: 'Francia', x: 10, y: 15},
} as const;

export type MarkerCoordinates = keyof typeof MAPPING;

const VPNScreen = () => {
  const [selectedLocation, setSelectedLocation] =
    useState<MarkerCoordinates>('ES');
  const markerCoordinates = MAPPING[selectedLocation as keyof typeof MAPPING];
  const [vpnState, setVpnState] = useState<number | null>(2); // cambiar por null
  const [connecting, setConnecting] = useState<boolean>(false);
  const [scanningQR, setScanningQR] = useState<boolean>(false);
  const [token, setToken] = useState<string | undefined>(undefined);

  const {connectVPN, disconnectVPN} = useVPNConnection();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (codes.length > 0 && codes[0].type === 'qr') {
        console.log('QR Scanned: ', codes[0].value);
        const value = codes[0].value;
        if (value && value.startsWith('token=')) {
          const extractedToken = value.split('=')[1];
          setToken(extractedToken);
          setScanningQR(false);
        } else {
          Alert.alert(
            'QR inválido',
            'El QR escaneado no contiene un token válido',
          );
        }
      } else {
        Alert.alert('No se pudo escanear el QR');
      }
    },
  });

  const rnBiometrics = new ReactNativeBiometrics();

  /*   useEffect(() => {
    const checkVpnState = async () => {
      try {
        const state = await RNSimpleOpenvpn.getCurrentState();
        setVpnState(state);
        setSelectedLocation('FR');
      } catch (error) {
        console.error('Error obteniendo el estado del VPN', error);
        setVpnState(null);
      }
    };

    checkVpnState();
    const interval = setInterval(checkVpnState, 100);
    return () => clearInterval(interval);
  }, []); */

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [scaleAnim]);

  const handleConnectToggle = async () => {
    if (connecting) return;
    setConnecting(true);

    if (vpnState === 2) {
      await disconnectVPN();
    } else {
      await connectVPN();
    }

    const state = await RNSimpleOpenvpn.getCurrentState();
    setVpnState(state);
    setConnecting(false);
  };

  const handleStartQRScan = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    setScanningQR(true);
  };

  const handleFingerprint = async () => {
    try {
      const {available} = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert('Biometría no disponible');
        return;
      }

      const result = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirma con tu huella digital',
        cancelButtonText: 'Cancelar',
      });

      if (result.success) {
        Alert.alert('Autenticado', 'Huella verificada correctamente');
        rnBiometrics.createKeys().then(async resultObject => {
          const {publicKey} = resultObject;
          if (token) {
            try {
              await sendPublicKeyToServer(token, publicKey);
              Alert.alert('Éxito', 'Clave pública enviada correctamente');
            } catch (error) {
              console.error('Error enviando la clave:', error);
              Alert.alert('Error', 'No se pudo enviar la clave al servidor');
            }
          } else {
            Alert.alert(
              'Token no disponible',
              'Por favor escanea un QR primero',
            );
          }
        });
      } else {
        Alert.alert('Cancelado', 'No se autenticó');
      }
    } catch (error) {
      console.error('Error de biometría:', error);
      Alert.alert('Error', 'Ocurrió un error al autenticar');
    }
  };

  return (
    <LinearGradient
      colors={vpnState === 2 ? ['#2cffcc', '#1C1B23'] : ['#FF5A5F', '#1C1B23']}
      className="flex-1 items-center justify-between py-10">
      <View className="items-center z-10">
        <Text className="py-2 text-2xl text-white font-bold">
          {vpnState === 2 ? 'ESTÁS PROTEGIDO.' : 'NO ESTÁS PROTEGIDO.'}
        </Text>
      </View>

      <View className="relative items-center justify-center">
        <Image
          source={require('../../assets/map.png')}
          style={{
            position: 'absolute',
            width: 700,
            height: 530,
            bottom: -150,
            left: -210,
            opacity: 0.5,
          }}
        />
        <Animated.View
          style={{
            top: markerCoordinates.y,
            left: markerCoordinates.x,
            transform: [{scale: scaleAnim}],
          }}>
          <Icon
            name="radio-button-checked"
            size={30}
            color={vpnState === 2 ? '#2cffcc' : '#FF5A5F'}
          />
        </Animated.View>
      </View>

      <View className="w-[250] gap-4">
        <TouchableOpacity
          className="py-4 bg-[#0fab94] items-center rounded-[10]"
          onPress={handleConnectToggle}
          disabled={connecting}>
          <Text className="text-white text-base font-bold">
            {vpnState === 2 ? 'DESCONECTAR' : 'CONECTAR'}
          </Text>
        </TouchableOpacity>

        {vpnState === 2 && (
          <View className="flex w-[250] items-center justify-center gap-4">
            <TouchableOpacity
              className="bg-[#413f4c] py-4 flex justify-center items-center rounded-[10] w-[250]"
              onPress={handleStartQRScan}>
              <Text className="text-white text-base font-bold">
                {token ? 'ESCANEAR OTRO QR' : 'ESCANEAR QR'}
              </Text>
            </TouchableOpacity>
            {token && (
              <TouchableOpacity
                className="flex justify-center items-center rounded-[10]"
                onPress={handleFingerprint}>
                <Icon name="fingerprint" size={50} color="#fff" />
              </TouchableOpacity>
            )}
            <Text className="text-white text-xs font-bold uppercase">
              {token
                ? 'Valida la huella para acceder'
                : 'Escanea el token del QR'}
            </Text>
          </View>
        )}
      </View>

      {scanningQR && device && (
        <View style={StyleSheet.absoluteFill}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={scanningQR}
            codeScanner={codeScanner}
          />
          <TouchableOpacity
            className="absolute bottom-8 self-center bg-black/25 p-3 rounded-lg"
            onPress={() => setScanningQR(false)}>
            <Text className="text-white">Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

export default VPNScreen;
