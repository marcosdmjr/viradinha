import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookData = await req.json();

    console.log('==== WEBHOOK RECEBIDO ====');
    console.log('Payload completo:', JSON.stringify(webhookData, null, 2));
    console.log('=========================');

    const transactionId =
      webhookData.id ||
      webhookData.transaction_id ||
      webhookData.transactionId ||
      webhookData.external_id ||
      webhookData.externalId ||
      webhookData.data?.id ||
      webhookData.data?.transaction_id;

    const status =
      webhookData.status ||
      webhookData.transaction_status ||
      webhookData.payment_status ||
      webhookData.data?.status;

    console.log('Transaction ID extraído:', transactionId);
    console.log('Status extraído:', status);

    if (!transactionId) {
      console.error('ERRO: Transaction ID não encontrado no payload');
      return new Response(
        JSON.stringify({
          error: 'Transaction ID não encontrado',
          received_payload: webhookData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let paymentStatus = 'pending';
    const statusLower = String(status).toLowerCase();

    if (
      statusLower === 'paid' ||
      statusLower === 'approved' ||
      statusLower === 'completed' ||
      statusLower === 'authorized' ||
      statusLower === 'success'
    ) {
      paymentStatus = 'completed';
    } else if (
      statusLower === 'failed' ||
      statusLower === 'rejected' ||
      statusLower === 'error'
    ) {
      paymentStatus = 'failed';
    } else if (
      statusLower === 'expired' ||
      statusLower === 'cancelled' ||
      statusLower === 'canceled'
    ) {
      paymentStatus = 'expired';
    }

    console.log('Status mapeado:', paymentStatus);

    const updateData: any = {
      status: paymentStatus,
      webhook_data: webhookData,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === 'completed') {
      updateData.paid_at = new Date().toISOString();
    }

    console.log('Buscando pagamento com transaction_id:', transactionId);

    const { data: existingPayment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (findError) {
      console.error('Erro ao buscar pagamento:', findError);
    }

    console.log('Pagamento encontrado:', existingPayment);

    if (!existingPayment) {
      console.error('ERRO: Nenhum pagamento encontrado com transaction_id:', transactionId);
      
      const { data: allPayments } = await supabase
        .from('payments')
        .select('transaction_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('Últimos 5 pagamentos no banco:', allPayments);

      return new Response(
        JSON.stringify({
          error: 'Pagamento não encontrado',
          transaction_id: transactionId,
          recent_payments: allPayments,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Atualizando pagamento...');

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('transaction_id', transactionId)
      .select()
      .maybeSingle();

    if (paymentError) {
      console.error('Erro ao atualizar pagamento:', paymentError);
      throw paymentError;
    }

    console.log('✓ Pagamento atualizado com sucesso');
    console.log('Novo status:', payment?.status);

    if (payment && paymentStatus === 'completed') {
      console.log('Atualizando aposta para status paid, bet_id:', payment.bet_id);

      const { data: updatedBet, error: betError } = await supabase
        .from('bets')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.bet_id)
        .select()
        .maybeSingle();

      if (betError) {
        console.error('Erro ao atualizar aposta:', betError);
      } else {
        console.log('✓ Aposta atualizada com sucesso:', updatedBet);
      }
    }

    console.log('==== WEBHOOK PROCESSADO COM SUCESSO ====');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processado com sucesso',
        payment: {
          id: payment?.id,
          bet_id: payment?.bet_id,
          transaction_id: payment?.transaction_id,
          status: payment?.status,
          paid_at: payment?.paid_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('ERRO CRÍTICO ao processar webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao processar webhook',
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});