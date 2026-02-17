# LUMIÊ - Sistema de Lista de Presentes

Sistema web completo de lista de presentes convertidos em dinheiro. Os convidados "compram" presentes e o valor é convertido em crédito via Pagar.me.

## 📋 Visão Geral

**LUMIÊ** é uma plataforma que permite criar listas de presentes personalizadas onde os convidados escolhem e pagam presentes, mas o anfitrião recebe o valor em dinheiro diretamente na conta.

### Principais Funcionalidades

- ✨ **Autenticação completa** (cadastro, login, recuperação)
- 🎁 **CRUD de presentes** (até 100 por lista)
- 🎨 **Editor visual de blocos** (drag-and-drop)
- 📋 **Templates prontos** de listas
- 💳 **Pagamento via Pagar.me** (split, subcontas, webhooks)
- 💬 **Sistema de recados** dos convidados
- 📊 **Dashboard** completo com métricas
- 🔒 **Segurança** (rate limiting, validações, LGPD)
- 📱 **100% Responsivo**

## 🎨 Identidade Visual

### Tema Terracota

- **Primary**: `#C65A3A` (Terracota)
- **Secondary**: `#8E3D2C` (Terracota escuro)
- **Neutros**: Off-white (`#FAF4EF`), Bege (`#F1E3D6`)
- **Acentos**: Dourado suave para detalhes
- **Tipografia**:
  - Display/Títulos: Playfair Display (serif elegante)
  - Corpo: Inter (sans-serif legível)

### Logo

O logo LUMIÊ está localizado em `/public/logo.png` e deve ser aplicado:
- Navbar (topo do site)
- Telas de autenticação (login/cadastro)
- Favicon derivado do símbolo

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- Conta Pagar.me (sandbox ou produção)

### 1. Clone e instale dependências

```bash
# Clone o repositório
cd lumie-presentes

# Instale as dependências (use npm, yarn ou pnpm)
npm install
# ou
pnpm install
# ou
yarn install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo `env.example` e renomeie para `.env`:

```bash
cp env.example .env
```

Edite `.env` com suas credenciais:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lumie_presentes?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gerar-com: openssl rand -base64 32"

# Pagar.me
PAGARME_API_KEY="sua-api-key-pagarme"
PAGARME_SECRET_KEY="sua-secret-key-pagarme"
PAGARME_WEBHOOK_SECRET="webhook-secret-pagarme"
PAGARME_ENVIRONMENT="sandbox" # ou "production"
WITHDRAW_GATEWAY_URL=""
WITHDRAW_GATEWAY_TOKEN=""

# Comissão da plataforma
PLATFORM_FEE_PERCENTAGE="7.99"

# Upload (UploadThing ou Cloudinary)
UPLOADTHING_SECRET="sua-uploadthing-secret"
UPLOADTHING_APP_ID="sua-uploadthing-app-id"

# URL base
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Configure o banco de dados

```bash
# Executar migrações
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate

# (Opcional) Seed com templates e dados iniciais
npx prisma db seed
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📦 Estrutura do Projeto

```
lumie-presentes/
├── app/
│   ├── (auth)/              # Páginas de autenticação
│   │   ├── login/
│   │   └── cadastro/
│   ├── (dashboard)/         # Área logada do cliente
│   │   └── dashboard/
│   │       ├── presentes/   # CRUD de presentes
│   │       ├── recados/     # Feed de recados
│   │       ├── pagamentos/  # Extrato
│   │       └── configuracoes/
│   ├── api/                 # API Routes
│   │   ├── auth/            # Autenticação
│   │   ├── gifts/           # CRUD presentes
│   │   ├── orders/          # Pedidos
│   │   ├── webhooks/        # Pagar.me webhooks
│   │   └── gift-lists/      # Listas
│   ├── lista/               # Páginas públicas das listas
│   │   └── [slug]/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Home marketing
├── components/
│   ├── ui/                  # Design system (shadcn/ui)
│   ├── providers/           # Providers (NextAuth, React Query)
│   └── blocks/              # Blocos do editor (Hero, Gallery, etc)
├── lib/
│   ├── prisma.ts            # Cliente Prisma
│   ├── auth.ts              # Configuração NextAuth
│   ├── pagarme.ts           # SDK Pagar.me
│   └── utils.ts             # Funções auxiliares
├── prisma/
│   ├── schema.prisma        # Schema do banco
│   └── seed.ts              # Seed com templates
├── public/
│   ├── logo.png             # Logo LUMIÊ
│   └── favicon.ico
├── types/
│   └── next-auth.d.ts       # Types do NextAuth
├── .env.example
├── package.json
├── tailwind.config.ts
└── README.md
```

