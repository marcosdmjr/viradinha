# Teste do Webhook de Pagamento

Este documento explica como testar o fluxo completo de pagamento e redirecionamento.

## Fluxo de Verificação

O sistema verifica o status do pagamento de duas formas:

1. **Polling a cada 5 segundos**: Consulta o banco de dados verificando se o status mudou
2. **Realtime (Subscription)**: Recebe atualizações em tempo real quando o webhook atualiza o banco

## Como Testar

### 1. Simular Webhook da Genesys

Use este comando para simular um pagamento confirmado:

```bash
curl -X POST https://[SEU-PROJETO].supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ID_DA_TRANSACAO_GENESYS",
    "transaction_id": "ID_DA_TRANSACAO_GENESYS",
    "status": "paid",
    "amount": 7.00,
    "paid_at": "2025-12-10T12:00:00Z"
  }'
```

**IMPORTANTE:** Use o `transaction_id` exato que foi gerado ao criar o PIX (disponível na URL da página do QR Code).

### 2. Verificar Logs

#### Logs do Webhook (Supabase Dashboard)

1. Acesse: https://supabase.com/dashboard/project/[SEU-PROJETO]/logs/edge-functions
2. Selecione a função `payment-webhook`
3. Verifique os logs:
   - "Webhook recebido"
   - "Atualizando pagamento com transaction_id"
   - "Pagamento atualizado com sucesso"
   - "Atualizando status da aposta para paid"

#### Logs do Frontend (Console do Navegador)

1. Abra o Console do navegador (F12)
2. Na página do QR Code, você verá:
   - "Verificando status do pagamento..."
   - "Status do pagamento: pending" (até receber o webhook)
   - "Status do pagamento: completed" (após webhook)
   - "Pagamento confirmado! Redirecionando..."
   - "Realtime update recebido" (se a subscription funcionar)

### 3. Fluxo Esperado

```
1. Usuário na página QR Code (qrcode-pix)
   ↓
2. Sistema verifica status a cada 5 segundos
   Console: "Verificando status do pagamento..."
   Console: "Status do pagamento: pending"
   ↓
3. Webhook recebe notificação da Genesys
   Log: "Webhook recebido: {status: 'paid'}"
   Log: "Atualizando pagamento com transaction_id: xxx"
   ↓
4. Banco de dados atualizado
   payments.status = 'completed'
   payments.paid_at = timestamp
   bets.status = 'paid'
   ↓
5. Polling detecta mudança (em até 5 segundos)
   Console: "Status do pagamento: completed"
   Console: "Pagamento confirmado! Redirecionando..."
   ↓
6. Alert exibido ao usuário
   "Pagamento Confirmado!"
   ↓
7. Usuário clica em "Ver Comprovante"
   ↓
8. Redirecionamento para /pagamento-concluido
   params: { betId: "xxx" }
```

## Troubleshooting

### Problema: Webhook recebido mas status não atualiza

**Verificar:**
1. O `transaction_id` no webhook corresponde ao da tabela `payments`
2. Logs do webhook mostram "Pagamento atualizado com sucesso"
3. Query direto no banco: `SELECT * FROM payments WHERE transaction_id = 'xxx'`

**Solução:**
```sql
-- Verificar se o pagamento existe
SELECT * FROM payments WHERE transaction_id = 'SEU_TRANSACTION_ID';

-- Se não existir, verificar com outro campo
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Atualizar manualmente para teste
UPDATE payments
SET status = 'completed', paid_at = NOW(), updated_at = NOW()
WHERE transaction_id = 'SEU_TRANSACTION_ID';
```

### Problema: Status atualiza mas não redireciona

**Verificar:**
1. Console do navegador mostra "Pagamento confirmado! Redirecionando..."
2. O `betId` está presente nos params
3. Não há erros no console

**Solução:**
- Verifique se há múltiplas abas abertas da mesma página
- Limpe o cache do navegador e recarregue
- Verifique se o Alert está sendo bloqueado

### Problema: "Nenhum pagamento encontrado"

**Causa:** O `transaction_id` enviado no webhook não corresponde ao registrado no banco.

**Solução:**
1. Verifique o campo exato usado pela Genesys (pode ser `id`, `transaction_id`, `external_id`)
2. Ajuste o webhook para mapear corretamente:

```typescript
const transactionId = webhookData.id ||
                     webhookData.transaction_id ||
                     webhookData.external_id;
```

### Problema: Polling não detecta mudança

**Verificar:**
1. A página não foi fechada/recarregada
2. O useEffect está rodando (verifique logs)
3. Não há erros de rede bloqueando as requisições

**Solução:**
- Recarregue a página QR Code
- Verifique conexão com internet
- Teste manualmente: `await getPaymentStatus('transaction_id')`

## Teste Manual no Console

Abra o Console do navegador na página QR Code e execute:

```javascript
// Buscar status do pagamento
const { getPaymentStatus } = await import('./services/supabaseService');
const payment = await getPaymentStatus('SEU_TRANSACTION_ID');
console.log('Payment status:', payment);

// Forçar verificação
if (payment?.status === 'completed') {
  console.log('Pagamento confirmado!');
  // Redirecionar manualmente
  window.location.href = `/pagamento-concluido?betId=${payment.bet_id}`;
}
```

## Verificar RLS (Row Level Security)

Se o status não está sendo lido, pode ser um problema de permissões:

```sql
-- Verificar políticas da tabela payments
SELECT * FROM pg_policies WHERE tablename = 'payments';

-- Testar leitura com anon key (simula frontend)
SET ROLE anon;
SELECT * FROM payments WHERE transaction_id = 'SEU_TRANSACTION_ID';
RESET ROLE;

-- Se retornar vazio, as políticas RLS estão bloqueando
-- Adicione política de leitura:
CREATE POLICY "Allow public read payments"
ON payments FOR SELECT
USING (true);
```

## URLs Importantes

- **Webhook URL:** `https://[SEU-PROJETO].supabase.co/functions/v1/payment-webhook`
- **Logs Edge Functions:** `https://supabase.com/dashboard/project/[SEU-PROJETO]/logs/edge-functions`
- **Logs Database:** `https://supabase.com/dashboard/project/[SEU-PROJETO]/logs/postgres`
- **Realtime Inspector:** `https://supabase.com/dashboard/project/[SEU-PROJETO]/logs/realtime`

## Tempo de Resposta Esperado

- **Webhook → Banco atualizado:** < 1 segundo
- **Banco atualizado → Polling detecta:** até 5 segundos
- **Banco atualizado → Realtime detecta:** < 1 segundo
- **Total (webhook até alerta):** 1-5 segundos

Se demorar mais que isso, há um problema na configuração.
