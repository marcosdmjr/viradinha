import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { Menu, User, Copy, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { facebookPixel } from '@/services/facebookPixel';
import { getPaymentStatus, subscribeToPaymentStatus } from '@/services/supabaseService';
import { usePayment } from '@/contexts/PaymentContext';

const parsePixPayload = (payload: string): string | null => {
  try {
    const index = payload.indexOf('59');
    if (index === -1) return null;

    const lengthStr = payload.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length)) return null;

    const receiverName = payload.substring(index + 4, index + 4 + length);
    return receiverName;
  } catch (error) {
    return null;
  }
};

export default function QRCodePixScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const { clearPixData } = usePayment();
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const pixPayload = params.pixPayload ? String(params.pixPayload) : '';
  const transactionId = params.transactionId ? String(params.transactionId) : '';
  const betId = params.betId ? String(params.betId) : '';
  const amount = params.amount ? String(params.amount) : '0,00';

  const amountNumber = parseFloat(amount.replace(',', '.'));
  const displayAmount = amount;

  const receiverName = parsePixPayload(pixPayload);

  useEffect(() => {
    facebookPixel.trackPageView('QRCode PIX');
    facebookPixel.trackInitiateCheckout(amountNumber);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert(
            'Tempo Esgotado',
            'O tempo para pagamento expirou. Por favor, gere um novo código PIX.',
            [
              {
                text: 'OK',
                onPress: () => {
                  clearPixData();
                  router.back();
                },
              },
            ]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearPixData();
    };
  }, []);

  useEffect(() => {
    if (!transactionId || !betId) {
      console.log('Missing transactionId or betId:', { transactionId, betId });
      return;
    }

    let pollInterval: NodeJS.Timeout;
    let hasRedirected = false;

    const handlePaymentConfirmed = (paymentBetId: string) => {
      if (hasRedirected) return;
      hasRedirected = true;

      console.log('✅ PAGAMENTO CONFIRMADO! Redirecionando...', paymentBetId);
      setIsCheckingPayment(true);

      if (pollInterval) {
        clearInterval(pollInterval);
      }

      setTimeout(() => {
        router.replace({
          pathname: '/comprovante-pagamento',
          params: {
            betId: paymentBetId,
            transactionId: transactionId,
            amount: amount,
          },
        });
      }, 500);
    };

    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 Verificando status do pagamento...', { transactionId, timestamp: new Date().toISOString() });
        const payment = await getPaymentStatus(transactionId);

        console.log('📊 Dados do pagamento:', {
          status: payment?.status,
          bet_id: payment?.bet_id,
          paid_at: payment?.paid_at,
          transaction_id: payment?.transaction_id
        });

        if (payment && payment.status === 'completed') {
          console.log('✅ Status COMPLETED detectado! Iniciando redirecionamento...');
          handlePaymentConfirmed(payment.bet_id);
        } else {
          console.log('⏳ Pagamento ainda pendente, aguardando...');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
      }
    };

    checkPaymentStatus();

    pollInterval = setInterval(checkPaymentStatus, 5000);

    const subscription = subscribeToPaymentStatus(transactionId, (payload) => {
      console.log('🔔 Realtime update recebido:', {
        event: payload.eventType,
        old: payload.old?.status,
        new: payload.new?.status,
        timestamp: new Date().toISOString()
      });
      const newPayment = payload.new;

      if (newPayment && newPayment.status === 'completed') {
        console.log('✅ Realtime: Status COMPLETED detectado! Iniciando redirecionamento...');
        handlePaymentConfirmed(newPayment.bet_id);
      }
    });

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      subscription.unsubscribe();
    };
  }, [transactionId, betId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(pixPayload);
    setCopied(true);
    facebookPixel.trackCustomEvent('PixCodeCopied', { transactionId, amount });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
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
        <View style={styles.section}>
          <Text style={styles.title}>Pague com PIX</Text>

          <View style={styles.timerContainer}>
            <Clock size={20} color={timeRemaining < 60 ? '#dc2626' : '#005da8'} />
            <Text style={[styles.timerText, timeRemaining < 60 && styles.timerWarning]}>
              Tempo restante: {formatTime(timeRemaining)}
            </Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Valor a pagar:</Text>
            <Text style={styles.amountValue}>R$ {displayAmount}</Text>
          </View>

          <View style={styles.qrCodeContainer}>
            {pixPayload ? (
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`
                }}
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrCodePlaceholder}>
                <ActivityIndicator size="large" color="#005da8" />
                <Text style={styles.loadingText}>Gerando QR Code...</Text>
              </View>
            )}
          </View>

          <Text style={styles.codeLabel}>Código PIX Copia e Cola:</Text>
          <View style={styles.codeContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeText}>{pixPayload}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
          >
            <Copy size={20} color="#FFFFFF" />
            <Text style={styles.copyButtonText}>
              {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
            </Text>
          </TouchableOpacity>

          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Devido a alta demanda e para garantir o registro da sua aposta, o pagamento pode ser processado por parceiros. O nome do recebedor pode variar.
            </Text>
          </View>

          {receiverName && (
            <View style={styles.partnerContainer}>
              <Text style={styles.partnerLabel}>Parceiro selecionado:</Text>
              <Text style={styles.partnerValue}>{receiverName}</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>ID da Transação:</Text>
            <Text style={styles.infoValue}>{transactionId}</Text>
          </View>

          {isCheckingPayment && (
            <View style={styles.checkingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.checkingText}>Pagamento Confirmado!</Text>
              <Text style={styles.checkingSubtext}>Redirecionando...</Text>
            </View>
          )}

          {!isCheckingPayment && (
            <View style={styles.checkingInfoBox}>
              <Text style={styles.checkingInfoText}>
                Aguardando confirmação do pagamento. Esta página será atualizada automaticamente quando o pagamento for confirmado.
              </Text>
            </View>
          )}
        </View>
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
  title: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#005da8',
  },
  timerWarning: {
    color: '#dc2626',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minHeight: 290,
  },
  qrCodeImage: {
    width: 250,
    height: 250,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#4a5568',
    marginBottom: 8,
  },
  codeContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
    color: '#2d3748',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#005da8',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  copyButtonText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#92400e',
    lineHeight: 20,
  },
  partnerContainer: {
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 4,
    borderLeftColor: '#005da8',
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  partnerLabel: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  partnerValue: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Bold',
    color: '#0c4a6e',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
    color: '#718096',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  checkingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  checkingText: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#10b981',
  },
  checkingSubtext: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#059669',
  },
  checkingInfoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#005da8',
  },
  checkingInfoText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0c4a6e',
    lineHeight: 20,
  },
});