## 🗄️ Modelo de Dados

### Principais Entidades

#### User (Usuário)
- id, name, email, password, role
- Relaciona com: GiftList, Recipient

#### GiftList (Lista de Presentes)
- id, userId, slug, title, description, eventDate
- isPublished, feeMode (PASS_TO_GUEST | ABSORB)
- allowMessages, allowPhotoUpload, showGuestNames
- Relaciona com: GiftItem, Order, Message, PageLayout

#### GiftItem (Presente)
- id, giftListId, name, description, imageUrl
- basePrice, totalQuantity, availableQty
- isActive, order (para ordenação)

#### Order (Pedido)
- id, giftListId, giftItemId
- guestName, guestEmail, quantity
- baseAmount, feeAmount, totalAmount
- status (PENDING | PAID | REFUSED | REFUNDED)
- pagarmeOrderId, paidAt

#### Message (Recado)
- id, orderId, giftListId
- guestName, content, signature
- photoUrls (JSON), isPublic, isFavorite, isRead

#### PageLayout (Layout da Página)
- id, giftListId
- blocks (JSON - array de blocos)
- theme (JSON - configurações de tema)

#### Recipient (Subconta Pagar.me)
- id, userId, pagarmeRecipientId
- bankAccount (JSON), status

#### Template (Modelos Prontos)
- id, name, slug, category
- defaultBlocks (JSON), defaultTheme (JSON)

## 💳 Integração Pagar.me

### Fluxo de Pagamento

1. **Convidado escolhe presente** na lista pública
2. **Sistema calcula valores**:
   - Se `feeMode = PASS_TO_GUEST`: convidado paga `baseAmount + 7.99%`
   - Se `feeMode = ABSORB`: convidado paga `baseAmount`, taxa descontada do repasse
3. **Checkout Pagar.me** com split configurado:
   - Comissão plataforma: 7,99%
   - Repasse para subconta do cliente: restante
4. **Webhook** processa status (paid, refused, refunded)
5. **Atualização**: quantidade disponível, status do pedido, notificações

### Configuração

```typescript
// lib/pagarme.ts
import pagarme from 'pagarme';

export const client = await pagarme.client.connect({
  api_key: process.env.PAGARME_API_KEY,
});

// Criar subconta (recipient)
const recipient = await client.recipients.create({
  bank_account: { ... },
  transfer_interval: 'daily',
  transfer_enabled: true,
});

// Criar pedido com split
const order = await client.orders.create({
  amount: totalAmount,
  split_rules: [
    {
      recipient_id: recipientId,
      percentage: recipientPercentage,
    },
    {
      recipient_id: platformRecipientId,
      percentage: platformFeePercentage,
    },
  ],
});
```

### Webhooks

Endpoint: `/api/webhooks/pagarme`

Eventos suportados:
- `order.paid` / `charge.paid`
- `order.payment_failed`
- `order.refunded`
- `charge.chargeback`

## 🎨 Editor de Blocos

O mini-site do cliente usa um sistema de blocos drag-and-drop:

### Blocos Disponíveis

1. **Hero** - Capa com imagem, título, subtítulo, CTA
2. **Gallery** - Galeria de fotos
3. **Text** - Texto/mensagem do anfitrião
4. **GiftList** - Grid de presentes
5. **Messages** - Feed de recados públicos
6. **HowItWorks** - Bloco "Como funciona"
7. **Countdown** - Contagem regressiva para evento
8. **EventInfo** - Local e data do evento
9. **FAQ** - Perguntas frequentes
10. **Footer** - Rodapé com redes sociais

