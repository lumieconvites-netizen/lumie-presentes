# SETUP COMPLETO - LUMIÊ

## 🚀 Guia de Instalação Passo a Passo

### 1. Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **Editor de código** (VS Code recomendado)

### 2. Clonar e Instalar

```bash
# Entre na pasta do projeto
cd lumie-presentes

# Instale as dependências
npm install
# ou
pnpm install
# ou
yarn install
```

### 3. Configurar Banco de Dados PostgreSQL

#### Opção A: PostgreSQL Local

```bash
# Criar banco de dados
createdb lumie_presentes

# Ou via psql
psql -U postgres
CREATE DATABASE lumie_presentes;
\q
```

#### Opção B: PostgreSQL na Nuvem (Recomendado)

**Supabase** (Gratuito):
1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie a `DATABASE_URL` em Settings > Database

**Neon** (Gratuito):
1. Acesse [neon.tech](https://neon.tech)
2. Crie novo projeto
3. Copie a connection string

### 4. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env
notepad .env  # Windows
nano .env     # Linux/Mac
```

#### Preencha as variáveis:

```env
# ===== DATABASE =====
DATABASE_URL="postgresql://user:password@localhost:5432/lumie_presentes"
# OU use a URL do Supabase/Neon

# ===== NEXTAUTH =====
NEXTAUTH_URL="http://localhost:3000"
# Gere um secret:
# Windows PowerShell: [Convert]::ToBase64String((1..32 | %{Get-Random -Max 256}))
# Linux/Mac: openssl rand -base64 32
NEXTAUTH_SECRET="cole-aqui-o-secret-gerado"

# ===== PAGAR.ME =====
# Acesse: https://dashboard.pagar.me
# Crie uma conta > API Keys
PAGARME_API_KEY="sua_api_key_aqui"
PAGARME_SECRET_KEY="sua_secret_key_aqui"
PAGARME_WEBHOOK_SECRET="seu_webhook_secret"
PAGARME_ENVIRONMENT="sandbox"  # ou "production"

# ===== PLATAFORMA =====
PLATFORM_FEE_PERCENTAGE="7.99"

# ===== UPLOAD =====
# Opção 1: UploadThing (Recomendado - Gratuito)
# Acesse: https://uploadthing.com
UPLOADTHING_SECRET="sua_uploadthing_secret"
UPLOADTHING_APP_ID="sua_uploadthing_app_id"

# Opção 2: Cloudinary
# Acesse: https://cloudinary.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="seu_cloud_name"
CLOUDINARY_API_KEY="sua_api_key"
CLOUDINARY_API_SECRET="sua_api_secret"

# ===== APP =====
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Configurar Pagar.me

#### Passo a passo:

1. **Criar conta**: [dashboard.pagar.me](https://dashboard.pagar.me)

2. **Modo Sandbox** (testes):
   - Acesse Dashboard > Configurações > API Keys
   - Copie a API Key de **Teste**
   - Cole em `PAGARME_API_KEY`

3. **Criar Recipient da Plataforma**:
   ```bash
   # Execute o script de setup
   npm run setup:pagarme
   ```

4. **Configurar Webhooks**:
   - Dashboard Pagar.me > Webhooks
   - URL: `https://seu-dominio.com/api/webhooks/pagarme`
   - Eventos:
     - ✅ `order.paid`
     - ✅ `order.payment_failed`
     - ✅ `order.refunded`
     - ✅ `charge.paid`
     - ✅ `charge.refused`
     - ✅ `charge.refunded`
     - ✅ `charge.chargeback`

5. **Para produção**:
   - Preencha dados da empresa
   - Envie documentos
   - Aguarde aprovação
   - Troque para API Key de **Produção**

### 6. Preparar o Banco de Dados

```bash
# Executar migrações (criar tabelas)
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate

# Popular banco com templates (opcional)
npx prisma db seed
```

### 7. Adicionar Logo

Coloque o arquivo de logo em:
```
public/logo.png
```

O sistema espera um PNG transparente com o logotipo LUMIÊ.

### 8. Rodar o Projeto

```bash
# Desenvolvimento
npm run dev

# Acesse: http://localhost:3000
```

### 9. Criar Primeiro Usuário

1. Acesse: http://localhost:3000/cadastro
2. Preencha os dados
3. Faça login
4. Será redirecionado para o dashboard

### 10. Testar Pagamento (Sandbox)

Use os cartões de teste do Pagar.me:

**Aprovado**:
```
Número: 4111 1111 1111 1111
CVV: 123
Validade: 12/2030
Nome: QUALQUER NOME
```

**Recusado**:
```
Número: 4000 0000 0000 0010
CVV: 123
Validade: 12/2030
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Start produção
npm start

# Lint
npm run lint

# Visualizar banco de dados
npx prisma studio

# Resetar banco (CUIDADO!)
npx prisma migrate reset

# Seed templates
npx prisma db seed
```

## 🔍 Verificar Instalação

Execute este checklist:

```bash
# ✅ Node.js instalado
node --version  # deve retornar v18+ ou v20+

# ✅ Banco conectado
npx prisma db pull

# ✅ Prisma gerado
npx prisma generate

# ✅ Build funciona
npm run build

# ✅ Servidor inicia
npm run dev
```

## 🐛 Problemas Comuns

### Erro: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
npm install @prisma/client
```

### Erro: "Database connection failed"

Verifique:
- PostgreSQL está rodando
- `DATABASE_URL` está correta
- Usuário/senha corretos
- Porta correta (padrão 5432)

### Erro: "NEXTAUTH_SECRET not set"

Gere um novo secret:
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | %{Get-Random -Max 256}))

# Linux/Mac
openssl rand -base64 32
```

### Imagens não carregam

1. Configure domínios em `next.config.js`:
```javascript
images: {
  domains: ['res.cloudinary.com', 'uploadthing.com', 'seu-dominio.com'],
}
```

2. Reinicie o servidor:
```bash
npm run dev
```

### Webhook não está funcionando

Durante desenvolvimento local:
1. Use [ngrok](https://ngrok.com) para expor localhost:
```bash
ngrok http 3000
```

2. Configure a URL do ngrok no Pagar.me:
```
https://seu-subdominio.ngrok.io/api/webhooks/pagarme
```

## 📊 Prisma Studio

Visualizar e editar dados:

```bash
npx prisma studio
```

Acesse: http://localhost:5555

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Produção
vercel --prod
```

Configure as variáveis de ambiente no painel Vercel.

### Outras Plataformas

- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)
- **Fly.io**: [fly.io](https://fly.io)

## 📚 Próximos Passos

1. Customize as cores em `tailwind.config.ts`
2. Adicione mais templates em `prisma/seed.ts`
3. Configure email (SMTP)
4. Adicione analytics (Google Analytics, Plausible)
5. Configure domínio customizado
6. SSL/HTTPS (automático na Vercel)

## 💡 Dicas

- Use Prisma Studio para gerenciar dados
- Teste webhooks com ngrok em desenvolvimento
- Mantenha `.env` fora do controle de versão
- Use modo sandbox do Pagar.me para testes
- Faça backup regular do banco

## 🆘 Suporte

- Documentação: [docs.lumie.com.br](https://docs.lumie.com.br)
- Issues: GitHub Issues
- Email: suporte@lumie.com.br

---

Pronto! 🎉 Seu sistema LUMIÊ está configurado e rodando.
