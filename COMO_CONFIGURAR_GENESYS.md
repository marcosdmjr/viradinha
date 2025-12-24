# Como Configurar o Webhook na Genesys

## URL do Webhook

Quando criar a transação na Genesys, configure esta URL:

```
https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook
```

## Onde Configurar

No arquivo `pagamento.tsx`, a URL já está sendo passada na criação da transação:

```typescript
const result = await createTransaction({
  externalId: externalId,
  totalAmount: pixAmount,
  webhookUrl: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/payment-webhook`,
  // ... resto dos parâmetros
});
```

## Verificar Configuração Atual

A URL atual sendo enviada para Genesys é:

```
https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook
```

## Formato do Payload

A Genesys deve enviar um webhook com este formato quando o pagamento for confirmado:

```json
{
  "id": "cb0cc2d7-2af3-4ac1-8059-f8b95c9f3554",
  "status": "AUTHORIZED"
}
```

OU qualquer uma destas variações:

```json
{
  "transaction_id": "...",
  "status": "paid"
}
```

```json
{
  "external_id": "...",
  "payment_status": "completed"
}
```

```json
{
  "data": {
    "id": "...",
    "status": "AUTHORIZED"
  }
}
```

## Status Válidos para Pagamento Confirmado

O webhook aceita qualquer um destes status (case insensitive):

- `AUTHORIZED` (padrão Genesys)
- `paid`
- `approved`
- `completed`
- `success`

## Testar Configuração

Para testar se a Genesys está enviando o webhook corretamente:

1. Faça uma compra real ou teste
2. Pague o PIX
3. Aguarde até 5 segundos
4. Verifique os logs no Supabase:
   - https://supabase.com/dashboard/project/crhjgypwfywpwhkzamqb/logs/edge-functions

## Problemas Comuns

### Webhook não é chamado

**Causa**: A URL do webhook não foi configurada na Genesys ou está incorreta.

**Solução**:
1. Verifique se a URL está sendo passada corretamente no `createTransaction`
2. Confirme com a Genesys que o webhook está configurado
3. Teste manualmente: `curl -X POST https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook -H "Content-Type: application/json" -d '{"id": "SEU_ID", "status": "AUTHORIZED"}'`

### Webhook é chamado mas não atualiza

**Causa**: O transaction_id enviado pela Genesys não corresponde ao salvo no banco.

**Solução**:
1. Verifique os logs da edge function
2. Procure por "Transaction ID extraído:"
3. Compare com o transaction_id salvo no banco
4. Ajuste o mapeamento de campos no webhook se necessário

### Demora mais que 5 segundos

**Causa**: O polling do frontend roda a cada 5 segundos.

**Solução**: Isso é normal. O redirecionamento acontecerá em até 5 segundos após o webhook ser processado.

## Verificar se Está Funcionando

Execute este comando SQL para ver se o pagamento foi confirmado:

```sql
SELECT
  p.transaction_id,
  p.status as payment_status,
  p.paid_at,
  b.status as bet_status,
  b.user_name
FROM payments p
JOIN bets b ON b.id = p.bet_id
ORDER BY p.created_at DESC
LIMIT 5;
```

Se `payment_status` = 'completed' e `bet_status` = 'paid', está funcionando!

## Fluxo Completo

```
1. Usuário cria aposta e pagamento
   ↓
2. Sistema chama Genesys API passando webhook_url
   ↓
3. Genesys retorna PIX payload
   ↓
4. Usuário paga PIX
   ↓
5. Genesys detecta pagamento
   ↓
6. Genesys chama webhook:
   POST https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook
   Body: {"id": "...", "status": "AUTHORIZED"}
   ↓
7. Webhook atualiza banco:
   payments.status = 'completed'
   payments.paid_at = now()
   bets.status = 'paid'
   ↓
8. Frontend detecta mudança (polling 5s)
   ↓
9. Alert aparece para usuário
   ↓
10. Usuário clica "Ver Comprovante"
   ↓
11. Redireciona para /pagamento-concluido
```

## Ambiente de Produção

Quando colocar em produção:

1. Certifique-se que `EXPO_PUBLIC_SUPABASE_URL` está correto
2. A URL do webhook será automaticamente construída
3. Não precisa alterar nada no código
4. A Genesys DEVE ter a URL cadastrada no painel deles

## Suporte Genesys

Se o webhook não estiver funcionando, entre em contato com o suporte da Genesys e forneça:

- URL do webhook: `https://crhjgypwfywpwhkzamqb.supabase.co/functions/v1/payment-webhook`
- Método: `POST`
- Content-Type: `application/json`
- Campos obrigatórios: `id` (ou `transaction_id`) e `status`
