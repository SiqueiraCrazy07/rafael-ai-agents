# Connectors

## Objetivo

Organizar especificacoes e implementacoes futuras de conectores com sistemas externos.

Conectores podem representar APIs, bancos, planilhas, ferramentas de deploy, analytics, CRM, WhatsApp, marketplaces e servicos internos.

## Como usar

1. Documente a fonte ou destino da integracao.
2. Defina autenticacao, permissoes e limites.
3. Descreva entradas e saidas.
4. Registre riscos e tratamento de erros.
5. Reutilize conectores em workflows.

## Exemplos

- Google Sheets.
- GitHub.
- Vercel.
- Supabase.
- PostgreSQL.
- Marketplaces.
- WhatsApp APIs.

## Boas praticas

- Nunca versionar credenciais.
- Usar permissoes minimas.
- Registrar limites de API.
- Implementar retries com cuidado.
- Separar conectores por fornecedor.
- Manter contratos estaveis para workflows.
