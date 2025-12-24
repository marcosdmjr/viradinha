import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Menu, User, CheckCircle, ChevronRight, Lock, Shield, ShoppingCart } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
}

interface LotteryCard {
  id: number;
  dozens: number;
  boloes: number;
  numbers: number[];
  numbers2?: number[];
  chanceMultiplier: string;
  availableQuotas: number;
  quotaPrice: string;
  isBestSeller?: boolean;
}

const lotteryCards: LotteryCard[] = [
  {
    id: 1,
    dozens: 15,
    boloes: 1,
    numbers: [1, 3, 6, 12, 15, 17, 20, 22, 27, 32, 31, 34],
    chanceMultiplier: '37',
    availableQuotas: 9,
    quotaPrice: '49,90',
  },
  {
    id: 2,
    dozens: 18,
    boloes: 1,
    numbers: [1, 5, 8, 13, 15, 18, 25, 26, 29, 31, 33, 37, 38, 41, 42],
    chanceMultiplier: '173',
    availableQuotas: 7,
    quotaPrice: '79,90',
  },
  {
    id: 3,
    dozens: 20,
    boloes: 1,
    numbers: [1, 5, 7, 11, 17, 19, 20, 22, 27, 32, 33, 36, 37, 41, 42, 48, 49, 52, 58, 59],
    chanceMultiplier: '1.327',
    availableQuotas: 3,
    quotaPrice: '99,90',
    isBestSeller: true,
  },
  {
    id: 4,
    dozens: 20,
    boloes: 2,
    numbers: [1, 3, 4, 16, 17, 18, 21, 23, 24, 30, 33, 36, 37, 41, 43, 45, 49, 52, 54, 56],
    numbers2: [3, 5, 7, 10, 11, 12, 14, 18, 22, 26, 28, 32, 33, 35, 36, 38, 39, 44, 48, 54],
    chanceMultiplier: '2.654',
    availableQuotas: 1,
    quotaPrice: '179,90',
  },
  {
    id: 5,
    dozens: 20,
    boloes: 1,
    numbers: [1, 3, 4, 16, 17, 18, 21, 23, 24, 30, 33, 36, 37, 41, 43, 45, 49, 52, 54, 56],
    chanceMultiplier: '1.327',
    availableQuotas: 0,
    quotaPrice: '99,90',
  },
];

