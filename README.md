# 🏥 GATB - Gestão de Antimicrobianos

Sistema web para gerenciamento de tratamentos com antimicrobianos em ambiente hospitalar (UTI/enfermarias).

## 🌐 Acesso

**[Gestão de Antimicrobianos](https://gentle-island-0ca844710.4.azurestaticapps.net)**

## 📋 Sobre o Projeto

O GATB é uma aplicação web moderna e intuitiva desenvolvida para facilitar o controle de pacientes em tratamento com antibióticos. O sistema oferece:

- ✅ Gerenciamento visual de pacientes em tratamento
- 📊 Indicadores coloridos de status (verde/amarelo/vermelho)
- 📅 Contador automático de dias de tratamento
- 🔍 Busca em tempo real por paciente, leito ou medicamento
- 📄 Exportação de relatórios em PDF
- 💾 Armazenamento em nuvem (SharePoint List)
- ☁️ API Serverless via Power Automate
- 📄 Exportação de relatórios em PDF
- 📱 Interface responsiva (funciona em tablets e celulares)

## 🚀 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos com variáveis CSS
- **JavaScript Vanilla** - Lógica da aplicação
- **Power Automate** - Camada de API (Backend)
- **SharePoint Lists** - Banco de dados
- **jsPDF** - Geração de relatórios PDF
- **Azure Static Web Apps** - Hospedagem e deploy

## 📂 Estrutura do Projeto

```
gatb/
├── .github/
│   └── workflows/
├── docs/
│   └── backend_setup.md         # Guia de configuração do Backend
├── public/
│   ├── config.js                        # Configuração da API
│   ├── index.html                       # Estrutura HTML
│   ├── style.css                        # Estilos da aplicação
│   └── script.js                        # Lógica JavaScript
├── staticwebapp.config.json             # Configurações do Azure
├── .gitignore                           # Arquivos ignorados pelo Git
├── .env.example                         # Template de variáveis de ambiente
└── README.md                            # Este arquivo
```

## 🎯 Funcionalidades

### 1. Gestão de Pacientes em Tratamento

- Adicionar novos pacientes com dados do tratamento
- Visualizar status em tempo real com código de cores
- Contador de dias (ex: D3/D7 = dia 3 de 7)
- Barra de progresso visual

### 2. Sistema de Status Colorido

- 🟢 **Verde**: Tratamento em andamento normal
- 🟡 **Amarelo**: Último dia ou necessita reavaliação
- 🔴 **Vermelho**: Tratamento vencido (necessita ação)

### 3. Ações Disponíveis

- **📍 Leito**: Transferir paciente de leito
- **🔄 +Dias**: Estender duração do tratamento
- **✅ Alta**: Dar alta ao paciente (move para histórico)
- **↩ Restaurar**: Reativar tratamento do histórico
- **🗑 Excluir**: Deletar permanentemente

### 4. Organização

- **Aba "Em Curso"**: Pacientes em tratamento ativo
- **Aba "Histórico"**: Pacientes que receberam alta
- **Busca em tempo real**: Filtra por nome, leito ou medicamento
- **Exportação PDF**: Gera relatório da lista atual

## 💻 Como Rodar Localmente

### Opção 1: Servidor HTTP Simples

```bash
# Python 3
cd gatb/public
python -m http.server 8000

# Node.js (com npx)
cd gatb/public
npx http-server

# Visual Studio Code
# Use a extensão "Live Server"
```

Acesse: `http://localhost:8000`

### Configuração do Backend
Para que a aplicação funcione corretamente (salvar dados na nuvem), você precisa configurar o `public/config.js` com a URL do seu Power Automate.

👉 **[Leia o Guia de Configuração do Backend](docs/backend_setup.md)** para saber como criar a lista no SharePoint e o fluxo no Power Automate.

### Opção 2: Abrir diretamente no navegador

Simplesmente abra o arquivo `public/index.html` no seu navegador.

⚠️ **Nota**: Algumas funcionalidades podem ter restrições de segurança ao abrir direto do sistema de arquivos.

## 🌐 Deploy no Azure Static Web Apps

### Pré-requisitos

- Conta no [Azure](https://azure.microsoft.com/)
- Conta no [GitHub](https://github.com/)
- [Git](https://git-scm.com/) instalado
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) (opcional)

### Passo a Passo

#### 1. Criar Repositório no GitHub

```bash
# Inicializar repositório Git
git init
git add .
git commit -m "Initial commit: GATB - Gestão de Antimicrobianos"

# Conectar com repositório remoto (crie o repo no GitHub primeiro)
git remote add origin https://github.com/seu-usuario/gatb.git
git branch -M main
git push -u origin main
```

#### 2. Criar Static Web App no Azure

##### Via Portal Azure (Interface Gráfica):

1. Acesse o [Portal Azure](https://portal.azure.com)
2. Clique em **"Create a resource"**
3. Busque por **"Static Web App"**
4. Clique em **"Create"**
5. Preencha os dados:
   - **Subscription**: Sua assinatura Azure
   - **Resource Group**: Crie novo ou use existente
   - **Name**: `gatb-antimicrobianos` (ou nome de sua preferência)
   - **Plan type**: **Free** (gratuito)
   - **Region**: **Brazil South** (ou mais próxima)
   - **Deployment details**:
     - **Source**: GitHub
     - **Organization**: Seu usuário GitHub
     - **Repository**: Seu repositório
     - **Branch**: main
   - **Build Details**:
     - **Build Presets**: Custom
     - **App location**: `/public`
     - **Api location**: (deixe vazio)
     - **Output location**: (deixe vazio)
6. Clique em **"Review + Create"**
7. Clique em **"Create"**

##### Via Azure CLI (Linha de Comando):

```bash
# Login no Azure
az login

# Criar Static Web App
az staticwebapp create \
  --name gatb-antimicrobianos \
  --resource-group seu-grupo-de-recursos \
  --source https://github.com/seu-usuario/gatb \
  --location "Brazil South" \
  --branch main \
  --app-location "/public" \
  --login-with-github
```

#### 3. Deploy Automático

Após a criação, o Azure irá:

1. ✅ Criar um workflow no GitHub Actions (`.github/workflows/azure-static-web-apps.yml`)
2. ✅ Fazer o primeiro deploy automaticamente
3. ✅ Gerar uma URL para acessar a aplicação (ex: `https://happy-sea-123456.azurestaticapps.net`)

**Deploy contínuo**: Qualquer push para a branch `main` irá disparar um deploy automático!

#### 4. Adicionar Domínio Customizado (Opcional)

1. No Portal Azure, vá para seu Static Web App
2. Clique em **"Custom domains"**
3. Clique em **"Add"**
4. Selecione **"Custom domain on other DNS"**
5. Digite seu domínio (ex: `antibioticos.seuhospital.com.br`)
6. Configure o DNS conforme instruções do Azure
7. Aguarde validação (pode levar até 48h)

O Azure configura SSL/HTTPS automaticamente!

### Verificar Deploy

```bash
# Ver URL da aplicação
az staticwebapp show \
  --name gatb-antimicrobianos \
  --query "defaultHostname" \
  --output tsv

# Ver status
az staticwebapp show \
  --name gatb-antimicrobianos \
  --query "repositoryUrl" \
  --output table
```

## 🔒 Segurança

### Headers de Segurança Configurados

O arquivo `staticwebapp.config.json` configura automaticamente:

- **Content-Security-Policy**: Previne XSS e injeção de código
- **X-Frame-Options**: Previne clickjacking
- **X-Content-Type-Options**: Previne MIME sniffing
- **Strict-Transport-Security**: Força HTTPS
- **Referrer-Policy**: Controla informações de referência
- **Permissions-Policy**: Restringe APIs do navegador

### Armazenamento de Dados

⚠️ **IMPORTANTE**:
- Os dados são armazenados na sua **Lista do SharePoint** privada.
- A comunicação é feita via **Power Automate**.
- O arquivo `config.js` contém a URL pública do seu fluxo (API). Mantenha-a segura ou restrinja o acesso no Power Automate se necessário.

### LGPD e Dados Sensíveis

- O sistema não coleta dados pessoais sensíveis automaticamente
- Cabe à instituição garantir conformidade com LGPD
- Recomenda-se anonimização de dados quando possível
- Para dados sensíveis, considere implementar backend seguro

## 📱 Compatibilidade

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Mobile (iOS Safari, Chrome Android)

## 🛠️ Manutenção e Atualizações

### Atualizar a Aplicação

```bash
# 1. Faça alterações nos arquivos
# 2. Commit e push
git add .
git commit -m "Descrição das alterações"
git push origin main

# 3. Deploy automático será disparado!
```

### Rollback (Voltar para versão anterior)

```bash
# Ver histórico de commits
git log --oneline

# Voltar para commit específico
git revert <hash-do-commit>
git push origin main
```

## 📊 Monitoramento

No Portal Azure, você pode:

- Ver estatísticas de uso (visitantes, requisições)
- Monitorar performance
- Ver logs de deploy
- Configurar alertas

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Melhorias Futuras

- [ ] Sincronização com banco de dados (backend)
- [ ] Sistema de autenticação
- [ ] Múltiplos usuários simultâneos
- [ ] Notificações de tratamentos vencendo
- [ ] Relatórios avançados e estatísticas
- [ ] Exportação para Excel
- [ ] Histórico de auditoria
- [ ] Integração com sistemas hospitalares (HL7/FHIR)

## 🐛 Problemas Conhecidos

- Dados são perdidos ao limpar cache do navegador
- Sem sincronização entre dispositivos
- Sem controle de versão de dados

## 📞 Suporte

Para dúvidas ou problemas:

- Abra uma [Issue no GitHub](https://github.com/seu-usuario/gatb/issues)
- Entre em contato com o desenvolvedor

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para usar e modificar conforme necessário.

---

**Desenvolvido para facilitar o trabalho das equipes de saúde no controle de tratamentos com antimicrobianos.**

⚠️ **Aviso**: Este software é fornecido "como está" sem garantias. Recomenda-se validação e testes adequados antes de uso em ambiente de produção hospitalar.
