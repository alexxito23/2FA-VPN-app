export const sendPublicKeyToServer = async (
  token: string,
  publicKey: string,
) => {
  try {
    const response = await fetch('http://192.168.1.39/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify({key: publicKey}),
    });

    if (!response.ok) {
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
