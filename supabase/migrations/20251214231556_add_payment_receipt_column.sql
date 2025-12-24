/*
  # Adicionar campo de comprovante de pagamento
  
  1. Mudanças
    - Adiciona coluna `receipt_image` na tabela `payments` para armazenar a imagem do comprovante
    - Adiciona coluna `receipt_uploaded_at` para registrar quando o comprovante foi enviado
  
  2. Notas
    - A coluna `receipt_image` armazenará o caminho/URL do comprovante
    - É opcional pois nem todos os pagamentos precisarão de comprovante manual
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'receipt_image'
  ) THEN
    ALTER TABLE payments ADD COLUMN receipt_image TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'receipt_uploaded_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN receipt_uploaded_at TIMESTAMPTZ;
  END IF;
END $$;