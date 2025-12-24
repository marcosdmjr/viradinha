# Sistema de Pagamento com Supabase

Este documento descreve o sistema completo de pagamento implementado para o aplicativo de apostas.

## Visão Geral

O sistema gerencia todo o fluxo de apostas desde a criação até a confirmação do pagamento:

1. Usuário escolhe o bolão e vai para a página de pagamento
2. Sistema gera QR Code PIX e salva dados no Supabase
3. Sistema monitora o status do pagamento em tempo real
4. Quando o pagamento é confirmado, usuário é redirecionado para página de confirmação
5. Página de confirmação exibe todos os detalhes da aposta

## Arquitetura

### Banco de Dados (Supabase)

Três tabelas principais:

#### `bets` - Apostas
- Armazena dados do apostador
- Status da aposta (pending, paid, cancelled)
- Informações do concurso e valor

#### `payments` - Pagamentos
- Vinculado à aposta via `bet_id`
- Contém código PIX e transaction_id
- Status do pagamento (pending, completed, failed, expired)
- Armazena dados do webhook

#### `bet_numbers` - Números Apostados
- Array com os números sorteados
- Vinculado à aposta

### Fluxo de Dados

```
1. Página de Pagamento (pagamento.tsx)
   ↓
   - Gera transação PIX via Genesys API
   - Cria registro na tabela `bets`
   - Cria registro na tabela `payments`
   - Gera números aleatórios e salva em `bet_numbers`
   ↓
2. Página QR Code (qrcode-pix.tsx)
   ↓
   - Exibe QR Code PIX
   - Monitora status do pagamento via:
     * Polling (verifica a cada 5 segundos)
     * Realtime subscription (atualização instantânea)
   ↓
3. Webhook (Edge Function: payment-webhook)
   ↓
   - Recebe notificação de pagamento da Genesys
   - Atualiza status em `payments`
   - Atualiza status em `bets`
   ↓
4. Página de Confirmação (pagamento-concluido.tsx)
   ↓
   - Exibe dados do apostador
   - Mostra composição do bolão
   - Lista os números apostados
   - Exibe informações do pagamento
```

## Serviços

### `services/supabaseService.ts`

Funções principais:
- `createBet()` - Cria nova aposta
- `createPayment()` - Cria registro de pagamento
- `createBetNumbers()` - Salva números apostados
- `getPaymentStatus()` - Busca status do pagamento
- `updatePaymentStatus()` - Atualiza status do pagamento
- `getBetWithDetails()` - Busca aposta com todos os detalhes
- `subscribeToPaymentStatus()` - Subscription em tempo real
- `generateRandomNumbers()` - Gera números aleatórios para aposta

## Páginas

### `/app/pagamento.tsx`
Página onde o usuário confirma os dados e escolhe a forma de pagamento.

**Funcionalidades:**
- Exibe dados do apostador
- Mostra detalhes do bolão
- Integra com Genesys API para gerar PIX
- Salva todos os dados no Supabase
- Redireciona para página QR Code

### `/app/qrcode-pix.tsx`
Página que exibe o QR Code PIX e monitora o pagamento.

**Funcionalidades:**
- Exibe QR Code gerado
- Código PIX copia e cola
- Timer de expiração (10 minutos)
- Monitoramento em tempo real:
  * Polling a cada 5 segundos
  * Subscription do Supabase Realtime
- Alerta quando pagamento confirmado
- Redirecionamento automático após confirmação

### `/app/pagamento-concluido.tsx`
Página de confirmação após pagamento bem-sucedido.

**Funcionalidades:**
- Exibe dados completos do apostador
- Mostra composição do bolão
- Lista os números apostados
- Informações do pagamento
- Comprovante visual

## Edge Function

### `payment-webhook`

Endpoint webhook para receber notificações da Genesys API.

**URL:** `https://[seu-projeto].supabase.co/functions/v1/payment-webhook`

**Método:** POST

**Payload esperado:**
```json
{
  "id": "transaction_id",
  "status": "paid|approved|completed|failed|rejected|expired|cancelled",
  ...outros dados
}
```

