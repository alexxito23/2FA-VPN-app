import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {pick} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome5';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNSimpleOpenvpn from 'react-native-simple-openvpn';
import {useAtom} from 'jotai';
import {useVPNConnection} from '../hooks/vpnService';
import {vpnFile} from '../hooks/useVPN';

interface VpnProfile {
  name: string;
  user: string;
  password: string;
  path: string;
}

const VPNProfilesScreen = () => {
  const [profiles, setProfiles] = useState<VpnProfile[]>([]);
  const [file, setFile] = useAtom(vpnFile); // Usar el atom para gestionar el perfil activo
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const {getVPNState} = useVPNConnection();

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const storedProfiles = await AsyncStorage.getItem('vpnProfiles');
        if (storedProfiles) {
          setProfiles(JSON.parse(storedProfiles));
        }
      } catch (error) {
        console.log('Error cargando perfiles: ', error);
      }
    };

    loadProfiles();
  }, []);

  const saveProfilesToStorage = async (profiles: VpnProfile[]) => {
    try {
      await AsyncStorage.setItem('vpnProfiles', JSON.stringify(profiles));
    } catch (error) {
      console.log('Error guardando perfiles: ', error);
    }
  };

  const handleFilePick = async () => {
    try {
      const [result] = await pick({type: ['application/*']});

      if (!result?.name?.toLowerCase().endsWith('.ovpn')) {
        Alert.alert('Archivo inválido', 'Solo se permiten archivos .ovpn');
        return;
      }

      const fileName = result.name.replace('.ovpn', '');
      const alreadyExists = profiles.some(p => p.name === fileName);

      if (alreadyExists) {
        Alert.alert('Ya existe', 'Este perfil ya fue agregado.');
        return;
      }

      setPendingFile(result);
      setIsModalVisible(true);
    } catch (err: any) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.log(err);
        Alert.alert('Error', 'No se pudo importar el archivo');
      }
    }
  };

  const handleUserPasswordSubmit = async () => {
    if (!user || !password || !pendingFile) {
      Alert.alert('Error', 'Faltan campos o archivo');
      return;
    }

    try {
      const fileName = pendingFile.name;
      const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.copyFile(pendingFile.uri, destPath);

      const newProfile: VpnProfile = {
        name: fileName.replace('.ovpn', ''),
        user: user,
        password: password,
        path: destPath,
      };

      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);

      setUser('');
      setPassword('');
      setIsModalVisible(false);
      setPendingFile(null);
    } catch (err: any) {
      console.log(err);
      Alert.alert('Error', 'No se pudo importar el archivo');
    }
  };

  const handleVPNConnect = async (profile: VpnProfile) => {
    const state = await getVPNState();
    const isConnected = state === 2;

    if (file?.name === profile.name && isConnected) {
      RNSimpleOpenvpn.disconnect();
      setFile(null);
    } else {
      setFile(profile);
    }
  };

  const handleDeleteProfile = async (profileName: string) => {
    const state = await getVPNState();
    const isConnected = state === 2;

    if (isConnected && file?.name === profileName) {
      Alert.alert('VPN activa', 'No puedes eliminar una VPN activa.');
      return;
    }

    Alert.alert(
      'Eliminar perfil',
      '¿Estás seguro de que deseas eliminar este perfil?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedProfiles = profiles.filter(
              p => p.name !== profileName,
            );
            setProfiles(updatedProfiles);
            await saveProfilesToStorage(updatedProfiles);

            // Si el perfil eliminado es el perfil activo, lo eliminamos también de Jotai
            if (file?.name === profileName) {
              setFile(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-[#181621]">
      <View className="flex-row justify-between items-center p-5">
        <Text className="text-white text-2xl font-bold">PERFILES</Text>
        <Icon name="search" size={24} color="#fff" />
      </View>

      <ScrollView className="px-5 pb-[100px]">
        {profiles.map((profile, index) => (
          <View
            key={index}
            className="bg-[#2a2736] rounded-2xl p-5 flex-row items-center justify-between mb-5">
            <TouchableOpacity
              className="flex-row items-center flex-1"
              onPress={() => handleVPNConnect(profile)}>
              <View className="mr-4 relative">
                <FAIcon name="shield-alt" size={28} color="#3fd2c7" />
                <View className="absolute -bottom-1 -right-1 bg-white px-1 py-[1px] rounded">
                  <Text className="text-xs font-bold text-black">2FA</Text>
                </View>
              </View>
              <View>
                <Text className="text-[#9f82ff] font-bold text-base">
                  {profile.name}
                </Text>
                <Text className="text-gray-400 text-sm">{profile.user}</Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Archivo: {profile.path.split('/').pop()}
                </Text>
              </View>
              <View className="ml-auto">
                {file?.name === profile.name ? (
                  <MIcon name="radio-button-on" size={24} color="#00ffcc" />
                ) : (
                  <MIcon name="radio-button-off" size={24} color="#FF5A5F" />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="ml-4"
              onPress={() => handleDeleteProfile(profile.name)}>
              <MIcon name="delete" size={24} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        className="bg-[#2a2736] rounded-2xl p-5 flex-row items-center mx-5 mb-5"
        onPress={handleFilePick}>
        <MIcon name="upload-file" size={28} color="#9f82ff" />
        <View className="ml-2">
          <Text className="text-white font-bold text-base">
            SUBIR FICHERO .OVPN
          </Text>
          <Text className="text-gray-400 text-xs">SELECCIONA FICHERO</Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-5 rounded-xl w-4/5">
            <Text className="text-lg font-bold text-center mb-5">
              Ingrese usuario y contraseña
            </Text>
            <TextInput
              className="h-10 border border-gray-300 rounded mb-4 px-2"
              placeholder="Usuario"
              value={user}
              onChangeText={setUser}
            />
            <TextInput
              className="h-10 border border-gray-300 rounded mb-4 px-2"
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              className="bg-green-600 p-2 rounded mb-2 items-center"
              onPress={handleUserPasswordSubmit}>
              <Text className="text-white font-bold">Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 p-2 rounded items-center"
              onPress={() => setIsModalVisible(false)}>
              <Text className="text-white font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VPNProfilesScreen;
