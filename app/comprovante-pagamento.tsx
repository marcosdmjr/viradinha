import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { Menu, User, Upload, Camera, ImageIcon, CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadPaymentReceipt } from '@/services/supabaseService';
import { facebookPixel } from '@/services/facebookPixel';

export default function ComprovantePageScreen() {
  const router = useRouterWithUTM();
  const params = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const transactionId = params.transactionId ? String(params.transactionId) : '';
  const betId = params.betId ? String(params.betId) : '';
  const amount = params.amount ? String(params.amount) : '0,00';

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'É necessário permitir acesso à galeria de fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setSelectedImage(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setSelectedImage(asset.uri);
      }
      facebookPixel.trackCustomEvent('ReceiptImageSelected', { source: 'gallery' });
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'É necessário permitir acesso à câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setSelectedImage(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setSelectedImage(asset.uri);
      }
      facebookPixel.trackCustomEvent('ReceiptImageSelected', { source: 'camera' });
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Atenção', 'Por favor, selecione uma imagem do comprovante');
      return;
    }

    if (!transactionId) {
      Alert.alert('Erro', 'ID da transação não encontrado');
      return;
    }

    setIsUploading(true);

    try {
      await uploadPaymentReceipt(transactionId, selectedImage);

      setUploadComplete(true);
      facebookPixel.trackCustomEvent('ReceiptUploaded', { transactionId, amount });

      setTimeout(() => {
        router.replace({
          pathname: '/verificando-pagamento',
          params: { betId, amount },
        });
      }, 1500);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro', 'Não foi possível enviar o comprovante. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Pular envio?',
      'Você pode enviar o comprovante mais tarde se necessário.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Pular',
          onPress: () => {
            facebookPixel.trackCustomEvent('ReceiptUploadSkipped', { transactionId });
            router.replace({
              pathname: '/pagamento-concluido',
              params: { betId },
            });
          },
        },
      ]
    );
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
          {uploadComplete ? (
            <View style={styles.successContainer}>
              <CheckCircle size={64} color="#10b981" />
              <Text style={styles.successTitle}>Comprovante Enviado!</Text>
              <Text style={styles.successText}>
                Seu comprovante foi recebido com sucesso
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Enviar Comprovante</Text>
              <Text style={styles.subtitle}>
                Para garantir o registro da sua aposta, envie o comprovante do pagamento PIX
              </Text>

              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Valor pago:</Text>
                <Text style={styles.amountValue}>R$ {amount}</Text>
              </View>

              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={pickImageFromGallery}
                  >
                    <Text style={styles.changeImageText}>Alterar imagem</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadOptionsContainer}>
                  <TouchableOpacity
                    style={styles.uploadOption}
                    onPress={pickImageFromGallery}
                  >
                    <ImageIcon size={40} color="#005da8" />
                    <Text style={styles.uploadOptionText}>Escolher da Galeria</Text>
                  </TouchableOpacity>

                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={styles.uploadOption}
                      onPress={takePhoto}
                    >
                      <Camera size={40} color="#005da8" />
                      <Text style={styles.uploadOptionText}>Tirar Foto</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  (!selectedImage || isUploading) && styles.uploadButtonDisabled,
                ]}
                onPress={handleUpload}
                disabled={!selectedImage || isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Upload size={20} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>Enviar Comprovante</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={isUploading}
              >
                <Text style={styles.skipButtonText}>Pular por enquanto</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Por que enviar o comprovante?</Text>
                <Text style={styles.infoText}>
                  O comprovante ajuda a garantir que sua aposta seja processada corretamente em caso de qualquer divergência no sistema de pagamento.
                </Text>
              </View>
            </>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
  uploadOptionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  uploadOptionText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#005da8',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f7fafc',
  },
  changeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeImageText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#005da8',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#005da8',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 12,
  },
  uploadButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#64748b',
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#10b981',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
    textAlign: 'center',
  },
});
