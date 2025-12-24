# Deploy na Vercel

Este guia explica como fazer o deploy correto na Vercel e resolver problemas de tela branca.

## Variáveis de Ambiente

**CRÍTICO**: Você DEVE configurar todas as variáveis de ambiente na Vercel para evitar tela branca.

### Como Configurar no Vercel:

1. Acesse o painel do projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione TODAS as variáveis abaixo:

```
EXPO_PUBLIC_GENESYS_API_SECRET=sk_d5f20a070dbfb7ac56d8c07d345ee12c9680cc4fd443a699e4d937fa41999e70a426fd72dc623e456331c293d8689a58a5a19e42295ff10ae0f7c58c03cd06a0
EXPO_PUBLIC_GENESYS_WEBHOOK_URL=https://api.genesys.finance/webhook
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaGpneXB3Znl3cHdoa3phbXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzAxNzIsImV4cCI6MjA4MDk0NjE3Mn0.Y2fjy2HuXEMZrVY5uXXFUBwE63Is1lkD1OnfGmtMm6g
EXPO_PUBLIC_SUPABASE_URL=https://crhjgypwfywpwhkzamqb.supabase.co
```

4. Marque as variáveis para serem usadas em **Production**, **Preview** e **Development**
5. Salve as alterações
6. Faça um novo deploy ou clique em **Redeploy** para aplicar as variáveis

## Verificando Erros

Se ainda houver tela branca após configurar as variáveis:

1. Abra o Console do Navegador (F12)
2. Vá na aba **Console**
3. Procure por erros em vermelho
4. Compartilhe os erros encontrados para análise

## Build Local

Para testar se o build está funcionando antes do deploy:

```bash
npm run build:web
```

Se o build local funcionar, o problema está nas variáveis de ambiente da Vercel.

## Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Variáveis aplicadas em Production, Preview e Development
- [ ] Projeto redesployado após adicionar as variáveis
- [ ] Console do navegador verificado para erros
- [ ] Cache do navegador limpo (Ctrl + Shift + R)

## Problemas Comuns

### Tela Branca
- **Causa**: Variáveis de ambiente não configuradas
- **Solução**: Configure todas as variáveis listadas acima

### Erro de CORS
- **Causa**: URL do Supabase incorreta
- **Solução**: Verifique se a URL do Supabase está correta

### Erro 404 nas Rotas
- **Causa**: Configuração do vercel.json
- **Solução**: O arquivo vercel.json já está configurado corretamente

### Fontes não Carregam
- **Causa**: Assets não incluídos no build
- **Solução**: As fontes estão configuradas corretamente, o problema pode estar no cache
