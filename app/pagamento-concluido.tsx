import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, ImageBackground } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { Menu, User, CheckCircle, Calendar, Hash, Users, DollarSign } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getBetWithDetails } from '@/services/supabaseService';
import { facebookPixel } from '@/services/facebookPixel';

interface BetDetails {
  id: string;
  user_name: string;
  user_cpf: string;
  user_email: string;
  user_birthdate: string;
  contest_number: string;
  quota: string;
  amount: number;
  status: string;
  created_at: string;
  payments: Array<{
    transaction_id: string;
    amount: number;
    paid_at: string;
    status: string;
  }>;
  bet_numbers: Array<{
    numbers: number[];
    game_type: string;
  }>;
}

const formatCpf = (cpf: string) => {
  if (!cpf) return '';
  const numericOnly = cpf.replace(/[^0-9]/g, '');
  if (numericOnly.length !== 11) return cpf;
  return `${numericOnly.slice(0, 3)}.${numericOnly.slice(3, 6)}.${numericOnly.slice(6, 9)}-${numericOnly.slice(9, 11)}`;
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const formatAmount = (amount: number) => {
  return amount.toFixed(2).replace('.', ',');
};

export default function PagamentoConcluido() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const [betDetails, setBetDetails] = useState<BetDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const betId = params.betId ? String(params.betId) : '';

  useEffect(() => {
    loadBetDetails();
    facebookPixel.trackPageView('Pagamento Concluído');
  }, [betId]);

  const loadBetDetails = async () => {
    if (!betId) {
      setError('ID da aposta não encontrado');
      setIsLoading(false);
      return;
    }

    try {
      const data = await getBetWithDetails(betId);

      if (!data) {
        setError('Aposta não encontrada');
        return;
      }

      setBetDetails(data);

      const payment = data.payments && data.payments[0];
      if (payment) {
        facebookPixel.trackPurchase(payment.amount, 'BRL');
        facebookPixel.trackCustomEvent('PaymentCompleted', {
          transactionId: payment.transaction_id,
          amount: payment.amount,
          contestNumber: data.contest_number,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError('Erro ao carregar informações da aposta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo-cx-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005da8" />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      </View>
    );
  }

  if (error || !betDetails) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo-cx-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Erro ao carregar dados'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/inicio')}
          >
            <Text style={styles.backButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const payment = betDetails.payments && betDetails.payments[0];
  const betNumbers = betDetails.bet_numbers && betDetails.bet_numbers[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push('/inicio')}
        >
          <Menu size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Image
          source={require('@/assets/images/logo-cx-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.userButton}>
          <View style={styles.userIconContainer}>
            <User size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.successBanner}>
          <CheckCircle size={64} color="#10b981" />
          <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
          <Text style={styles.successSubtitle}>
            Sua aposta foi registrada com sucesso
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Apostador</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{betDetails.user_name.toUpperCase()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CPF:</Text>
            <Text style={styles.infoValue}>{formatCpf(betDetails.user_cpf)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data de Nascimento:</Text>
            <Text style={styles.infoValue}>{betDetails.user_birthdate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <ImageBackground
            source={require('@/assets/images/bg_bolao_mega_sena_virada.png')}
            style={styles.bolaoHeader}
            imageStyle={styles.bolaoHeaderImage}
          >
            <Text style={styles.bolaoHeaderText}>bolão mega da virada</Text>
          </ImageBackground>

          <Text style={styles.sectionTitle}>Composição do Bolão</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Hash size={20} color="#005da8" />
              <Text style={styles.detailCardTitle}>Concurso</Text>
            </View>
            <Text style={styles.detailCardValue}>{betDetails.contest_number}</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Users size={20} color="#005da8" />
              <Text style={styles.detailCardTitle}>Cota</Text>
            </View>
            <Text style={styles.detailCardValue}>{betDetails.quota}</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <DollarSign size={20} color="#005da8" />
              <Text style={styles.detailCardTitle}>Valor</Text>
            </View>
            <Text style={styles.detailCardValue}>R$ {formatAmount(betDetails.amount)}</Text>
          </View>

          {payment && (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Calendar size={20} color="#005da8" />
                <Text style={styles.detailCardTitle}>Data do Pagamento</Text>
              </View>
              <Text style={styles.detailCardValue}>
                {formatDate(payment.paid_at)}
              </Text>
            </View>
          )}
        </View>

        {betNumbers && betNumbers.numbers && betNumbers.numbers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Números Apostados</Text>
            <Text style={styles.numbersSubtitle}>
              {betNumbers.numbers.length} números selecionados
            </Text>

            <View style={styles.numbersGrid}>
              {betNumbers.numbers.map((number, index) => (
                <View key={index} style={styles.numberBall}>
                  <Text style={styles.numberText}>
                    {number.toString().padStart(2, '0')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {payment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Pagamento</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID da Transação:</Text>
              <Text style={[styles.infoValue, styles.transactionId]}>
                {payment.transaction_id}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.statusText}>PAGO</Text>
            </View>
          </View>
        )}

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Importante!</Text>
          <Text style={styles.warningText}>
            Guarde este comprovante. Você receberá um email com os detalhes da sua aposta.
          </Text>
          <Text style={styles.warningText}>
            O sorteio será realizado na data do concurso. Boa sorte!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/inicio')}
        >
          <Text style={styles.homeButtonText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </ScrollView>
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
  menuButton: {
    padding: 8,
  },
  logo: {
    width: 120,
    height: 60,
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
  },
  userButton: {
    padding: 8,
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#dc2626',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#005da8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  successBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'CaixaSTD-Bold',
    color: '#10b981',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#2d3748',
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
  },
  bolaoHeader: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bolaoHeaderImage: {
    borderRadius: 8,
  },
  bolaoHeaderText: {
    fontSize: 20,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  detailCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#005da8',
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailCardTitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  detailCardValue: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
  },
  numbersSubtitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    marginBottom: 16,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  numberBall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#005da8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  numberText: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#10b981',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#92400e',
    lineHeight: 20,
    marginBottom: 8,
  },
  homeButton: {
    backgroundColor: '#005da8',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 40,
  },
  homeButtonText: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
});
