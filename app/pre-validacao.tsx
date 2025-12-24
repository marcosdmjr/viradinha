import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';

export default function PreValidacaoScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const [firstName, setFirstName] = useState('');

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    if (params.userData) {
      try {
        const data = JSON.parse(params.userData as string);
        if (data && data.nome) {
          const name = data.nome.split(' ')[0];
          setFirstName(name);
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

  const handleValidation = () => {
    router.push({
      pathname: '/confirmacao-seguranca-1',
      params: { userData: params.userData }
    });
  };

  return (
    <LinearGradient
      colors={['#0066b3', '#4db8a8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.mainContent, animatedStyle]}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo-caixa.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.greeting}>Olá {firstName}</Text>

            <View style={styles.divider} />

            <Text style={styles.cardTitle}>O que acontece a seguir?</Text>

            <Text style={styles.cardDescription}>
              Você passará por uma validação de identidade na próxima etapa.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle size={20} color="#0066b3" strokeWidth={2.5} />
                <Text style={styles.featureText}>Perguntas de segurança</Text>
              </View>

              <View style={styles.featureItem}>
                <CheckCircle size={20} color="#0066b3" strokeWidth={2.5} />
                <Text style={styles.featureText}>Processo rápido</Text>
              </View>

              <View style={styles.featureItem}>
                <CheckCircle size={20} color="#0066b3" strokeWidth={2.5} />
                <Text style={styles.featureText}>Totalmente seguro</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.validateButton}
            onPress={handleValidation}
            activeOpacity={0.9}
          >
            <Text style={styles.validateButtonText}>Validar Identidade</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mainContent: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0066b3',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0066b3',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  validateButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
