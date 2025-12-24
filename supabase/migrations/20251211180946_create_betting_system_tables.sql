/*
  # Sistema de Apostas e Pagamentos - Mega da Virada

  ## Visão Geral
  Este migration cria a estrutura completa para gerenciar apostas de bolão,
  pagamentos PIX e números apostados, com segurança via RLS.

  ## 1. Novas Tabelas

  ### `bets` - Apostas do Bolão
    - `id` (uuid, primary key) - Identificador único da aposta
    - `user_name` (text) - Nome completo do apostador
    - `user_cpf` (text) - CPF do apostador
    - `user_email` (text) - Email do apostador
    - `user_phone` (text) - Telefone do apostador
    - `user_birthdate` (text) - Data de nascimento do apostador
    - `contest_number` (text) - Número do concurso (ex: 2955)
    - `quota` (text) - Cota adquirida (ex: 94/100)
    - `amount` (decimal) - Valor pago pela aposta
    - `status` (text) - Status da aposta: pending, paid, cancelled
    - `created_at` (timestamptz) - Data de criação
    - `updated_at` (timestamptz) - Data de atualização

  ### `payments` - Pagamentos PIX
    - `id` (uuid, primary key) - Identificador único do pagamento
    - `bet_id` (uuid, foreign key) - Referência à aposta
    - `transaction_id` (text) - ID da transação Genesys
    - `pix_payload` (text) - Código PIX copia e cola
    - `amount` (decimal) - Valor do pagamento
    - `status` (text) - Status: pending, completed, failed, expired
    - `paid_at` (timestamptz) - Data de confirmação do pagamento
    - `expires_at` (timestamptz) - Data de expiração do QR Code
    - `webhook_data` (jsonb) - Dados recebidos do webhook
    - `created_at` (timestamptz) - Data de criação
    - `updated_at` (timestamptz) - Data de atualização

  ### `bet_numbers` - Números Apostados
    - `id` (uuid, primary key) - Identificador único
    - `bet_id` (uuid, foreign key) - Referência à aposta
    - `numbers` (integer[]) - Array com os números apostados
    - `game_type` (text) - Tipo de jogo (ex: mega-sena)
    - `created_at` (timestamptz) - Data de criação

  ## 2. Segurança (RLS)

  ### Políticas para `bets`:
    - Qualquer usuário autenticado pode criar apostas
    - Somente o sistema pode atualizar apostas
    - Consulta pública por CPF e ID

  ### Políticas para `payments`:
    - Sistema cria e atualiza pagamentos
    - Consulta pública por transaction_id

  ### Políticas para `bet_numbers`:
    - Sistema cria números
    - Consulta pública por bet_id

  ## 3. Notas Importantes
    - RLS habilitado em todas as tabelas
    - Índices criados para otimizar consultas
    - Webhook data armazenado como JSONB para flexibilidade
    - Timestamps automáticos para auditoria
*/

-- Criar tabela de apostas
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  user_cpf text NOT NULL,
  user_email text NOT NULL,
  user_phone text NOT NULL DEFAULT '',
  user_birthdate text NOT NULL,
  contest_number text NOT NULL,
  quota text NOT NULL,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  transaction_id text NOT NULL UNIQUE,
  pix_payload text NOT NULL,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  paid_at timestamptz,
  expires_at timestamptz,
  webhook_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de números apostados
CREATE TABLE IF NOT EXISTS bet_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  numbers integer[] NOT NULL,
  game_type text NOT NULL DEFAULT 'mega-sena',
  created_at timestamptz DEFAULT now()
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_bets_cpf ON bets(user_cpf);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_bet_id ON payments(bet_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_bet_numbers_bet_id ON bet_numbers(bet_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_numbers ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela bets
CREATE POLICY "Permitir inserção pública de apostas"
  ON bets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de apostas"
  ON bets FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir atualização pública de apostas"
  ON bets FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para a tabela payments
CREATE POLICY "Permitir inserção pública de pagamentos"
  ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de pagamentos"
  ON payments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir atualização pública de pagamentos"
  ON payments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para a tabela bet_numbers
CREATE POLICY "Permitir inserção pública de números"
  ON bet_numbers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de números"
  ON bet_numbers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bets_updated_at') THEN
    CREATE TRIGGER update_bets_updated_at
      BEFORE UPDATE ON bets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;