# Facebook Pixel - Configuração Implementada

## 📱 Visão Geral

O Meta Pixel (Facebook Pixel) foi implementado no aplicativo React Native usando o SDK `react-native-fbsdk-next`. Este documento descreve a implementação e os eventos rastreados.

## 🔧 Configuração

### 1. Dependências Instaladas
```bash
npm install react-native-fbsdk-next
```

### 2. Configuração no app.json

O Facebook App ID foi configurado no arquivo `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "FacebookAppID": "4342804642618023",
      "FacebookDisplayName": "Loterias App",
      "FacebookAutoLogAppEventsEnabled": true,
      "FacebookAdvertiserIDCollectionEnabled": true
    }
  },
  "android": {
    "package": "com.loteriasapp",
    "permissions": [
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ],
    "meta-data": {
      "com.facebook.sdk.ApplicationId": "4342804642618023",
      "com.facebook.sdk.AutoLogAppEventsEnabled": "true",
      "com.facebook.sdk.AdvertiserIDCollectionEnabled": "true"
    }
  }
}
```

### 3. Inicialização

O SDK é inicializado no arquivo `app/_layout.tsx`:

```typescript
import { Settings } from 'react-native-fbsdk-next';
import { facebookPixel } from '@/services/facebookPixel';

Settings.setAppID('4342804642618023');
Settings.initializeSDK();

// Inicialização após carregamento das fontes
facebookPixel.initialize();
```

## 📊 Eventos Rastreados

### 1. PageView
Rastreado em todas as telas principais:
- **Login** (`/login`)
- **Pagamento** (`/pagamento`)
- **QR Code PIX** (`/qrcode-pix`)

### 2. Lead
Disparado quando o usuário completa o login com sucesso:
- **Localização**: `app/login.tsx`
- **Momento**: Após consulta bem-sucedida do CPF

### 3. CompleteRegistration
Disparado quando o usuário completa a validação de identidade:
- **Localização**: `app/confirmacao-seguranca-2.tsx`
- **Momento**: Quando confirma corretamente a data de nascimento

### 4. AddToCart
Disparado quando o usuário entra na tela de pagamento:
- **Localização**: `app/pagamento.tsx`
- **Momento**: Ao carregar a tela de pagamento
- **Parâmetros**: Valor e moeda (BRL)

### 5. InitiateCheckout
Disparado quando o usuário entra na tela do QR Code PIX:
- **Localização**: `app/qrcode-pix.tsx`
- **Momento**: Ao carregar a tela do QR Code (automaticamente)
- **Parâmetros**: Valor e moeda (BRL)

### 6. Purchase
Disparado quando o QR Code PIX é gerado com sucesso:
- **Localização**: `app/qrcode-pix.tsx`
- **Momento**: Ao carregar o QR Code
- **Parâmetros**: Valor e moeda (BRL)

### 7. Eventos Customizados

#### PixCodeCopied
Disparado quando o usuário copia o código PIX:
- **Localização**: `app/qrcode-pix.tsx`
- **Parâmetros**:
  - `transactionId`: ID da transação
  - `amount`: Valor da transação

## 🗂️ Estrutura de Arquivos

```
services/
  └── facebookPixel.ts        # Serviço de rastreamento do Facebook Pixel

app/
  ├── _layout.tsx             # Inicialização do SDK
  ├── login.tsx               # PageView + Lead
  ├── pagamento.tsx           # PageView + AddToCart
  ├── qrcode-pix.tsx          # PageView + InitiateCheckout + Purchase + PixCodeCopied
  └── confirmacao-seguranca-2.tsx  # CompleteRegistration
```

## 🎯 Funil de Conversão

1. **PageView** (Login) → Usuário visualiza tela de login
2. **Lead** → Usuário completa login
3. **CompleteRegistration** → Usuário valida identidade
4. **PageView** (Pagamento) → Usuário acessa tela de pagamento
5. **AddToCart** → Produto adicionado ao carrinho
6. **PageView** (QR Code) → QR Code é exibido
7. **InitiateCheckout** → Usuário entra na tela do QR Code (disparo automático)
8. **Purchase** → Pagamento iniciado (QR Code gerado)
9. **PixCodeCopied** → Usuário copia código PIX

## 🔍 Monitoramento

Para verificar se os eventos estão sendo enviados corretamente:

1. Acesse o [Gerenciador de Eventos do Facebook](https://business.facebook.com/events_manager2/)
2. Selecione seu Pixel ID: **4342804642618023**
3. Vá para "Test Events" para ver eventos em tempo real
4. Use o aplicativo e verifique se os eventos aparecem

## 📝 Notas Importantes

- **ATUALIZADO**: Os eventos agora funcionam em todas as plataformas (Web, iOS e Android)
- **Web**: O pixel é injetado automaticamente via JavaScript quando o app roda no navegador
- **iOS/Android**: Usa o SDK nativo `react-native-fbsdk-next` para rastreamento
- **Pixel ID atualizado**: `4342804642618023`
- Todos os valores monetários são enviados em reais (BRL)
- O SDK inicializa automaticamente ao abrir o aplicativo (apenas em iOS/Android)
- Os eventos são enviados mesmo sem conexão e sincronizados posteriormente
- A importação do SDK é condicional usando `require()` para evitar erros na web

## 🚀 Próximos Passos

Para um build de produção:

1. **iOS**:
   - Execute `npx expo prebuild -p ios`
   - Configure o Facebook SDK no Xcode se necessário

2. **Android**:
   - Execute `npx expo prebuild -p android`
   - Verifique se as permissões foram adicionadas automaticamente

3. **Teste**:
   - Use o Test Events do Facebook para validar
   - Verifique os dados no Dashboard de Anúncios
