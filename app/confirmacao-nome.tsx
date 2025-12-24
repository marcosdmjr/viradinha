import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfirmacaoNomeScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    if (params.userData) {
      try {
        const data = JSON.parse(params.userData as string);
        if (data) {
          setUserData(data);
          const nome = data.nome || data.name || data.nomeCompleto;
          if (nome) {
            setNomeCompleto(nome);
          }
        }
      } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
      }
    }

    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, [params]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleConfirm = async () => {
    try {
      if (userData) {
        await login(userData);
      }
      router.push({
        pathname: '/pre-validacao',
        params: { userData: params.userData }
      });
    } catch (error) {
      console.error('Erro ao salvar login:', error);
    }
  };

  const handleChangeData = () => {
    router.push('/login');
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
          </View>

          <Text style={styles.instruction}>
            Para continuar, confirme se o seu nome está correto.
          </Text>

          <Text style={styles.label}>Nome:</Text>

          <View style={styles.nameOption}>
            <View style={styles.radioSelected}>
              <View style={styles.radioInner} />
            </View>
            <Text style={styles.nameText}>{nomeCompleto}</Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmButtonText}>Sim, sou eu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changeButton}
            onPress={handleChangeData}
            activeOpacity={0.9}
          >
            <Text style={styles.changeButtonText}>Quero alterar meus dados</Text>
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
  },
  instruction: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Book',
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0066b3',
    marginBottom: 16,
  },
  nameOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 4,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066b3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066b3',
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#333',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
  },
  changeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
  },
});
