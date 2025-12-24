import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { Menu, User, AlertCircle, RefreshCw, Copy, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { facebookPixel } from '@/services/facebookPixel';
import { usePayment } from '@/contexts/PaymentContext';
import { getBetWithDetails, createPayment } from '@/services/supabaseService';
import { createTransaction } from '@/services/genesysApi';
import Constants from 'expo-constants';

export default function PagamentoFalhouScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const { setPixData } = usePayment();
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [newPixData, setNewPixData] = useState<{
    pixPayload: string;
    transactionId: string;
    betId: string;
    amount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);

  const amount = params.amount ? String(params.amount) : '0,00';
  const originalBetId = params.betId ? String(params.betId) : '';
  const amountNumber = parseFloat(amount.replace(',', '.'));

  useEffect(() => {
    facebookPixel.trackCustomEvent('PaymentFailed', { amount, betId: originalBetId });
  }, []);

  useEffect(() => {
    if (newPixData) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Alert.alert(
              'Tempo Esgotado',
              'O tempo para pagamento expirou. Clique em "Gerar Novo Código" para tentar novamente.',
              [{ text: 'OK' }]
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [newPixData]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRandomProductName = () => {
    const products = [
      'Curso de Marketing Digital Avançado',
      'Ebook - Finanças Pessoais para Iniciantes',
      'Treinamento de Gestão de Tempo',
      'Curso de Desenvolvimento Web Completo',
      'Mentoria de Empreendedorismo Digital',
      'Workshop de Produtividade e Foco',
    ];
    return products[Math.floor(Math.random() * products.length)];
  };

  const handleGenerateNewPix = async () => {
    if (isGeneratingPix) return;

    setIsGeneratingPix(true);
    facebookPixel.trackCustomEvent('RetryPayment', { amount });

    try {
      const betData = await getBetWithDetails(originalBetId);

      if (!betData) {
        Alert.alert('Erro', 'Não foi possível encontrar os dados da aposta.');
        setIsGeneratingPix(false);
        return;
      }

      const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                         process.env.EXPO_PUBLIC_SUPABASE_URL ||
                         'https://abejbqhclgdvwbnnfigv.supabase.co';
      const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

      const result = await createTransaction({
        externalId: `bolao_retry_${betData.contest_number}_${Date.now()}`,
        totalAmount: amountNumber,
        webhookUrl: webhookUrl,
        items: [
          {
            id: betData.contest_number,
            title: getRandomProductName(),
            description: 'Produto digital',
            price: amountNumber,
            quantity: 1,
            is_physical: false,
          },
        ],
        customer: {
          name: betData.user_name,
          email: betData.user_email,
          phone: betData.user_phone,
          document_type: 'CPF',
          document: betData.user_cpf,
        },
      });

      if (!result.pix?.payload) {
        Alert.alert('Erro', 'Não foi possível gerar um novo código PIX. Tente novamente.');
        setIsGeneratingPix(false);
        return;
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await createPayment({
        bet_id: originalBetId,
        transaction_id: result.id,
        pix_payload: result.pix.payload,
        amount: amountNumber,
        expires_at: expiresAt,
      });

      const pixData = {
        pixPayload: result.pix.payload,
        transactionId: result.id,
        betId: originalBetId,
        amount: amountNumber,
      };

      setNewPixData(pixData);
      setPixData(pixData);
      setTimeRemaining(600);
      facebookPixel.trackCustomEvent('NewPixGenerated', {
        amount,
        transactionId: result.id
      });
    } catch (error) {
      console.error('Erro ao gerar novo PIX:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao gerar o código PIX. Tente novamente.');
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPixCode = async () => {
    if (newPixData?.pixPayload) {
      await Clipboard.setStringAsync(newPixData.pixPayload);
      setCopied(true);
      facebookPixel.trackCustomEvent('PixCodeCopied', { transactionId: newPixData.transactionId });

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const handleContinueToQRCode = () => {
    if (newPixData) {
      router.replace({
        pathname: '/qrcode-pix',
        params: {
          pixPayload: newPixData.pixPayload,
          transactionId: newPixData.transactionId,
          betId: newPixData.betId,
          amount: amount,
        },
      });
    }
  };

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
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <AlertCircle size={64} color="#f59e0b" />
          </View>

          <Text style={styles.title}>Pagamento em Análise</Text>

          <Text style={styles.description}>
            Identificamos um erro em seu pagamento. Para garantir que você não perca sua aposta, você pode realizar um novo pagamento agora, como pedido de desculpas, vamos incluir mais um bolão em seu pedido de forma gratuita.
          </Text>

          <View style={styles.refundBox}>
            <Text style={styles.refundTitle}>Sobre o Reembolso</Text>
            <Text style={styles.refundText}>
              Caso o primeiro pagamento seja confirmado, você receberá o reembolso do valor duplicado em até 24 horas na mesma conta de origem.
            </Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Valor da aposta:</Text>
            <Text style={styles.amountValue}>R$ {amount}</Text>
          </View>

          {!newPixData ? (
            <TouchableOpacity
              style={[styles.generateButton, isGeneratingPix && styles.generateButtonDisabled]}
              onPress={handleGenerateNewPix}
              disabled={isGeneratingPix}
            >
              {isGeneratingPix ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Gerar Novo Código PIX</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.newPixContainer}>
                <View style={styles.timerContainer}>
                  <Clock size={20} color="#f59e0b" />
                  <Text style={styles.timerText}>
                    Código expira em: <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
                  </Text>
                </View>

                <View style={styles.pixCodeContainer}>
                  <Text style={styles.pixCodeLabel}>Código PIX Copia e Cola</Text>
                  <View style={styles.pixCodeBox}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={styles.pixCodeText}>{newPixData.pixPayload}</Text>
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyPixCode}
                  >
                    <Copy size={18} color="#FFFFFF" />
                    <Text style={styles.copyButtonText}>
                      {copied ? 'Copiado!' : 'Copiar Código'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinueToQRCode}
                >
                  <Text style={styles.continueButtonText}>Ver QR Code Completo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Importante</Text>
            <Text style={styles.infoText}>
              • Realize o novo pagamento somente se desejar garantir sua aposta{'\n'}
              • O reembolso é automático caso haja pagamento duplicado{'\n'}
              • Você pode acompanhar o status no painel administrativo
            </Text>
          </View>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refundBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  refundTitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
    color: '#92400e',
    marginBottom: 8,
  },
  refundText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#92400e',
    lineHeight: 20,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  newPixContainer: {
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#92400e',
  },
  timerValue: {
    fontFamily: 'CaixaSTD-Bold',
    color: '#92400e',
  },
  pixCodeContainer: {
    marginBottom: 16,
  },
  pixCodeLabel: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#2d3748',
    marginBottom: 8,
  },
  pixCodeBox: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  pixCodeText: {
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 4,
    borderLeftColor: '#005da8',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#0c4a6e',
    lineHeight: 20,
  },
});