### Personalização por Bloco

- Cor de fundo
- Imagem de fundo
- Fonte (entre opções do tema)
- Tamanho de texto
- Alinhamento
- Botões (cor, texto, link)
- Espaçamento e bordas

### Estrutura de Dados

```typescript
// PageLayout.blocks (JSON)
[
  {
    id: "block-1",
    type: "hero",
    order: 0,
    config: {
      backgroundImage: "url",
      title: "Nosso Casamento",
      subtitle: "Ajude a realizar nossos sonhos",
      ctaText: "Ver presentes",
      ctaLink: "#presentes",
      backgroundColor: "#C65A3A",
      textColor: "#FFFFFF",
    }
  },
  // ... mais blocos
]
```

## 🔒 Segurança

### Autenticação

- NextAuth com estratégia JWT
- Senha com bcrypt (hash + salt)
- Session expira em 30 dias
- Refresh automático

### Validação

- Zod para schemas de validação
- Sanitização de inputs
- Rate limiting (via middleware)
- CSRF protection

### LGPD

- Consentimento explícito
- Política de privacidade
- Direito ao esquecimento
- Minimização de dados

## 📊 Dashboard do Cliente

### Métricas Exibidas

- **Total arrecadado** (aprovado, pendente, estornado)
- **Presentes mais presenteados**
- **Recados recebidos** (com filtros)
- **Feed de "quem presenteou"** (nome, item, valor, data)

### Ações Disponíveis

- Criar/editar presentes
- Editar página (blocos)
- Publicar/despublicar lista
- Configurar taxa (repassar ou assumir)
- Exportar relatório (CSV/PDF)
- Favoritar recados
- Ocultar/exibir recados

## 🎁 Regras de Negócio

### Limites

- **100 presentes por lista** (validado no backend)
- **Cada presente** pode ter foto, título, descrição
- **Quantidade disponível** bloqueia compra quando zera

### Taxa de 7,99%

- Cliente escolhe: **repassar** ao convidado OU **assumir**
- Se repassar: `totalAmount = baseAmount + fee`
- Se assumir: `totalAmount = baseAmount`, `recipientAmount = baseAmount - fee`

### Preços

- Sempre exibir com clareza:
  - Valor do presente
  - Taxa (quando repassada)
  - Total final
- Formato BRL: `R$ 1.234,56`

### Recados

- Moderação básica (rate limit)
- Cliente pode ocultar recados no site público
- Upload opcional de fotos (se habilitado)

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Variáveis de Ambiente

Configure no painel Vercel ou `.env.production`:

- `DATABASE_URL` (usar PgBouncer para pool)
- `NEXTAUTH_URL` (domínio de produção)
- `PAGARME_ENVIRONMENT=production`

### Banco de Dados

Recomendações:
- **Supabase** (PostgreSQL managed)
- **Neon** (serverless Postgres)
- **Render** (PostgreSQL)

### Migrate

```bash
npx prisma migrate deploy
```

## 📚 Recursos Adicionais

### Documentação das Dependências

- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Pagar.me API](https://docs.pagar.me)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query)
- [dnd-kit](https://docs.dndkit.com)

### Scripts Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Start produção
npm start

# Lint
npm run lint

# Prisma Studio (visualizar DB)
npx prisma studio

# Resetar banco (cuidado!)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Erro de conexão com banco

```bash
# Verifique o DATABASE_URL
echo $DATABASE_URL

# Teste a conexão
npx prisma db pull
```

### Erro no NextAuth

```bash
# Gere novo NEXTAUTH_SECRET
openssl rand -base64 32
```

### Imagens não carregam

- Verifique domínios permitidos em `next.config.js`
- Configure CORS no bucket S3/Cloudinary

## 📄 Licença

Projeto fictício para demonstração.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- Email: suporte@lumie.com.br
- Documentação: https://docs.lumie.com.br

---

**LUMIÊ** - Transforme seus presentes em realizações ✨
