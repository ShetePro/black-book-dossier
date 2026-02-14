import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const DECOY_PASSWORD_KEY = 'blackbook_decoy_password';

export const checkBiometricSupport = async (): Promise<{
  available: boolean;
  biometrics: LocalAuthentication.SecurityLevel;
}> => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!compatible || !enrolled) {
    return { available: false, biometrics: LocalAuthentication.SecurityLevel.NONE };
  }
  
  const biometrics = await LocalAuthentication.getEnrolledLevelAsync();
  return { available: true, biometrics };
};

export const authenticateWithBiometrics = async (
  promptMessage: string = '验证身份以访问 Black Book'
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: '使用密码',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
};

export const setDecoyPassword = async (password: string): Promise<void> => {
  await SecureStore.setItemAsync(DECOY_PASSWORD_KEY, password);
};

export const getDecoyPassword = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(DECOY_PASSWORD_KEY);
};

export const verifyPassword = async (input: string): Promise<'valid' | 'decoy' | 'invalid'> => {
  const decoyPassword = await getDecoyPassword();
  
  if (decoyPassword && input === decoyPassword) {
    return 'decoy';
  }
  
  return 'valid';
};
