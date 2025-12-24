# Valores das Cotas - Bolão Mega da Virada

Este documento descreve os valores das cotas disponíveis e regras especiais de pagamento.

## Tabela de Cotas e Valores

| Bolão | Dezenas | Valor Exibido | Valor PIX | Cotas Disponíveis | Chance de Ganhar |
|-------|---------|---------------|-----------|-------------------|------------------|
| 1 | 15 | R$ 49,90 | **R$ 7,00** | 9/100 | 37x |
| 2 | 18 | R$ 79,90 | R$ 79,90 | 7/100 | 173x |
| 3 | 20 | R$ 99,90 | R$ 99,90 | 3/100 | 1.327x |
| 4 | 20 (Duplo) | R$ 179,90 | R$ 179,90 | 1/100 | 2.654x |
| 5 | 20 | R$ 99,90 | R$ 99,90 | ESGOTADO | 1.327x |

## Regra Especial - Bolão de 15 Dezenas

O **Bolão 1 (15 Dezenas)** possui uma promoção especial:

### Valor Exibido
- Interface mostra: **R$ 49,90**
- Este é o valor da cota registrado no banco de dados

### Valor do PIX
- PIX gerado: **R$ 7,00**
- Este é o valor real que o cliente paga via PIX
- Valor enviado para a API Genesys: R$ 7,00

### Implementação Técnica

A lógica está implementada em dois arquivos:

#### 1. `app/pagamento.tsx` (Linha 121)
```typescript
const pixAmount = amountNumber === 49.90 ? 7.00 : amountNumber;
```

Esta linha verifica se o valor é R$ 49,90 e converte para R$ 7,00 antes de:
- Enviar para a API Genesys
- Gerar o QR Code PIX
- Salvar no banco de dados (tabela payments)

#### 2. `app/qrcode-pix.tsx` (Linha 38-39)
```typescript
const amountNumber = parseFloat(amount.replace(',', '.'));
const displayAmount = amountNumber === 49.90 ? '7,00' : amount;
```

Esta lógica converte o valor exibido no QR Code de R$ 49,90 para R$ 7,00.

## Fluxo de Valores

```
Usuário seleciona Bolão 15 Dezenas
  ↓
Página de Pagamento exibe: R$ 49,90
  ↓
Sistema detecta valor = 49.90
  ↓
Converte para pixAmount = 7.00
  ↓
Envia 7.00 para Genesys API
  ↓
Gera QR Code PIX de R$ 7,00
  ↓
Página QR Code exibe: R$ 7,00
  ↓
Cliente paga: R$ 7,00
  ↓
Banco registra payment.amount = 7.00
  ↓
Banco registra bet.amount = 49.90
```

## Modificando Valores Promocionais

Para adicionar ou alterar valores promocionais:

### 1. Identificar o Valor Original
Primeiro, identifique o valor da cota que terá desconto (ex: R$ 79,90).

### 2. Atualizar `app/pagamento.tsx`
Adicione a condição na lógica de conversão:

```typescript
const pixAmount =
  amountNumber === 49.90 ? 7.00 :   // Bolão 15 dezenas
  amountNumber === 79.90 ? 10.00 :  // Novo: Bolão 18 dezenas
  amountNumber;  // Outros mantêm valor original
```

### 3. Atualizar `app/qrcode-pix.tsx`
Adicione a conversão para exibição:

```typescript
const displayAmount =
  amountNumber === 49.90 ? '7,00' :
  amountNumber === 79.90 ? '10,00' :
  amount;
```

### 4. Atualizar Documentação
Atualize este arquivo com os novos valores promocionais.

## Considerações Importantes

### Banco de Dados
- Tabela `bets`: Armazena o valor **original** da cota (R$ 49,90)
- Tabela `payments`: Armazena o valor **real pago** via PIX (R$ 7,00)

### Relatórios e Analytics
Ao criar relatórios financeiros:
- Use `payments.amount` para valores recebidos
- Use `bets.amount` para valores das apostas
- A diferença representa descontos/promoções

### Facebook Pixel
Os eventos do Facebook Pixel usam o valor original (R$ 49,90) para tracking de conversão.

## Webhook de Pagamento

O webhook recebe confirmação baseada no valor do PIX (R$ 7,00), não no valor da aposta.

Ao processar webhooks:
- Buscar pagamento por `transaction_id`
- Validar `amount` contra `payments.amount` (R$ 7,00)
- Não validar contra `bets.amount` (R$ 49,90)

## Testando a Funcionalidade

### Teste Manual

1. Acesse a página inicial
2. Selecione o "Bolão 1 - 15 Dezenas (R$ 49,90)"
3. Na página de pagamento, confirme que exibe R$ 49,90
4. Clique em "Pagar Agora"
5. Na página do QR Code, verifique que exibe **R$ 7,00**
6. Verifique no banco de dados:
   - `payments.amount = 7.00`
   - `bets.amount = 49.90`

### Teste com Webhook

```bash
# Simular pagamento confirmado
curl -X POST https://[seu-projeto].supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "seu_id_transacao",
    "status": "paid",
    "amount": 7.00
  }'
```

## FAQ

**P: Por que o banco salva dois valores diferentes?**
R: O `bets.amount` representa o valor da cota/aposta, enquanto `payments.amount` é o valor efetivamente pago. Isso permite rastrear promoções e descontos.

**P: O que acontece se eu mudar o valor da cota de R$ 49,90 para outro valor?**
R: Você precisará atualizar a condição em ambos os arquivos (`pagamento.tsx` e `qrcode-pix.tsx`) para o novo valor.

**P: Como adicionar mais promoções?**
R: Siga o padrão de condicionais ternárias nas linhas indicadas acima, adicionando novos pares valor-original → valor-promocional.

**P: O usuário verá R$ 49,90 ou R$ 7,00?**
R: Na página de seleção e pagamento inicial, verá R$ 49,90. Na página do QR Code e comprovante, verá R$ 7,00 (valor real a pagar).
