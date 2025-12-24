import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { useAuth } from '@/contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export default function AgeVerificationScreen() {
  const router = useRouterWithUTM();
  const searchParams = useLocalSearchParams();
  const { setUrlTracking } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<'yes' | 'no' | null>(null);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const questionOpacity = useSharedValue(0);
  const questionTranslateY = useSharedValue(10);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(15);

  useEffect(() => {
    const captureUrlParams = async () => {
      try {
        const url = await Linking.getInitialURL();
        const params: Record<string, string> = {};

        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined) {
            params[key] = Array.isArray(value) ? value[0] : value;
          }
        });

        const fullUrl = url || window?.location?.href || 'direct-access';

        await setUrlTracking({
          fullUrl,
          params,
        });

        console.log('URL e parâmetros capturados e salvos:', {
          fullUrl,
          params,
        });
      } catch (error) {
        console.error('Erro ao capturar URL:', error);
      }
    };

    captureUrlParams();

    logoOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });

    questionOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );
    questionTranslateY.value = withDelay(
      150,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );

    buttonsOpacity.value = withDelay(
      250,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );
    buttonsTranslateY.value = withDelay(
      250,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const handleAnswer = (answer: 'yes' | 'no') => {
    setSelectedAnswer(answer);
    router.push('/login');
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedQuestionStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateY: questionTranslateY.value }],
  }));

  const animatedButtonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <LinearGradient
      colors={['#005aa3', '#54bbab']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <Image
            source={require('@/assets/images/logo-loteria-whitye.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.centerContainer, animatedQuestionStyle]}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>Você tem mais de 18 anos?</Text>
          </View>

          <Animated.View style={[styles.buttonsContainer, animatedButtonsStyle]}>
            <TouchableOpacity
              style={styles.buttonNo}
              onPress={() => handleAnswer('no')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonNoText}>Não</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonYes}
              onPress={() => handleAnswer('yes')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonYesText}>Sim</Text>
            </TouchableOpacity>
          </Animated.View>
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
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 80,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 100,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  questionContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'CaixaSTD-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonNo: {
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonNoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'CaixaSTD-Bold',
    letterSpacing: 0.5,
  },
  buttonYes: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonYesText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'CaixaSTD-Bold',
    letterSpacing: 0.5,
  },
});
