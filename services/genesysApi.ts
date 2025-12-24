import Constants from 'expo-constants';
import { getUserIP } from './ipService';

const API_BASE_URL = 'https://api.genesys.finance';

export function formatPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

interface CreateTransactionParams {
  externalId: string;
  totalAmount: number;
  webhookUrl: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    quantity: number;
    is_physical: boolean;
  }>;
  customer: {
    name: string;
    email: string;
    phone: string;
    document_type: 'CPF' | 'CNPJ';
    document: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  urlTracking?: {
    fullUrl: string;
    params: Record<string, string>;
  };
}

interface TransactionResponse {
  id: string;
  external_id: string;
  status: 'AUTHORIZED' | 'PENDING' | 'CHARGEBACK' | 'FAILED' | 'IN_DISPUTE';
  total_value: number;
  customer: {
    email: string;
    name: string;
  };
  payment_method: string;
  pix: {
    payload: string;
  };
  hasError: boolean;
}

export async function createTransaction(
  params: CreateTransactionParams
): Promise<TransactionResponse> {
  const apiSecret = Constants.expoConfig?.extra?.EXPO_PUBLIC_GENESYS_API_SECRET ||
                    process.env.EXPO_PUBLIC_GENESYS_API_SECRET;

  if (!apiSecret) {
    throw new Error('API Secret não configurado');
  }

  if (!params.externalId || typeof params.externalId !== 'string') {
    throw new Error('external_id é obrigatório e deve ser uma string');
  }

  if (!params.totalAmount || typeof params.totalAmount !== 'number' || params.totalAmount <= 0) {
    throw new Error('total_amount é obrigatório e deve ser um número maior que zero');
  }

  if (!params.webhookUrl || typeof params.webhookUrl !== 'string') {
    throw new Error('webhook_url é obrigatório e deve ser uma string');
  }

  if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
    throw new Error('items é obrigatório e deve conter pelo menos um item');
  }

  if (!params.customer || typeof params.customer !== 'object') {
    throw new Error('customer é obrigatório');
  }

  if (!params.customer.name || !params.customer.email || !params.customer.phone || !params.customer.document) {
    throw new Error('Campos obrigatórios do customer: name, email, phone, document');
  }

  if (!validateEmail(params.customer.email)) {
    throw new Error('Email inválido');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const userIP = await getUserIP();
    console.log('🌐 IP do usuário:', userIP);

    const customerData = { ...params.customer };

    customerData.phone = formatPhone(customerData.phone);
    customerData.document = customerData.document.replace(/\D/g, '');

    console.log('📱 Telefone formatado:', customerData.phone);
    console.log('📄 CPF limpo:', customerData.document);

    if (params.urlTracking?.params) {
      const utmParams = params.urlTracking.params;

      if (utmParams.utm_source) customerData.utm_source = utmParams.utm_source;
      if (utmParams.utm_medium) customerData.utm_medium = utmParams.utm_medium;
      if (utmParams.utm_campaign) customerData.utm_campaign = utmParams.utm_campaign;
      if (utmParams.utm_content) customerData.utm_content = utmParams.utm_content;
      if (utmParams.utm_term) customerData.utm_term = utmParams.utm_term;

      console.log('📊 UTMs extraídas:', {
        utm_source: customerData.utm_source,
        utm_medium: customerData.utm_medium,
        utm_campaign: customerData.utm_campaign,
        utm_content: customerData.utm_content,
        utm_term: customerData.utm_term,
      });
    }

    const requestBody = {
      external_id: params.externalId,
      total_amount: params.totalAmount,
      payment_method: 'PIX',
      webhook_url: params.webhookUrl,
      items: params.items,
      ip: userIP,
      customer: customerData,
    };

    console.log('📤 Enviando para Genesys:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-secret': apiSecret,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('📥 Resposta Genesys (status ' + response.status + '):', responseText);

    if (!response.ok) {
      console.error('❌ Erro da API Genesys:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        requestBody: requestBody,
      });
      throw new Error(`Erro na API Genesys (${response.status}): ${responseText}`);
    }

    const result = JSON.parse(responseText);

    if (result.hasError) {
      console.error('❌ Genesys retornou erro:', result);
      throw new Error('Erro ao processar transação: ' + (result.message || 'Erro desconhecido'));
    }

    console.log('✅ Transação criada com sucesso:', result.id);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏱️ Timeout ao criar transação');
      throw new Error('Tempo esgotado. Tente novamente.');
    }
    console.error('❌ Erro ao criar transação:', error);
    throw error;
  }
}

export async function getTransaction(transactionId: string) {
  const apiSecret = Constants.expoConfig?.extra?.EXPO_PUBLIC_GENESYS_API_SECRET ||
                    process.env.EXPO_PUBLIC_GENESYS_API_SECRET;

  if (!apiSecret) {
    throw new Error('API Secret não configurado');
  }

  if (!transactionId || typeof transactionId !== 'string') {
    throw new Error('transaction_id é obrigatório e deve ser uma string');
  }

  try {
    console.log('🔍 Consultando transação:', transactionId);

    const response = await fetch(`${API_BASE_URL}/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-secret': apiSecret,
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Erro ao buscar transação:', {
        transactionId,
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });
      throw new Error(`Erro na API Genesys (${response.status}): ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('✅ Transação encontrada:', result.id, 'Status:', result.status);
    return result;
  } catch (error) {
    console.error('❌ Erro ao consultar transação:', error);
    throw error;
  }
}
