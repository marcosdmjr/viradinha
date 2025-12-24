import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';

export default function ConfirmacaoSeguranca1Screen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const [nomeMae, setNomeMae] = useState<string | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [mostrarModalErro, setMostrarModalErro] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    if (params.userData) {
      try {
        const data = JSON.parse(params.userData as string);
        console.log('Dados recebidos:', data);

        if (data) {
          const mae = data.nomeMae || data.mae || data.nome_mae || data.maeName;
          console.log('Nome da mãe encontrado:', mae);

          if (mae && mae !== 'NÃO INFORMADO' && mae !== 'NAO INFORMADO') {
            setNomeMae(mae);
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

  const alternativas = [
    'Maria da Silva Santos',
    'Ana Paula Oliveira',
    'Ana Cristina Ferreira',
  ];

  const handleSelecao = (opcao: string) => {
    setOpcaoSelecionada(opcao);
  };

  const handleProximo = () => {
    if (!opcaoSelecionada) return;

    if (opcaoSelecionada === 'Nenhuma das alternativas') {
      router.push({
        pathname: '/confirmacao-seguranca-2',
        params: { userData: params.userData }
      });
      return;
    }

    if (nomeMae && opcaoSelecionada === nomeMae) {
      router.push({
        pathname: '/confirmacao-seguranca-2',
        params: { userData: params.userData }
      });
      return;
    }

    setMostrarModalErro(true);
  };

  const handleTentarNovamente = () => {
    setMostrarModalErro(false);
    setOpcaoSelecionada(null);
  };

  return (
    <LinearGradient
      colors={['#0066b3', '#4db8a8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo-cx-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Animated.View style={[styles.mainContent, animatedStyle]}>
          <Text style={styles.title}>Confirmação de Segurança</Text>
          <Text style={styles.subtitle}>Verificação de segurança para proteger sua conta!</Text>

          <View style={styles.stepIndicator}>
            <View style={styles.stepCircleActive}>
              <Text style={styles.stepNumberActive}>1</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepCircleInactive}>
              <Text style={styles.stepNumberInactive}>2</Text>
            </View>
          </View>

          <Text style={styles.stepText}>Etapa 1 de 2</Text>
          <Text style={styles.question}>Confirme o nome da sua mãe</Text>

          <View style={styles.alternativasContainer}>
            {alternativas.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alternativaCard,
                  opcaoSelecionada === alt && styles.alternativaCardSelected
                ]}
                onPress={() => handleSelecao(alt)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  opcaoSelecionada === alt && styles.radioSelected
                ]}>
                  {opcaoSelecionada === alt && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.alternativaText}>{alt}</Text>
              </TouchableOpacity>
            ))}

            {nomeMae && (
              <TouchableOpacity
                style={[
                  styles.alternativaCard,
                  opcaoSelecionada === nomeMae && styles.alternativaCardSelected
                ]}
                onPress={() => handleSelecao(nomeMae)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  opcaoSelecionada === nomeMae && styles.radioSelected
                ]}>
                  {opcaoSelecionada === nomeMae && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.alternativaText}>{nomeMae}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.alternativaCard,
                opcaoSelecionada === 'Nenhuma das alternativas' && styles.alternativaCardSelected
              ]}
              onPress={() => handleSelecao('Nenhuma das alternativas')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radio,
                opcaoSelecionada === 'Nenhuma das alternativas' && styles.radioSelected
              ]}>
                {opcaoSelecionada === 'Nenhuma das alternativas' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.alternativaText}>Nenhuma das alternativas</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.proximoButton,
              !opcaoSelecionada && styles.proximoButtonDisabled
            ]}
            onPress={handleProximo}
            disabled={!opcaoSelecionada}
            activeOpacity={0.9}
          >
            <Text style={styles.proximoButtonText}>Próximo</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={mostrarModalErro}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarModalErro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIconContainer}>
              <XCircle size={48} color="#FFFFFF" strokeWidth={2.5} />
            </View>

            <Text style={styles.modalTitle}>Ops! Tente Novamente</Text>
            <Text style={styles.modalText}>
              Selecione a opção que corresponde exatamente aos seus documentos oficiais
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleTentarNovamente}
              activeOpacity={0.9}
            >
              <Text style={styles.modalButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 32,
  },
  logo: {
    width: 160,
    height: 50,
  },
  mainContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.95,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepCircleActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066b3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleInactive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 102, 179, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  stepNumberActive: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stepText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  question: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  alternativasContainer: {
    gap: 12,
    marginBottom: 24,
  },
  alternativaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  alternativaCardSelected: {
    borderColor: '#0066b3',
    backgroundColor: '#E3F2FD',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#0066b3',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066b3',
  },
  alternativaText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  proximoButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  proximoButtonDisabled: {
    backgroundColor: '#FFB74D',
    opacity: 0.5,
  },
  proximoButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
