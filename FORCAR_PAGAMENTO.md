# FORÇAR PAGAMENTO - Teste Manual

## URL do Webhook

```
https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook
```

## Seus Transaction IDs

Baseado no banco de dados, você tem estes pagamentos pendentes:

1. **Transaction ID**: `cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554`
   - Bet ID: `a6d3c292-923c-4418-869a-b690f13a1af7`
   - Status atual: `pending`
   - Criado em: 2025-12-10 13:05:03

2. **Transaction ID**: `5f6af0c8-c6aa-4c53-8e7c-8d4bece1752c`
   - Bet ID: `d01dddde-32c6-43ae-a220-b17483fd5e7c`
   - Status atual: `pending`
   - Criado em: 2025-12-10 12:58:07

## FORÇAR PAGAMENTO DO MAIS RECENTE

Execute este comando (substitua SEU_TRANSACTION_ID):

```bash
curl -X POST https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554",
    "status": "AUTHORIZED"
  }'
```

## Formatos Suportados

O webhook agora aceita TODOS estes formatos:

### Formato 1: ID direto
```json
{
  "id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554",
  "status": "AUTHORIZED"
}
```

### Formato 2: transaction_id
```json
{
  "transaction_id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554",
  "status": "paid"
}
```

### Formato 3: external_id
```json
{
  "external_id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554",
  "status": "completed"
}
```

### Formato 4: Objeto data (padrão Genesys)
```json
{
  "data": {
    "id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554",
    "status": "AUTHORIZED"
  }
}
```

## Status Aceitos

O webhook aceita qualquer um destes status como "pago":
- `paid`
- `approved`
- `completed`
- `AUTHORIZED` (padrão Genesys)
- `success`

## Testar Direto no Navegador

1. Abra o Console do navegador (F12)
2. Cole e execute:

```javascript
fetch('https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554',
    status: 'AUTHORIZED'
  })
}).then(r => r.json()).then(console.log);
```

## Verificar Logs

1. Acesse: https://supabase.com/dashboard/project/crhjgypwfywpwhkzamqb/logs/edge-functions

2. Selecione `payment-webhook`

3. Procure por:
   ```
   ==== WEBHOOK RECEBIDO ====
   Payload completo: { ... }
   Transaction ID extraído: ...
   Status extraído: ...
   Status mapeado: completed
   ✓ Pagamento atualizado com sucesso
   ✓ Aposta atualizada com sucesso
   ==== WEBHOOK PROCESSADO COM SUCESSO ====
   ```

## Atualizar Direto no Banco (Último Recurso)

Se o webhook não funcionar, atualize direto no banco:

```sql
-- Atualizar o pagamento mais recente
UPDATE payments
SET
  status = 'completed',
  paid_at = NOW(),
  updated_at = NOW(),
  webhook_data = '{"manual": true, "status": "AUTHORIZED"}'::jsonb
WHERE transaction_id = 'cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554';

-- Atualizar a aposta correspondente
UPDATE bets
SET
  status = 'paid',
  updated_at = NOW()
WHERE id = 'a6d3c292-923c-4418-869a-b690f13a1af7';

-- Verificar se atualizou
SELECT
  p.transaction_id,
  p.status as payment_status,
  p.paid_at,
  b.status as bet_status,
  b.user_name
FROM payments p
JOIN bets b ON b.id = p.bet_id
WHERE p.transaction_id = 'cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554';
```

## O que Vai Acontecer

1. Webhook recebe o payload
2. Extrai o transaction_id
3. Busca o pagamento no banco
4. Atualiza status para 'completed'
5. Atualiza paid_at com timestamp
6. Atualiza a aposta para 'paid'
7. Frontend detecta mudança (polling ou realtime)
8. Alert aparece
9. Usuário clica "Ver Comprovante"
10. Redireciona para /pagamento-concluido

## Troubleshooting

### Erro: "Transaction ID não encontrado no payload"
- Verifique se está enviando o campo `id` ou `transaction_id`

### Erro: "Pagamento não encontrado"
- Confirme o transaction_id está correto
- Verifique no banco: `SELECT * FROM payments ORDER BY created_at DESC LIMIT 5`

### Webhook retorna 200 mas status não muda
- Verifique os logs no Supabase Dashboard
- Pode haver erro de permissão RLS (mas já está liberado)

### Frontend não detecta mudança
- Verifique se está na página QR Code
- Veja logs do console: "Verificando status do pagamento..."
- O polling roda a cada 5 segundos

## Comando COMPLETO para Copiar e Colar

```bash
curl -X POST https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554", "status": "AUTHORIZED"}' && echo "\n✓ Webhook enviado!"
```

Execute este comando no terminal e o pagamento será marcado como pago!
