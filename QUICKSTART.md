# 🚀 Quick Start - LUMIÊ

## ⚡ Começar em 5 minutos

### 1. Instalar Node.js

Se você ainda não tem Node.js instalado:

**Windows:**
- Baixe: https://nodejs.org/
- Escolha a versão LTS (recomendada)
- Instale e reinicie o terminal

**Verificar instalação:**
```bash
node --version
# Deve retornar v18.x ou v20.x
```

### 2. Instalar Dependências

```bash
# Entre na pasta
cd lumie-presentes

# Instale (escolha um)
npm install
# ou
pnpm install
# ou
yarn install
```

⏱️ Isso vai levar 2-3 minutos.

### 3. Configurar Banco de Dados

**Opção Rápida: Usar Supabase (Grátis)**

1. Acesse: https://supabase.com
2. Crie conta gratuita
3. "New Project"
4. Copie a `DATABASE_URL` em Settings > Database
5. Cole no arquivo `.env`

**Ou use PostgreSQL local:**
```bash
# Instalar PostgreSQL: https://www.postgresql.org/download/

# Criar banco
createdb lumie_presentes

# No .env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/lumie_presentes"
```

### 4. Criar arquivo .env

```bash
# Copie o exemplo
cp env.example .env
```

**Abra `.env` e preencha o mínimo:**

```env
# Banco (use a URL do Supabase ou local)
DATABASE_URL="postgresql://..."

# NextAuth (gere um secret aleatório)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cole-qualquer-texto-aleatorio-longo-aqui-min-32-chars"

# Pagar.me (pode deixar vazio para começar)
PAGARME_API_KEY=""
PAGARME_SECRET_KEY=""
PAGARME_ENVIRONMENT="sandbox"

# Resto pode ficar padrão
PLATFORM_FEE_PERCENTAGE="7.99"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Preparar Banco

```bash
# Criar tabelas
npx prisma migrate dev --name init

# Popular templates (opcional)
npx prisma db seed
```

### 6. Rodar!

```bash
npm run dev
```

✅ Abra: **http://localhost:3000**

---

## 🎯 Primeiros Passos no Sistema

### 1. Criar Conta

1. Acesse: http://localhost:3000/cadastro
2. Preencha:
   - Nome: Seu Nome
   - Email: seu@email.com
   - Senha: 123456 (ou outra)
3. Clique em "Criar conta"

### 2. Criar Primeiro Presente

1. Você será redirecionado ao Dashboard
2. Clique em "Novo presente"
3. Preencha:
   - Nome: "Jogo de panelas"
   - Valor: 500
   - Quantidade: 1
4. Clique em "Cadastrar presente"

### 3. Ver Sua Lista Pública

1. No Dashboard, clique em "Ver minha lista"
2. Você verá a página que os convidados veem
3. O link será: `http://localhost:3000/lista/lista-xxxxx`

### 4. Testar como Convidado

1. Abra uma aba anônima (Ctrl+Shift+N)
2. Cole o link da sua lista
3. Clique em "Presentear"
4. Preencha os dados
5. Clique em "Pagar" (vai simular pagamento)
6. Veja a confirmação

### 5. Ver no Dashboard

1. Volte ao Dashboard
2. Veja o presente recebido
3. Veja o recado (se deixou)

---

## 🛠️ Comandos Úteis

```bash
# Rodar desenvolvimento
npm run dev

# Ver banco de dados visualmente
npx prisma studio
# Abra: http://localhost:5555

# Resetar banco (CUIDADO!)
npx prisma migrate reset

# Build para produção
npm run build

# Rodar produção
npm start
```

---

## 🐛 Problemas Comuns

### "Cannot find module @prisma/client"

```bash
npx prisma generate
```

### "Database connection failed"

Verifique se:
- PostgreSQL está rodando
- DATABASE_URL está correta no .env
- Usuário/senha corretos

### "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <número> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro ao instalar dependências

Tente:
```bash
# Deletar node_modules
rm -rf node_modules
# ou no Windows
rmdir /s node_modules

# Deletar lock file
rm package-lock.json

# Instalar novamente
npm install
```

---

## 📚 Arquivos Importantes

| Arquivo | O que é |
|---------|---------|
| `.env` | Variáveis de ambiente (senhas, configs) |
| `prisma/schema.prisma` | Estrutura do banco de dados |
| `app/` | Todas as páginas do site |
| `components/` | Componentes reutilizáveis |
| `lib/` | Funções auxiliares |

---

## 🎨 Customizar

### Mudar Cores

Edite: `tailwind.config.ts`

```typescript
terracota: {
  500: '#C65A3A', // Cor principal
  // Mude para sua cor
}
```

### Mudar Logo

Substitua: `public/logo.png` por sua imagem

### Adicionar Template

Edite: `prisma/seed.ts` e adicione novo template

```bash
# Executar seed novamente
npx prisma db seed
```

---

## 🚀 Deploy (Opcional)

### Vercel (Mais fácil)

1. Crie conta: https://vercel.com
2. Instale CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy:
   ```bash
   vercel
   ```
4. Configure variáveis de ambiente no painel
5. Deploy produção:
   ```bash
   vercel --prod
   ```

✅ Pronto! Seu site estará no ar.

---

## 📖 Documentação Completa

- **README.md** - Visão geral e documentação
- **SETUP.md** - Instalação detalhada
- **ENTREGA.md** - O que foi entregue

---

## ❓ Ajuda

1. Leia: `README.md` e `SETUP.md`
2. Veja: https://nextjs.org/docs
3. Prisma: https://www.prisma.io/docs

---

**Boa sorte! 🎉**

Se você seguiu até aqui, seu sistema LUMIÊ deve estar funcionando perfeitamente.
