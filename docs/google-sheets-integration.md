# Integracao Real com Google Sheets

## 1. Como criar uma Google Service Account

A integracao com Google Sheets deve usar uma service account para evitar dependencias de login manual, cookies ou tokens pessoais.

Passo a passo:

1. Acesse o Google Cloud Console.
2. Crie ou selecione um projeto do Google Cloud.
3. Acesse `IAM & Admin` > `Service Accounts`.
4. Clique em `Create service account`.
5. Defina um nome claro, por exemplo `site-vitrine-sheets-reader`.
6. Adicione uma descricao operacional, por exemplo `Leitura automatizada de ofertas do Site Vitrine via Google Sheets`.
7. Conclua a criacao.

Permissoes recomendadas:

- Para leitura de planilhas compartilhadas diretamente com a service account, normalmente nao e necessario conceder papeis amplos no projeto.
- Evite papeis como `Owner`, `Editor` ou permissoes globais desnecessarias.
- O acesso real a planilha deve ser dado pelo compartilhamento da propria planilha com o e-mail da service account.

---

## 2. Como ativar a Google Sheets API

A API precisa estar habilitada no projeto onde a service account foi criada.

Passo a passo:

1. No Google Cloud Console, acesse `APIs & Services` > `Library`.
2. Pesquise por `Google Sheets API`.
3. Abra a pagina da API.
4. Clique em `Enable`.
5. Confirme que a API aparece em `APIs & Services` > `Enabled APIs & services`.

Se a automacao futuramente precisar localizar planilhas no Google Drive, tambem pode ser necessario ativar a `Google Drive API`. Para o fluxo inicial, a `Google Sheets API` e suficiente quando o ID da planilha ja e conhecido.

---

## 3. Como gerar credenciais JSON

As credenciais JSON permitem que o script Node.js autentique como a service account.

Passo a passo:

1. Acesse `IAM & Admin` > `Service Accounts`.
2. Clique na service account criada.
3. Acesse a aba `Keys`.
4. Clique em `Add key` > `Create new key`.
5. Selecione o formato `JSON`.
6. Baixe o arquivo.
7. Renomeie localmente para algo claro, por exemplo `service-account.json`.
8. Salve fora de pastas publicas e nunca versionar esse arquivo no Git.

Local recomendado para desenvolvimento local:

```text
automation/config/service-account.json
```

Esse caminho e apenas operacional. O arquivo real de credenciais nao deve ser enviado para o repositorio.

---

## 4. Como compartilhar a planilha com a service account

A service account possui um e-mail proprio, geralmente no formato:

```text
nome-da-service-account@nome-do-projeto.iam.gserviceaccount.com
```

Passo a passo:

1. Abra a planilha de ofertas no Google Sheets.
2. Clique em `Share`.
3. Adicione o e-mail da service account.
4. Defina permissao `Viewer` para leitura.
5. Use `Editor` apenas se a automacao precisar escrever status, erros ou resultados na planilha.
6. Salve o compartilhamento.

Permissao recomendada para a ingestao inicial:

```text
Viewer
```

Use permissao de escrita somente quando houver um fluxo claro para atualizar colunas como `status`, `erro_validacao`, `ultima_sincronizacao` ou `id_interno`.

---

## 5. Como configurar o arquivo .env

Crie um arquivo `.env` local com base em:

```text
automation/config/example.env
```

Exemplo:

```env
GOOGLE_SHEETS_ID=1abcDEFghiJKLmnoPQRSTuvWXyz123456789
GOOGLE_SHEETS_RANGE=Ofertas!A1:K
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
OUTPUT_FILE=./outputs/sample-output.json
LOG_LEVEL=info
LOG_DIR=./logs
```

Descricao das variaveis:

- `GOOGLE_SHEETS_ID`: ID da planilha, encontrado na URL do Google Sheets.
- `GOOGLE_SHEETS_RANGE`: aba e intervalo que serao lidos.
- `GOOGLE_APPLICATION_CREDENTIALS`: caminho do JSON da service account.
- `OUTPUT_FILE`: caminho onde o JSON normalizado sera gravado.
- `LOG_LEVEL`: nivel esperado de logs.
- `LOG_DIR`: pasta onde logs locais serao gravados.

Exemplo de URL:

```text
https://docs.google.com/spreadsheets/d/1abcDEFghiJKLmnoPQRSTuvWXyz123456789/edit
```

Nesse caso, o `GOOGLE_SHEETS_ID` e:

```text
1abcDEFghiJKLmnoPQRSTuvWXyz123456789
```

Observacao importante: o script inicial usa variaveis de ambiente. Se o projeto ainda nao carregar `.env` automaticamente, execute o comando exportando as variaveis no terminal ou adicione futuramente uma biblioteca como `dotenv`.

---

## 6. Como executar a ingestao localmente

Entre na pasta da automacao:

```bash
cd automation
```

Instale as dependencias:

```bash
npm install
```

Configure as variaveis de ambiente antes de executar.

No PowerShell:

```powershell
$env:GOOGLE_SHEETS_ID="ID_DA_PLANILHA"
$env:GOOGLE_SHEETS_RANGE="Ofertas!A1:K"
$env:GOOGLE_APPLICATION_CREDENTIALS="./config/service-account.json"
$env:OUTPUT_FILE="./outputs/sample-output.json"
$env:LOG_DIR="./logs"
npm run ingest:sheets
```

No bash:

```bash
export GOOGLE_SHEETS_ID="ID_DA_PLANILHA"
export GOOGLE_SHEETS_RANGE="Ofertas!A1:K"
export GOOGLE_APPLICATION_CREDENTIALS="./config/service-account.json"
export OUTPUT_FILE="./outputs/sample-output.json"
export LOG_DIR="./logs"
npm run ingest:sheets
```

