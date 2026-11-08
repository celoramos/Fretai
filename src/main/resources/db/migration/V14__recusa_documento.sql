-- O administrador também recusa: foto ilegível, documento vencido, de outra pessoa. Recusado sai
-- da fila e não volta; o motorista lê o motivo e envia outro arquivo, que entra como documento novo.
ALTER TABLE documento ADD COLUMN recusado_por UUID;
ALTER TABLE documento ADD COLUMN recusado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE documento ADD COLUMN motivo_recusa VARCHAR(300);
