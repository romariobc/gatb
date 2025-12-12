# Guia de Configuração: SharePoint + Power Automate

Este guia detalha passo a passo como criar o "Backend" usando ferramentas do Office 365, compatível com o código que acabamos de criar.

## Parte 1: SharePoint (Banco de Dados)

Primeiro, precisamos de um lugar para guardar os dados.

1.  Acesse seu **SharePoint** e entre em um Site (pode ser um site de equipe existente ou crie um novo "GATB").
2.  Clique em **Novo** > **Lista** > **Lista em branco**.
3.  Nome da lista: `Pacientes`.
4.  Clique na engrenagem (Configurações) > **Configurações da lista**.
5.  Role até **Colunas** e crie as seguintes colunas (a coluna "Title/Título" já existe, vamos renomeá-la ou usá-la como Nome):

| Nome da Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| **Title** (Título) | Texto (uma linha) | Usaremos para o **Nome do Paciente** |
| **Leito** | Texto (uma linha) | Ex: UTI-01 |
| **Droga** | Texto (uma linha) | Nome do antibiótico |
| **DataInicio** | Data e Hora | (Marque "Somente Data") |
| **Duracao** | Número | Quantidade de dias |
| **StatusLista** | Escolha (Choice) | Opções: `Active`, `History`. (Valor padrão: `Active`) |
| **DataFim** | Data e Hora | (Opcional, Data de alta). Marque "Somente Data". |

> **Nota**: O campo `ID` é gerado automaticamente pelo SharePoint e usaremos ele para identificar os registros.

---

## Parte 2: Power Automate (A Lógica/API)

Agora vamos criar o fluxo que recebe os pedidos do JavaScript e salva no SharePoint.

1.  Acesse [make.powerautomate.com](https://make.powerautomate.com).
2.  Clique em **Meus fluxos** > **Novo fluxo** > **Fluxo da nuvem instantâneo**.
3.  Dê o nome `GATB API`.
4.  Selecione o gatilho: **Quando uma solicitação HTTP é recebida** (Request). Clique em Criar.

### Passo 2.1: Configurar o Gatilho (Trigger)

1.  Abra o passo "Quando uma solicitação HTTP é recebida".
2.  Em **Quem pode acionar o fluxo?**, selecione "Qualquer pessoa" (Se quiser acesso público fácil) ou "Apenas pessoas na minha organização" (Mais seguro, mas pode exigir login no frontend ou proxy, para simplicidade inicial use "Qualquer pessoa" mas saiba que a URL é 'secreta').
3.  **Esquema JSON**: Clique em "Usar carga de amostra..." e cole isso:
    ```json
    {
      "action": "CREATE",
      "patient": {
        "name": "Teste",
        "location": "UTI",
        "drug": "Amox",
        "start": "2023-01-01",
        "duration": 7
      },
      "id": 1,
      "target": "history"
    }
    ```
    Isso ajuda o Power Automate a entender as variáveis.
4.  Clique em **Mostrar opções avançadas** e certifique-se que o método inclua `GET` e `POST` (ou deixe vazio para aceitar todos).

### Passo 2.2: Inicializar Variável de Ação

Como o `GET` (Listar) não envia corpo (body), precisamos tratar isso.

1.  Adicione nova ação: **Inicializar variável**.
2.  Nome: `VarAction`.
3.  Tipo: `Cadeia de caracteres` (String).
4.  Valor: Clique no campo e insira uma **Expressão**:
    ```
    coalesce(triggerBody()?['action'], 'GET_ALL')
    ```
    *Isso significa: "Se vier uma action no JSON, use ela. Se não vier (ex: GET), assuma que é GET_ALL".*

### Passo 2.3: Switch (O cérebro)

Adicione uma ação de controle **Switch** (Alternar).
*   **Em**: Selecione a variável `VarAction`.

Agora vamos criar um "Caso" (Case) para cada operação:

#### CASO 1: `GET_ALL`
Quando o app abrir e pedir os dados.

1.  No branch do Case, digite `GET_ALL`.
2.  Ação: **Obter itens** (SharePoint).
    *   Endereço do Site/Nome da Lista: Selecione sua lista `Pacientes`.
3.  Ação: **Resposta** (Response).
    *   Status Code: `200`.
    *   Body: Selecione o `value` (lista de itens) da etapa anterior.
    *   **IMPORTANTE (CORS)**: Clique em "Mostrar opções avançadas" e adicione o cabeçalho:
        *   `Access-Control-Allow-Origin`: `*`

> *Dica Pro*: O JavaScript espera separar em `patients` e `history`. Você pode filtrar aqui no fluxo ou deixar o JavaScript filtrar como fizemos no código (mais simples). O código que fiz já espera receber tudo e filtrar localmente, então retornar a lista bruta do SharePoint funciona!

#### CASO 2: `CREATE`
Adicionar novo paciente.

1.  Novo Case: `CREATE`.
2.  Ação: **Criar item** (SharePoint).
    *   Preencha os campos com os dados dinâmicos do gatilho:
    *   Title: `triggerBody()?['patient']?['name']`
    *   Leito: `triggerBody()?['patient']?['location']`
    *   ... e assim por diante.
    *   StatusLista: `Active`
3.  Ação: **Resposta**.
    *   Retorne o JSON do item criado ou apenas `{ "success": true, "id": ID_CRIADO }`.
    *   Não esqueça o Header CORS.

#### CASO 3: `UPDATE`
Editar leito ou dias.

1.  Novo Case: `UPDATE`.
2.  Ação: **Atualizar item** (SharePoint).
    *   Id: `triggerBody()?['id']`.
    *   Preencha *apenas* os campos que vierem no JSON (pode exigir lógica condicional complexa).
    *   *Simplificação*: Para começar, você pode apenas atualizar os campos críticos se eles existirem no JSON.
3.  Ação: **Resposta**.

#### CASO 4: `MOVE`
Alta ou Restaurar.

1.  Novo Case: `MOVE`.
2.  Ação: **Atualizar item**.
    *   Id: `triggerBody()?['patient']?['id']`.
    *   StatusLista: `triggerBody()?['target']` (ex: 'history' ou 'patients'/'active').
    *   DataFim: `triggerBody()?['patient']?['endDate']` (se houver).
3.  Ação: **Resposta**.

#### CASO 5: `DELETE`
Excluir.

1.  Novo Case: `DELETE`.
2.  Ação: **Excluir item**.
    *   Id: `triggerBody()?['id']`.
3.  Ação: **Resposta**.

---

## Parte 3: Finalizando

1.  **Salve** o fluxo.
2.  Assim que salvar, a URL do **HTTP Post URL** aparecerá na primeira etapa (Gatilho).
3.  Copie essa URL.
4.  Vá no seu arquivo `config.js` e cole a URL.

```javascript
const CONFIG = {
    API_URL: "https://prod-00.brazilsouth.logic.azure.com:443/workflows/..."
};
```

## Dicas de Troubleshooting

*   **Erro de CORS (Bloqueio no navegador)**: É o erro mais comum. Certifique-se de que TODAS as ações de "Resposta" (Response) no final de cada Case tenham o cabeçalho `Access-Control-Allow-Origin: *`.
*   **Datas**: O SharePoint é chato com datas. Envie sempre no formato ISO `YYYY-MM-DD`. O nosso código JS já faz isso.