Resultado esperado:

- arquivo JSON atualizado em `automation/outputs/sample-output.json`;
- log de execucao criado em `automation/logs/`;
- resumo no terminal indicando sucesso ou falha.

---

## 7. Como validar se a conexao funcionou

Valide em etapas:

1. Confirme que `npm install` foi concluido sem erro.
2. Confirme que o arquivo JSON da service account existe localmente.
3. Confirme que `GOOGLE_APPLICATION_CREDENTIALS` aponta para o caminho correto.
4. Confirme que a planilha foi compartilhada com o e-mail da service account.
5. Confirme que `GOOGLE_SHEETS_ID` corresponde ao ID da URL da planilha.
6. Confirme que `GOOGLE_SHEETS_RANGE` aponta para uma aba existente.
7. Execute `npm run ingest:sheets`.
8. Abra `outputs/sample-output.json` e verifique `metadata.acceptedCount`, `metadata.rejectedCount` e `offers`.
9. Abra os logs em `logs/` para validar se a execucao terminou com `ingest_finished`.

Erros comuns:

- `Missing GOOGLE_SHEETS_ID environment variable`: variavel nao foi configurada.
- `The caller does not have permission`: planilha nao foi compartilhada com a service account.
- `Requested entity was not found`: ID da planilha incorreto ou sem acesso.
- `Unable to parse range`: aba ou intervalo incorreto.
- `invalid_grant` ou erro de credencial: JSON incorreto, corrompido ou caminho invalido.

---

## 8. Estrutura esperada da planilha

A primeira linha deve conter o cabecalho. O script inicial considera a ordem das colunas.

Estrutura recomendada:

| Coluna | Campo | Obrigatorio | Exemplo |
| --- | --- | --- | --- |
| A | marketplace | Sim | amazon |
| B | titulo | Sim | Fone Bluetooth XYZ |
| C | categoria | Sim | Eletronicos |
| D | preco | Sim | 199,90 |
| E | preco_anterior | Nao | 249,90 |
| F | url_afiliado | Sim | https://example.com/oferta |
| G | url_imagem | Sim | https://example.com/imagem.jpg |
| H | disponibilidade | Sim | disponivel |
| I | prioridade | Nao | 1 |
| J | status | Nao | active |
| K | observacoes | Nao | Oferta validada manualmente |

Valores recomendados para `disponibilidade`:

- `disponivel`
- `indisponivel`
- `promocao`
- `pre-venda`

Boas praticas para a planilha:

- manter cabecalhos fixos;
- evitar mesclar celulas;
- evitar formulas em campos criticos quando possivel;
- usar uma linha por oferta;
- manter URLs completas;
- padronizar nomes de marketplaces;
- preencher `status` para controlar publicacao;
- criar abas separadas para testes e producao quando necessario.

---

## 9. Boas praticas de seguranca

- Nunca versionar `service-account.json`.
- Nunca publicar `.env` real no Git.
- Usar permissao minima na planilha.
- Preferir acesso `Viewer` para ingestao.
- Usar `Editor` apenas se a automacao realmente precisar escrever na planilha.
- Rotacionar chaves se houver suspeita de vazamento.
- Manter chaves fora de pastas publicas.
- Evitar logs com tokens, cookies, URLs privadas ou dados sensiveis.
- Separar planilhas de teste e producao.
- Criar uma service account por ambiente quando a operacao crescer.
- Revisar mudancas em schema, permissao, integracao e deploy antes de producao.
- Nao alterar banco de producao diretamente a partir da ingestao inicial.

Recomendacao para producao:

- armazenar credenciais em secret manager ou variaveis seguras do provedor;
- restringir quem pode editar a planilha;
- criar logs com rastreabilidade;
- configurar alertas para falhas de ingestao;
- manter rollback para atualizacoes automaticas.

---

## 10. Estrategia futura para multiplas planilhas e marketplaces

A integracao inicial deve evoluir para uma arquitetura com adaptadores.

Modelo recomendado:

```text
sources/
  google-sheets/
    sheets-client.js
    sheets-source-adapter.js
marketplaces/
  amazon/
    amazon-normalizer.js
  mercado-livre/
    mercado-livre-normalizer.js
  shopee/
    shopee-normalizer.js
validators/
  offer-validator.js
normalizers/
  offer-normalizer.js
```

Estrategia:

1. Criar um arquivo de configuracao para listar fontes.
2. Permitir multiplos `spreadsheetId`, abas e ranges.
3. Adicionar identificador de origem em cada oferta.
4. Criar regras especificas por marketplace quando necessario.
5. Manter um modelo normalizado unico para o site.
6. Registrar logs por fonte, marketplace e execucao.
7. Rodar validacoes independentes por fonte.
8. Permitir revisao manual para fontes novas ou de maior risco.
9. Migrar fluxos recorrentes do Make para scheduler proprio.
10. Reutilizar conectores, validadores e normalizadores no futuro SaaS de Automacao.

Exemplo conceitual de configuracao futura:

```json
{
  "sources": [
    {
      "type": "google-sheets",
      "name": "ofertas-gerais",
      "spreadsheetIdEnv": "GOOGLE_SHEETS_ID",
      "range": "Ofertas!A1:K",
      "marketplace": "mixed"
    },
    {
      "type": "google-sheets",
      "name": "amazon",
      "spreadsheetIdEnv": "GOOGLE_SHEETS_AMAZON_ID",
      "range": "Amazon!A1:K",
      "marketplace": "amazon"
    }
  ]
}
```

Principio central: cada fonte pode ter regras proprias de leitura, mas o site deve consumir sempre um formato normalizado, validado e rastreavel.
