import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Pressable, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { Menu, User, ChevronRight, ChevronDown, ChevronUp, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { SvgXml } from 'react-native-svg';
import { createTransaction } from '@/services/genesysApi';
import { facebookPixel } from '@/services/facebookPixel';
import { createBet, createPayment, createBetNumbers, generateRandomNumbers } from '@/services/supabaseService';
import Constants from 'expo-constants';
import { DEFAULT_PHONE, DEFAULT_EMAIL } from '@/constants/defaults';

const pixLogoSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.76514 84.263428" height="84.263428mm" width="237.76514mm">
  <g transform="translate(-535.59399,-20.808825)">
    <path d="m 633.42119,99.489186 v -48.3242 c 0,-8.89177 7.20795,-16.09972 16.09936,-16.09972 l 14.2681,0.0215 c 8.86566,0.0176 16.04363,7.20972 16.04363,16.07573 v 10.28594 c 0,8.89176 -7.20831,16.09972 -16.09972,16.09972 h -20.1616" style="fill:none;stroke:#32bcad;stroke-width:2.97638607;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"/>
    <path d="m 683.81948,35.058846 h 6.18913 c 3.64913,0 6.60682,2.95804 6.60682,6.60717 v 36.09834" style="fill:none;stroke:#32bcad;stroke-width:2.97638607;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"/>
    <path d="m 695.28853,29.466256 -2.8067,-2.807053 c -0.69674,-0.696383 -0.69674,-1.825625 0,-2.522008 l 2.80494,-2.805289 c 0.69779,-0.697441 1.82844,-0.697441 2.52553,0 l 2.80494,2.805289 c 0.69673,0.696383 0.69673,1.825625 0,2.522008 l -2.8067,2.807053 c -0.69638,0.69638 -1.82527,0.69638 -2.52201,0" style="fill:#32bcad;fill-opacity:1;fill-rule:nonzero;stroke:none"/>
    <path d="m 708.48944,35.026636 h 6.13798 c 3.15771,0 6.18596,1.25448 8.41834,3.48686 l 14.35664,14.35664 c 1.85949,1.85984 4.87468,1.85984 6.73453,0 l 14.30408,-14.30408 c 2.23273,-2.23238 5.26062,-3.48686 8.41833,-3.48686 h 4.9904" style="fill:none;stroke:#32bcad;stroke-width:2.97638607;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"/>
    <path d="m 708.48944,77.448336 h 6.13798 c 3.15771,0 6.18596,-1.25448 8.41834,-3.48686 l 14.35664,-14.35664 c 1.85949,-1.85984 4.87468,-1.85984 6.73453,0 l 14.30408,14.30408 c 2.23273,2.23238 5.26062,3.48686 8.41833,3.48686 h 4.9904" style="fill:none;stroke:#32bcad;stroke-width:2.97638607;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"/>
    <path d="m 596.82737,86.620206 c -3.08045,0 -5.97782,-1.19944 -8.15622,-3.37679 l -11.77678,-11.77713 c -0.82691,-0.82903 -2.26801,-0.82656 -3.09456,0 l -11.81982,11.82017 c -2.17841,2.17734 -5.07577,3.37679 -8.15623,3.37679 h -2.32092 l 14.9158,14.915444 c 4.65807,4.65808 12.21069,4.65808 16.86912,0 l 14.95813,-14.958484 z" style="fill:#32bcad;fill-opacity:1;fill-rule:nonzero;stroke:none"/>
    <path d="m 553.82362,44.963326 c 3.08046,0 5.97782,1.19944 8.15622,3.37679 l 11.81982,11.82193 c 0.85125,0.85161 2.2412,0.85479 3.09457,-10e-4 l 11.77678,-11.77784 c 2.1784,-2.17735 5.07576,-3.37679 8.15622,-3.37679 h 1.41852 l -14.95778,-14.95813 c -4.65878,-4.658432 -12.2114,-4.658432 -16.86948,0 l -14.91509,14.91509 z" style="fill:#32bcad;fill-opacity:1;fill-rule:nonzero;stroke:none"/>
    <path d="m 610.61844,57.378776 -9.03922,-9.03922 c -0.19897,0.0797 -0.41452,0.12946 -0.64206,0.12946 h -4.10986 c -2.12478,0 -4.20476,0.86184 -5.70618,2.36432 l -11.77643,11.77678 c -1.10207,1.10208 -2.55022,1.65347 -3.99697,1.65347 -1.44815,0 -2.89524,-0.55139 -3.99697,-1.65241 l -11.82088,-11.82088 c -1.50142,-1.50283 -3.5814,-2.36431 -5.70618,-2.36431 h -5.05354 c -0.21555,0 -0.41698,-0.0508 -0.60713,-0.12242 l -9.07521,9.07521 c -4.65843,4.65843 -4.65843,12.2107 0,16.86913 l 9.07486,9.07485 c 0.1905,-0.0716 0.39193,-0.12241 0.60748,-0.12241 h 5.05354 c 2.12478,0 4.20476,-0.86148 5.70618,-2.36396 l 11.81982,-11.81982 c 2.13643,-2.13466 5.8607,-2.13537 7.995,0.001 l 11.77643,11.77573 c 1.50142,1.50248 3.5814,2.36431 5.70618,2.36431 h 4.10986 c 0.22754,0 0.44309,0.0497 0.64206,0.12947 l 9.03922,-9.03922 c 4.65808,-4.65843 4.65808,-12.2107 0,-16.86913" style="fill:#32bcad;fill-opacity:1;fill-rule:nonzero;stroke:none"/>
  </g>
</svg>`;

const formatCpf = (cpf: string) => {
  if (!cpf) return '';
  const numericOnly = cpf.replace(/[^0-9]/g, '');
  if (numericOnly.length !== 11) return cpf;
  return `${numericOnly.slice(0, 3)}.${numericOnly.slice(3, 6)}.${numericOnly.slice(6, 9)}-${numericOnly.slice(9, 11)}`;
};

const getRandomProductName = () => {
  const products = [
    'Curso de Marketing Digital Avançado',
    'Ebook - Finanças Pessoais para Iniciantes',
    'Treinamento de Gestão de Tempo',
    'Curso de Desenvolvimento Web Completo',
    'Mentoria de Empreendedorismo Digital',
    'Workshop de Produtividade e Foco',
    'Curso de Inglês Online Premium',
    'Ebook - Como Investir no Mercado Financeiro',
    'Treinamento de Vendas Online',
    'Curso de Design Gráfico Profissional',
    'Mentoria de Carreira e Liderança',
    'Workshop de Fotografia Digital',
    'Curso de Excel Avançado para Negócios',
    'Ebook - Receitas Fit e Saudáveis',
    'Treinamento de Oratória e Comunicação',
    'Curso de Python para Análise de Dados',
    'Mentoria de Crescimento Pessoal',
    'Workshop de Finanças para Pequenos Negócios',
    'Curso de Social Media Estratégico',
    'Ebook - Guia Completo de Mindfulness',
  ];

  return products[Math.floor(Math.random() * products.length)];
};

export default function PagamentoScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const { userData, urlTracking } = useAuth();
  const { isGeneratingPix, pixData, clearPixData } = usePayment();
  const [userName, setUserName] = useState('');
  const [userCpf, setUserCpf] = useState('');
  const [userBirthdate, setUserBirthdate] = useState('');
  const [pixExpanded, setPixExpanded] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  console.log('========= PÁGINA DE PAGAMENTO =========');
  console.log('Params recebidos:', params);
  console.log('Valor:', params.valor);
  console.log('Cotas:', params.cotas);
  console.log('Concurso:', params.concurso);
  console.log('Dezenas:', params.dezenas);
  console.log('Bolões:', params.boloes);
  console.log('======================================');

  const betValue = params.valor ? String(params.valor) : '224,53';
  const betQuotas = params.cotas ? String(params.cotas) : '94/100';
  const betContest = params.concurso ? String(params.concurso) : '2955';
  const betDezenas = params.dezenas ? String(params.dezenas) : '6';
  const betBoloes = params.boloes ? String(params.boloes) : '1';

  useEffect(() => {
    if (userData) {
      const nome = userData.nome || userData.name || userData.nomeCompleto || '';
      const cpf = userData.cpf || userData.CPF || userData.documento || '';
      const dataNascimento = userData.dataNascimento || userData.nascimento || userData.data_nascimento || userData.dt_nascimento || '';

      setUserName(nome);
      setUserCpf(formatCpf(cpf));
      setUserBirthdate(dataNascimento);
    }

    facebookPixel.trackPageView('Pagamento');
    const amountNumber = parseFloat(betValue.replace(',', '.'));
    facebookPixel.trackAddToCart(amountNumber, 'BRL');
  }, [userData]);


  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);

    const amountNumber = parseFloat(betValue.replace(',', '.'));
    facebookPixel.trackInitiateCheckout(amountNumber, 'BRL');

    try {
      if (pixData && !isGeneratingPix) {
        console.log('✅ PIX já está pronto! Usando dados pré-carregados...');
        router.push({
          pathname: '/qrcode-pix',
          params: {
            pixPayload: pixData.pixPayload,
            transactionId: pixData.transactionId,
            betId: pixData.betId,
            amount: pixData.amount.toFixed(2).replace('.', ','),
          },
        });
        setIsProcessingPayment(false);
        return;
      }

      const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                         process.env.EXPO_PUBLIC_SUPABASE_URL ||
                         'https://abejbqhclgdvwbnnfigv.supabase.co';
      const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;
      const cpfClean = userCpf.replace(/[^0-9]/g, '');

      const pixAmount = amountNumber;

      const result = await createTransaction({
        externalId: `bolao_${betContest}_${Date.now()}`,
        totalAmount: pixAmount,
        webhookUrl: webhookUrl,
        items: [
          {
            id: betContest,
            title: getRandomProductName(),
            description: `Produto digital`,
            price: pixAmount,
            quantity: 1,
            is_physical: false,
          },
        ],
        customer: {
          name: userName,
          email: userData?.email || DEFAULT_EMAIL,
          phone: userData?.telefone || DEFAULT_PHONE,
          document_type: 'CPF',
          document: cpfClean,
        },
        urlTracking: urlTracking || undefined,
      });

      if (!result.pix?.payload) {
        throw new Error('Código PIX não retornado');
      }

      const bet = await createBet({
        user_name: userName,
        user_cpf: cpfClean,
        user_email: userData?.email || DEFAULT_EMAIL,
        user_phone: userData?.telefone || DEFAULT_PHONE,
        user_birthdate: userBirthdate,
        contest_number: betContest,
        quota: betQuotas,
        amount: amountNumber,
      });

      if (!bet) {
        throw new Error('Erro ao criar aposta');
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await createPayment({
        bet_id: bet.id,
        transaction_id: result.id,
        pix_payload: result.pix.payload,
        amount: pixAmount,
        expires_at: expiresAt,
      });

      const randomNumbers = generateRandomNumbers(6, 60);
      await createBetNumbers({
        bet_id: bet.id,
        numbers: randomNumbers,
        game_type: 'mega-sena',
      });

      router.push({
        pathname: '/qrcode-pix',
        params: {
          pixPayload: result.pix.payload,
          transactionId: result.id,
          betId: bet.id,
          amount: betValue,
        },
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      Alert.alert(
        'Erro no Pagamento',
        'Não foi possível gerar o código PIX. Por favor, tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {}}
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
          <Text style={styles.sectionTitle}>Dados do apostador:</Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{userName.toUpperCase()}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>CPF:</Text>
            <Text style={styles.infoValue}>{userCpf}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Data de Nascimento:</Text>
            <Text style={styles.infoValue}>{userBirthdate}</Text>
          </View>
        </View>

        <View style={styles.betSection}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total da compra:</Text>
            <Text style={styles.totalValue}>R$ {betValue}</Text>
          </View>

          <ImageBackground
            source={require('@/assets/images/bg_bolao_mega_sena_virada.png')}
            style={styles.bolaoHeader}
            imageStyle={styles.bolaoHeaderImage}
          >
            <Text style={styles.bolaoHeaderText}>bolão mega da virada</Text>
          </ImageBackground>

          <View style={styles.betDetailsGrid}>
            <View style={styles.betDetailRow}>
              <Text style={styles.betDetailLabel}>Concurso:</Text>
              <Text style={styles.betDetailValue}>{betContest}</Text>
            </View>

            <View style={styles.betDetailRow}>
              <Text style={styles.betDetailLabel}>Cota:</Text>
              <Text style={styles.betDetailValue}>{betQuotas}</Text>
            </View>

            <View style={styles.betDetailRow}>
              <Text style={styles.betDetailLabel}>Valor:</Text>
              <Text style={styles.betDetailValue}>R$ {betValue}</Text>
            </View>

            <View style={styles.betDetailRow}>
              <Text style={styles.betDetailLabel}>Tempo de Reserva da Cota:</Text>
              <View style={styles.timeContainer}>
                <Clock size={16} color={timeRemaining < 60 ? '#dc2626' : '#4a5568'} />
                <Text style={[styles.betDetailValue, timeRemaining < 60 && styles.timeWarning]}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha o meio de pagamento:</Text>

          <View>
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => setPixExpanded(!pixExpanded)}
            >
              <View style={styles.paymentOptionContent}>
                <SvgXml xml={pixLogoSvg} width="80" height="30" />
              </View>
              {pixExpanded ? (
                <ChevronUp size={24} color="#005da8" />
              ) : (
                <ChevronDown size={24} color="#005da8" />
              )}
            </TouchableOpacity>

            {pixExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.stepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Acesse seu banco via internet ou aplicativo de pagamentos</Text>
                </View>

                <View style={styles.stepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Escolha pagar via Pix</Text>
                </View>

                <View style={styles.stepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Escaneie ou copie o código gerado</Text>
                </View>

                <View style={styles.stepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>Confirme o valor realize o pagamento.</Text>
                </View>

                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() => setIsChecked(!isChecked)}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Estou ciente que somente será aceito o pagamento realizado por conta de titularidade do apostador.
                  </Text>
                </Pressable>

                <TouchableOpacity
                  style={[styles.payButton, (!isChecked || isProcessingPayment) && styles.payButtonDisabled]}
                  disabled={!isChecked || isProcessingPayment}
                  onPress={handlePayment}
                >
                  {isProcessingPayment ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loadingText}>Gerando código PIX...</Text>
                    </View>
                  ) : (
                    <Text style={styles.payButtonText}>Pagar Agora!</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.paymentOption, styles.paymentOptionDisabled]} disabled={true}>
            <View style={styles.paymentOptionContent}>
              <Text style={[styles.paymentOptionText, styles.paymentOptionTextDisabled]}>Cartão de crédito</Text>
              <Text style={styles.paymentWarningText}>Forma de pagamento não disponível para essa modalidade de aposta</Text>
            </View>
            <ChevronRight size={24} color="#cccccc" />
          </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#4a5568',
    marginBottom: 20,
  },
  infoContainer: {
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#2d3748',
  },
  paymentOptionDisabled: {
    backgroundColor: '#f9f9f9',
    opacity: 0.6,
    borderColor: '#e8e8e8',
  },
  paymentOptionTextDisabled: {
    color: '#999999',
  },
  paymentWarningText: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
    color: '#999999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  expandedContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#005da8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    lineHeight: 22,
    paddingTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#005da8',
    borderColor: '#005da8',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    lineHeight: 18,
  },
  payButton: {
    backgroundColor: '#005da8',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#cbd5e0',
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#FFFFFF',
  },
  betSection: {
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  totalValue: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
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
  betDetailsGrid: {
    gap: 12,
  },
  betDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betDetailLabel: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  betDetailValue: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#2d3748',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeWarning: {
    color: '#dc2626',
    fontFamily: 'CaixaSTD-Bold',
  },
});
