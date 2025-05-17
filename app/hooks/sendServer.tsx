import {fetch} from 'react-native-ssl-pinning';

export const sendPublicKeyToServer = async (
  token: string,
  publicKey: string,
) => {
  try {
    const response = await fetch('https://192.168.1.100/auth/validate', {
      method: 'POST',
      timeoutInterval: 10000,
      sslPinning: {
        certs: ['cloudblock'],
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify({key: publicKey}),
    });

    if (!response.status) {
      const errorData = await response.text();
      throw new Error(errorData || 'Error al enviar la clave pública');
    }

    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error al enviar la clave al servidor:', error.message);
    }
    throw error;
  }
};