**Funcionamento:**
1. Recebe webhook da Genesys
2. Identifica transaction_id
3. Mapeia status para o sistema
4. Atualiza tabela `payments`
5. Se status = completed, atualiza tabela `bets`

## Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado:

- **Leitura**: Acesso público (qualquer usuário pode ler)
- **Inserção**: Acesso público (necessário para criar apostas)
- **Atualização**: Acesso público (necessário para atualizar status)

**Nota:** Em produção, considere restringir as políticas RLS para maior segurança.

## Monitoramento em Tempo Real

O sistema usa duas estratégias para monitorar pagamentos:

### 1. Polling
Verifica o status a cada 5 segundos fazendo uma query no banco.

**Vantagens:**
- Funciona sempre
- Simples de implementar

**Desvantagens:**
- Consome mais recursos
- Delay de até 5 segundos

### 2. Supabase Realtime
Subscription que escuta mudanças na tabela `payments`.

**Vantagens:**
- Atualização instantânea
- Eficiente em recursos

**Desvantagens:**
- Requer configuração do Supabase

## Configuração do Webhook

Para que o sistema funcione corretamente, é necessário configurar a URL do webhook na Genesys API.

**URL do webhook:**
```
https://[seu-projeto].supabase.co/functions/v1/payment-webhook
```

Esta URL já está configurada no arquivo `.env`:
```
EXPO_PUBLIC_GENESYS_WEBHOOK_URL=https://api.genesys.finance/webhook
```

**Importante:** A URL atual aponta para a Genesys. Você precisará configurar a Genesys para fazer forward para o endpoint do Supabase.

## Como Testar

### 1. Testar o Fluxo Completo

1. Execute o app
2. Faça login
3. Vá para a página de pagamento
4. Clique em "Pagar Agora"
5. Copie o código PIX
6. Faça o pagamento via PIX
7. Aguarde a confirmação automática

### 2. Simular Webhook Manualmente

Use um cliente HTTP (Postman, Insomnia, curl) para simular o webhook:

```bash
curl -X POST \
  https://[seu-projeto].supabase.co/functions/v1/payment-webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "transaction_id_aqui",
    "status": "paid"
  }'
```

### 3. Verificar Dados no Supabase

Acesse o Supabase Dashboard e verifique:
- Tabela `bets` - Nova aposta criada
- Tabela `payments` - Pagamento criado
- Tabela `bet_numbers` - Números gerados

## Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas no `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=sua-url-supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
EXPO_PUBLIC_GENESYS_API_SECRET=sua-chave-genesys
EXPO_PUBLIC_GENESYS_WEBHOOK_URL=https://api.genesys.finance/webhook
```

## Próximos Passos

Melhorias sugeridas:

1. **Notificações Push**: Notificar o usuário quando o pagamento for confirmado
2. **Email de Confirmação**: Enviar email com os detalhes da aposta
3. **Histórico de Apostas**: Página para visualizar apostas anteriores
4. **Compartilhamento**: Permitir compartilhar o comprovante
5. **RLS Mais Restritivo**: Implementar políticas mais seguras
6. **Logs e Auditoria**: Sistema de logs para rastrear operações
7. **Retry de Webhook**: Implementar retry automático em caso de falha
8. **Dashboard Admin**: Painel para gerenciar apostas e pagamentos

## Troubleshooting

### Pagamento não é confirmado automaticamente

1. Verifique se o webhook está configurado corretamente
2. Confira os logs da Edge Function no Supabase
3. Verifique se o Realtime está habilitado no projeto Supabase
4. Confirme que a URL do webhook está acessível

### Erro ao criar aposta

1. Verifique se as tabelas foram criadas corretamente
2. Confirme que as políticas RLS estão configuradas
3. Verifique os logs do console do app

### QR Code não aparece

1. Verifique se a API da Genesys está respondendo
2. Confirme as credenciais no `.env`
3. Verifique a conexão com a internet

## Suporte

Para dúvidas ou problemas, verifique:
- Logs do Supabase Dashboard
- Console do navegador / React Native Debugger
- Documentação da Genesys API
- Documentação do Supabase
