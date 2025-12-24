import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { useEffect } from 'react';
import { User } from 'lucide-react-native';

export default function VerificandoPagamentoScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();

  const betId = params.betId ? String(params.betId) : '';
  const amount = params.amount ? String(params.amount) : '0,00';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/pagamento-falhou',
        params: { betId, amount },
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [betId, amount]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Image
          source={require('@/assets/images/logo-cx-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.userIconContainer}>
          <User size={20} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005da8" />
          <Text style={styles.loadingTitle}>Verificando Pagamento</Text>
          <Text style={styles.loadingText}>
            Aguarde enquanto verificamos o status do seu pagamento...
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#005da8',
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  logo: {
    width: 120,
    height: 60,
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
  },
  userIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 22,
  },
});
