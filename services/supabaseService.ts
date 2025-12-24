import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                    process.env.EXPO_PUBLIC_SUPABASE_URL ||
                    'https://abejbqhclgdvwbnnfigv.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZWpicWhjbGdkdndibm5maWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzU5ODksImV4cCI6MjA4MTA1MTk4OX0.0EkpKf67T1L8cezj2An-Lm9DtKT6ecxYFAbS3qb8vcQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BetData {
  user_name: string;
  user_cpf: string;
  user_email: string;
  user_phone: string;
  user_birthdate: string;
  contest_number: string;
  quota: string;
  amount: number;
}

export interface PaymentData {
  bet_id: string;
  transaction_id: string;
  pix_payload: string;
  amount: number;
  expires_at: Date;
}

export interface BetNumbersData {
  bet_id: string;
  numbers: number[];
  game_type: string;
}

export async function createBet(betData: BetData) {
  const { data, error } = await supabase
    .from('bets')
    .insert([betData])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao criar aposta:', error);
    throw error;
  }

  return data;
}

export async function createPayment(paymentData: PaymentData) {
  const { data, error } = await supabase
    .from('payments')
    .insert([paymentData])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao criar pagamento:', error);
    throw error;
  }

  return data;
}

export async function createBetNumbers(betNumbersData: BetNumbersData) {
  const { data, error } = await supabase
    .from('bet_numbers')
    .insert([betNumbersData])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao criar números:', error);
    throw error;
  }

  return data;
}

export async function getPaymentStatus(transactionId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, bets(*, bet_numbers(*))')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar status do pagamento:', error);
    throw error;
  }

  return data;
}

export async function updatePaymentStatus(
  transactionId: string,
  status: 'pending' | 'completed' | 'failed' | 'expired',
  webhookData?: any
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updateData.paid_at = new Date().toISOString();
  }

  if (webhookData) {
    updateData.webhook_data = webhookData;
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('transaction_id', transactionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar status do pagamento:', error);
    throw error;
  }

  if (status === 'completed' && data) {
    await supabase
      .from('bets')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', data.bet_id);
  }

  return data;
}

export async function getBetWithDetails(betId: string) {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      *,
      payments(*),
      bet_numbers(*)
    `)
    .eq('id', betId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar aposta:', error);
    throw error;
  }

  return data;
}

export function subscribeToPaymentStatus(
  transactionId: string,
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel(`payment_${transactionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `transaction_id=eq.${transactionId}`,
      },
      callback
    )
    .subscribe();

  return subscription;
}

export function generateRandomNumbers(count: number, max: number): number[] {
  const numbers = new Set<number>();

  while (numbers.size < count) {
    const num = Math.floor(Math.random() * max) + 1;
    numbers.add(num);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

export async function uploadPaymentReceipt(transactionId: string, imageBase64: string) {
  const updateData = {
    receipt_image: imageBase64,
    receipt_uploaded_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('transaction_id', transactionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao fazer upload do comprovante:', error);
    throw error;
  }

  return data;
}

export async function getAllBetsWithReceipts() {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      *,
      payments(*),
      bet_numbers(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar apostas:', error);
    throw error;
  }

  return data;
}

export async function getBetsWithReceiptsOnly() {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      *,
      payments!inner(*)
    `)
    .not('payments.receipt_image', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar apostas com comprovantes:', error);
    throw error;
  }

  return data;
}
