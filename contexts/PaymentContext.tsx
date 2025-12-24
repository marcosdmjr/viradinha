import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createTransaction } from '@/services/genesysApi';
import { createBet, createPayment, createBetNumbers, generateRandomNumbers } from '@/services/supabaseService';
import Constants from 'expo-constants';
import { DEFAULT_PHONE, DEFAULT_EMAIL } from '@/constants/defaults';

interface PaymentContextData {
  isGeneratingPix: boolean;
  pixData: PixData | null;
  startPixGeneration: (params: GeneratePixParams) => Promise<void>;
  clearPixData: () => void;
  setPixData: (data: PixData | null) => void;
}

interface PixData {
  pixPayload: string;
  transactionId: string;
  betId: string;
  amount: number;
}

interface GeneratePixParams {
  valor: string;
  cotas: string;
  concurso: string;
  dezenas: string;
  boloes: string;
  userData: any;
  urlTracking?: {
    fullUrl: string;
    params: Record<string, string>;
  };
}

const PaymentContext = createContext<PaymentContextData>({} as PaymentContextData);

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

const formatCpf = (cpf: string) => {
  if (!cpf) return '';
  const numericOnly = cpf.replace(/[^0-9]/g, '');
  return numericOnly;
};

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);

  const startPixGeneration = async (params: GeneratePixParams) => {
    if (isGeneratingPix || pixData) {
      console.log('Já existe uma geração em andamento ou dados PIX já foram gerados');
      return;
    }

    setIsGeneratingPix(true);
    console.log('🚀 Iniciando geração do PIX em segundo plano...');

    try {
      const { valor, cotas, concurso, userData, urlTracking } = params;
      const amountNumber = parseFloat(valor.replace(',', '.'));

      const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                         process.env.EXPO_PUBLIC_SUPABASE_URL ||
                         'https://abejbqhclgdvwbnnfigv.supabase.co';
      const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

      const userName = userData.nome || userData.name || userData.nomeCompleto || '';
      const userCpf = formatCpf(userData.cpf || userData.CPF || userData.documento || '');
      const userBirthdate = userData.dataNascimento || userData.nascimento || userData.data_nascimento || userData.dt_nascimento || '';

      console.log('📝 Criando transação no Genesys...');
      const result = await createTransaction({
        externalId: `bolao_${concurso}_${Date.now()}`,
        totalAmount: amountNumber,
        webhookUrl: webhookUrl,
        items: [
          {
            id: concurso,
            title: getRandomProductName(),
            description: `Produto digital`,
            price: amountNumber,
            quantity: 1,
            is_physical: false,
          },
        ],
        customer: {
          name: userName,
          email: userData?.email || DEFAULT_EMAIL,
          phone: userData?.telefone || DEFAULT_PHONE,
          document_type: 'CPF',
          document: userCpf,
        },
        urlTracking: urlTracking || undefined,
      });

      if (!result.pix?.payload) {
        throw new Error('Código PIX não retornado');
      }

      console.log('✅ Transação criada:', result.id);
      console.log('💾 Salvando aposta no banco de dados...');

      const bet = await createBet({
        user_name: userName,
        user_cpf: userCpf,
        user_email: userData?.email || DEFAULT_EMAIL,
        user_phone: userData?.telefone || DEFAULT_PHONE,
        user_birthdate: userBirthdate,
        contest_number: concurso,
        quota: cotas,
        amount: amountNumber,
      });

      if (!bet) {
        throw new Error('Erro ao criar aposta');
      }

      console.log('✅ Aposta criada:', bet.id);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await createPayment({
        bet_id: bet.id,
        transaction_id: result.id,
        pix_payload: result.pix.payload,
        amount: amountNumber,
        expires_at: expiresAt,
      });

      console.log('✅ Pagamento registrado');

      const randomNumbers = generateRandomNumbers(6, 60);
      await createBetNumbers({
        bet_id: bet.id,
        numbers: randomNumbers,
        game_type: 'mega-sena',
      });

      console.log('✅ Números gerados');

      setPixData({
        pixPayload: result.pix.payload,
        transactionId: result.id,
        betId: bet.id,
        amount: amountNumber,
      });

      console.log('🎉 Geração do PIX concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao gerar PIX em segundo plano:', error);
      setPixData(null);
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const clearPixData = () => {
    setPixData(null);
  };

  const updatePixData = (data: PixData | null) => {
    setPixData(data);
  };

  return (
    <PaymentContext.Provider value={{ isGeneratingPix, pixData, startPixGeneration, clearPixData, setPixData: updatePixData }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment deve ser usado dentro de um PaymentProvider');
  }
  return context;
}
