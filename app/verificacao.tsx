import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';

type VerificationStep = {
  id: number;
  text: string;
  duration: number;
  completed: boolean;
};

export default function VerificationScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();

  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: 1, text: 'Verificando Cpf...', duration: 3000, completed: false },
    { id: 2, text: 'Consultando dados...', duration: 4000, completed: false },
    { id: 3, text: 'Finalizando verificações...', duration: 3000, completed: false },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const progress = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withTiming(1, { duration: 300 });
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (currentStep < steps.length) {
      const currentStepData = steps[currentStep];
      const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
      const previousDuration = steps.slice(0, currentStep).reduce((acc, step) => acc + step.duration, 0);
      const targetProgress = ((previousDuration + currentStepData.duration) / totalDuration) * 100;

      progress.value = withTiming(targetProgress, {
        duration: currentStepData.duration,
        easing: Easing.linear,
      });

      timeoutId = setTimeout(() => {
        setSteps(prev =>
          prev.map((step, idx) =>
            idx === currentStep ? { ...step, completed: true } : step
          )
        );

        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setTimeout(() => {
            router.push({
              pathname: '/confirmacao-nome',
              params: { userData: params.userData }
            });
          }, 500);
        }
      }, currentStepData.duration);
    }

    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  return (
    <LinearGradient
      colors={['#0066b3', '#4db8a8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-caixa.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Verificando seus dados</Text>
          <Text style={styles.subtitle}>Aguarde enquanto processamos suas informações</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <VerificationStepItem
                key={step.id}
                step={step}
                isActive={index === currentStep}
                isCompleted={step.completed}
              />
            ))}
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, progressAnimatedStyle]} />
            </View>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function VerificationStepItem({
  step,
  isActive,
  isCompleted
}: {
  step: VerificationStep;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const rotation = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (isActive && !isCompleted) {
      rotation.value = withSequence(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        withTiming(720, { duration: 800, easing: Easing.linear }),
        withTiming(1080, { duration: 800, easing: Easing.linear })
      );
    }
  }, [isActive, isCompleted]);

  useEffect(() => {
    if (isCompleted) {
      checkScale.value = withTiming(1, { duration: 200 });
    }
  }, [isCompleted]);

  const spinnerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View style={styles.stepItem}>
      <View style={styles.iconContainer}>
        {isCompleted ? (
          <Animated.View style={checkAnimatedStyle}>
            <CheckCircle size={24} color="#4caf50" strokeWidth={2.5} />
          </Animated.View>
        ) : isActive ? (
          <Animated.View style={spinnerAnimatedStyle}>
            <Loader2 size={24} color="#0066b3" />
          </Animated.View>
        ) : (
          <View style={styles.pendingIcon} />
        )}
      </View>
      <Text style={[
        styles.stepText,
        isActive && styles.stepTextActive,
        isCompleted && styles.stepTextCompleted
      ]}>
        {step.text}
      </Text>
    </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#0066b3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'CaixaSTD-Book',
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pendingIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
  },
  stepText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#999',
    flex: 1,
  },
  stepTextActive: {
    color: '#333',
    fontFamily: 'CaixaSTD-SemiBold',
  },
  stepTextCompleted: {
    color: '#4caf50',
    fontFamily: 'CaixaSTD-Regular',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066b3',
    borderRadius: 3,
  },
});