export default function InicioScreen() {
  const router = useRouterWithUTM();
  const { logout, userData, urlTracking } = useAuth();
  const { startPixGeneration } = usePayment();
  const params = useLocalSearchParams();
  const [userName, setUserName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0 });
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    let data = null;

    if (params.userData) {
      try {
        data = JSON.parse(params.userData as string);
        console.log('Dados completos recebidos:', data);
      } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
      }
    } else if (userData) {
      data = userData;
      console.log('Dados do contexto:', data);
    }

    if (data) {
      const nomeCompleto = data.nome || data.name || data.nomeCompleto;
      console.log('Nome completo encontrado:', nomeCompleto);

      if (nomeCompleto) {
        const firstName = nomeCompleto.split(' ')[0];
        setUserName(firstName);
      }
    }

    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, [params, userData]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const targetDate = new Date('2025-12-31T22:00:00');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        setTimeRemaining({ days, hours, minutes });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Menu size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Image
          source={require('@/assets/images/logo-cx-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.userButton}
          onPress={() => setMenuVisible(true)}
        >
          <View style={styles.userIconContainer}>
            <User size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#005da8', '#4db8a8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Animated.View style={[styles.heroContent, animatedStyle]}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Olá, {userName}</Text>
              <Text style={styles.welcomeMessage}>Bem-vindo(a) a sua conta Caixa</Text>
            </View>

            <Text style={styles.title}>Loterias Online{'\n'}da CAIXA</Text>

            <Text style={styles.subtitle}>
              Portal Loterias CAIXA: agora você pode apostar na sorte de onde estiver.
            </Text>

            <Image
              source={require('@/assets/images/home-com-sorte.png')}
              style={styles.ticketsImage}
              resizeMode="contain"
            />
          </Animated.View>
        </LinearGradient>

        <View style={styles.countdownSection}>
          <Text style={styles.countdownTitle}>SORTEIO EM:</Text>
          <View style={styles.countdownContainer}>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>{timeRemaining.days.toString().padStart(2, '0')}</Text>
              <Text style={styles.timeLabel}>Dias</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>{timeRemaining.hours.toString().padStart(2, '0')}</Text>
              <Text style={styles.timeLabel}>Horas</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>{timeRemaining.minutes.toString().padStart(2, '0')}</Text>
              <Text style={styles.timeLabel}>Minutos</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardsSection}>
          {lotteryCards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              {card.isBestSeller && (
                <View style={styles.bestSellerBadge}>
                  <Text style={styles.bestSellerText}>MAIS VENDIDO</Text>
                </View>
              )}
              <View style={[styles.card, card.isBestSeller && styles.cardBestSeller]}>
                <View style={styles.cardHeaderContainer}>
                  <Image
                    source={require('@/assets/images/topo_card_mega-sena.png')}
                    style={styles.cardHeader}
                    resizeMode="stretch"
                  />
                  <Text style={styles.cardTitle}>Mega da virada</Text>
                </View>

                <View style={styles.cardBody}>
                  <ImageBackground
                    source={require('@/assets/images/backgroud-trevos.png')}
                    style={styles.cardBodyBackground}
                    resizeMode="cover"
                  >
                    <Text style={styles.prizeAmount}>R$ 850.000.000,00</Text>
                    <Text style={styles.prizeType}>Bolão Especial</Text>

                    <View style={styles.divider} />

                    <Text style={styles.infoText}>
                      Sorteio: <Text style={styles.infoBold}>31/12/2025</Text>
                    </Text>
                    <Text style={styles.infoText}>
                      Composição: <Text style={styles.infoBold}>{card.boloes} Bolão com {card.dozens} Dezenas</Text>
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.numbersContainer}>
                      {card.numbers.map((num) => (
                        <View key={num} style={styles.numberBall}>
                          <Text style={styles.numberText}>{num.toString().padStart(2, '0')}</Text>
                        </View>
                      ))}
                    </View>

                    {card.numbers2 && (
                      <View style={styles.numbersContainer}>
                        {card.numbers2.map((num) => (
                          <View key={num} style={styles.numberBall}>
                            <Text style={styles.numberText}>{num.toString().padStart(2, '0')}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.chanceText}>
                      Sua chance de ganhar aumenta em{'\n'}
                      <Text style={styles.chanceBold}>{card.chanceMultiplier}x (vezes)!</Text>
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.infoText}>
                      Disponíveis: <Text style={styles.infoBold}>{card.availableQuotas.toString().padStart(2, '0')} Cotas</Text>
                    </Text>
                    <Text style={styles.infoText}>
                      Valor da Cota: <Text style={styles.infoBold}>R${card.quotaPrice}</Text>
                    </Text>
                  </ImageBackground>

                  <TouchableOpacity
                    style={[
                      styles.guaranteeButton,
                      card.availableQuotas === 0 && styles.guaranteeButtonDisabled,
                      card.isBestSeller && styles.guaranteeButtonBestSeller
                    ]}
                    disabled={card.availableQuotas === 0}
                    onPress={() => {
                      console.log('========= NAVEGAÇÃO INICIADA =========');
                      console.log('Card ID:', card.id);
                      console.log('Valor:', card.quotaPrice);
                      console.log('Cotas:', `${card.availableQuotas}/100`);
                      console.log('Dezenas:', card.dozens);
                      console.log('Bolões:', card.boloes);
                      console.log('=====================================');

                      try {
                        const pixParams = {
                          valor: card.quotaPrice,
                          cotas: `${card.availableQuotas}/100`,
                          concurso: '2955',
                          dezenas: card.dozens.toString(),
                          boloes: card.boloes.toString(),
                          userData: userData,
                          urlTracking: urlTracking || undefined,
                        };

                        console.log('🚀 Iniciando geração do PIX em segundo plano...');
                        startPixGeneration(pixParams);

                        router.push({
                          pathname: '/pagamento',
                          params: {
                            valor: card.quotaPrice,
                            cotas: `${card.availableQuotas}/100`,
                            concurso: '2955',
                            dezenas: card.dozens.toString(),
                            boloes: card.boloes.toString(),
                          }
                        });
                      } catch (error) {
                        console.error('Erro na navegação:', error);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <ShoppingCart size={20} color={card.availableQuotas === 0 ? '#999' : '#FFFFFF'} />
                    <Text style={[
                      styles.guaranteeButtonText,
                      card.availableQuotas === 0 && styles.guaranteeButtonTextDisabled
                    ]}>
                      {card.availableQuotas === 0 ? 'ESGOTADO' : 'GARANTIR'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.whiteSection}>
        </View>
      </ScrollView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <View style={styles.userProfileSection}>
              <View style={styles.userAvatarLarge}>
                <User size={40} color="#999" />
              </View>
              <Text style={styles.userGreeting}>Olá, {userName}!</Text>
            </View>

            <View style={styles.validatedBadge}>
              <CheckCircle size={18} color="#4caf50" />
              <Text style={styles.validatedText}>CONTA VALIDADA</Text>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Apostas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Cadastro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Termo de Uso</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                await logout();
                setMenuVisible(false);
                router.replace('/');
              }}
            >
              <Text style={styles.menuItemText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    width: 240,
    marginTop: 60,
    marginRight: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 32,
    color: '#666',
    lineHeight: 32,
  },
  userProfileSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  userAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userGreeting: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#333',
  },
  validatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  validatedText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#4caf50',
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Book',
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingTop: 32,
    paddingBottom: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontFamily: 'CaixaSTD-ExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Book',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeMessage: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ticketsImage: {
    width: '100%',
    maxWidth: 900,
    height: 380,
    marginTop: -10,
    marginBottom: 0,
  },
  cardsSection: {
    backgroundColor: '#0074b3',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cardWrapper: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
  },
  cardHeaderContainer: {
    position: 'relative',
    width: '100%',
  },
  cardTitle: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -16 }],
    left: 60,
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    zIndex: 1,
  },
  bestSellerBadge: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: -8,
    zIndex: 1,
    borderRadius: 4,
  },
  bestSellerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'CaixaSTD-Bold',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardBestSeller: {
    borderWidth: 4,
    borderColor: '#FF9800',
  },
  cardHeader: {
    width: '100%',
    height: 60,
  },
  cardBody: {
    padding: 20,
    position: 'relative',
  },
  cardBodyBackground: {
    padding: 20,
  },
  prizeAmount: {
    fontSize: 32,
    fontFamily: 'CaixaSTD-ExtraBold',
    color: '#0074b3',
    textAlign: 'center',
    marginBottom: 4,
  },
  prizeType: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Book',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Book',
    color: '#666',
    marginBottom: 4,
  },
  infoBold: {
    fontFamily: 'CaixaSTD-Bold',
    color: '#333',
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  numberBall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0074b3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
  },
  chanceText: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Book',
    color: '#0074b3',
    textAlign: 'center',
    lineHeight: 22,
  },
  chanceBold: {
    fontFamily: 'CaixaSTD-Bold',
  },
  guaranteeButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
    position: 'relative',
  },
  guaranteeButtonBestSeller: {
    backgroundColor: '#0074b3',
  },
  guaranteeButtonDisabled: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#999',
  },
  guaranteeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    letterSpacing: 1,
  },
  guaranteeButtonTextDisabled: {
    color: '#999',
  },
  whiteSection: {
    backgroundColor: '#FFFFFF',
    minHeight: 200,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  countdownSection: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  countdownTitle: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-ExtraBold',
    color: '#005da8',
    lineHeight: 28,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#005da8',
    marginTop: 1,
  },
  timeSeparator: {
    fontSize: 20,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
    marginHorizontal: 6,
    lineHeight: 24,
  },
});
