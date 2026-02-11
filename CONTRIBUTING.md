# 🤝 Guia de Contribuição - LUMIÊ

Obrigado por considerar contribuir com a LUMIÊ! Este documento fornece diretrizes para manter o código consistente e de alta qualidade.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Testes](#testes)

## 📜 Código de Conduta

- Seja respeitoso e profissional
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/lumie-presentes.git
cd lumie-presentes

# Adicione o upstream
git remote add upstream https://github.com/original/lumie-presentes.git
```

### 2. Crie uma Branch

```bash
# Atualize main
git checkout main
git pull upstream main

# Crie feature branch
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 3. Faça as Mudanças

- Siga os [padrões de código](#padrões-de-código)
- Teste suas mudanças
- Documente se necessário

### 4. Commit

```bash
# Adicione mudanças
git add .

# Commit com mensagem descritiva
git commit -m "feat: adiciona filtro de presentes no dashboard"
```

### 5. Push e PR

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Abra Pull Request no GitHub
```

## 🎨 Padrões de Código

### TypeScript

```typescript
// ✅ BOM
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): User | null {
  // ...
}

// ❌ RUIM
function getUser(id: any) {
  // ...
}
```

### React Components

```typescript
// ✅ BOM - Componente funcional com tipos
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ RUIM - Sem tipos
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### Imports

```typescript
// ✅ BOM - Organizado por grupos
// 1. React e Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Bibliotecas externas
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 3. Componentes internos
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Utils e types
import { formatCurrency } from '@/lib/utils';
import type { User } from '@/types';
```

### Nomes

```typescript
// ✅ BOM
const isUserActive = true;
const getUserName = () => {};
const MAX_GIFTS_PER_LIST = 100;

interface UserProfile {
  // ...
}

// ❌ RUIM
const active = true;
const getName = () => {};
const max = 100;
```

### CSS / Tailwind

```tsx
// ✅ BOM - Classes organizadas
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
  {/* ... */}
</div>

// ✅ BOM - Usar utilitários customizados
<div className="glass-effect text-gradient-terracota">
  {/* ... */}
</div>

// ❌ RUIM - Muito complexo, considere componente
<div className="flex items-center justify-center w-full h-full min-h-screen bg-gradient-to-br from-terracota-50 via-white to-gold-50 p-4 sm:p-6 md:p-8 lg:p-12">
  {/* ... */}
</div>
```

### API Routes

```typescript
// ✅ BOM
export async function POST(request: Request) {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validar com Zod
    const data = schema.parse(body);
    
    // 3. Autorização
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // 4. Lógica de negócio
    const result = await prisma.model.create({ data });
    
    // 5. Retornar sucesso
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // 6. Tratamento de erros
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
```

### Prisma Queries

```typescript
// ✅ BOM - Select apenas o necessário
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// ❌ RUIM - Retorna tudo (inclui senha!)
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

## 📝 Commits

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação (não afeta código)
refactor: refatoração
test: testes
chore: manutenção

# Exemplos
feat: adiciona filtro de presentes por preço
fix: corrige cálculo de taxa no checkout
docs: atualiza README com instruções de deploy
style: formata código com prettier
refactor: extrai lógica de cálculo para utils
test: adiciona testes para calculateTotal
chore: atualiza dependências
```

### Mensagens de Commit

```bash
# ✅ BOM
feat: adiciona paginação na lista de presentes

- Adiciona componente Pagination
- Implementa lógica de offset/limit
- Atualiza API para suportar paginação

# ❌ RUIM
update stuff
fix bug
changes
```

## 🔀 Pull Requests

### Checklist

Antes de abrir um PR, verifique:

- [ ] Código segue os padrões
- [ ] Testes passam
- [ ] Sem console.logs desnecessários
- [ ] Documentação atualizada (se necessário)
- [ ] Branch está atualizada com main
- [ ] Sem conflitos

### Template

```markdown
## Descrição

Descreva as mudanças feitas.

## Tipo de mudança

- [ ] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação

## Como testar

1. Faça checkout desta branch
2. Execute `npm install`
3. Execute `npm run dev`
4. Acesse `/rota/teste`
5. Verifique que X funciona

## Screenshots (se aplicável)

Cole imagens aqui.

## Checklist

- [ ] Testei localmente
- [ ] Código segue os padrões
- [ ] Documentação atualizada
```

## 🧪 Testes

### Criar Testes

```typescript
// __tests__/utils.test.ts
import { calculateTotal } from '@/lib/utils';

describe('calculateTotal', () => {
  it('calcula corretamente para PASS_TO_GUEST', () => {
    const result = calculateTotal(100, 'PASS_TO_GUEST');
    expect(result.totalAmount).toBe(107.99);
    expect(result.feeAmount).toBe(7.99);
  });

  it('calcula corretamente para ABSORB', () => {
    const result = calculateTotal(100, 'ABSORB');
    expect(result.totalAmount).toBe(100);
    expect(result.recipientAmount).toBe(92.01);
  });
});
```

### Rodar Testes

```bash
npm test
```

## 🎯 Áreas que Precisam de Contribuição

### Alta Prioridade

- [ ] Testes unitários (0% coverage)
- [ ] Testes E2E
- [ ] Integração real com Pagar.me
- [ ] Sistema de emails (confirmação, notificações)
- [ ] Rate limiting em APIs

### Média Prioridade

- [ ] Editor de blocos drag-and-drop visual
- [ ] Upload de imagens real (UploadThing)
- [ ] Mais templates
- [ ] Dashboard administrativo
- [ ] Analytics

### Baixa Prioridade

- [ ] Modo escuro
- [ ] Internacionalização (i18n)
- [ ] PWA
- [ ] Notificações push

## 📦 Estrutura de Pastas

```
app/
├── (auth)/          # Rotas de autenticação
├── (dashboard)/     # Área do cliente logado
├── (public)/        # Páginas públicas (listas)
├── api/             # API routes
└── ...              # Outras rotas

components/
├── ui/              # Design system base
├── blocks/          # Blocos do editor
└── ...              # Outros componentes

lib/
├── prisma.ts        # Cliente Prisma
├── auth.ts          # NextAuth config
├── pagarme.ts       # Integração Pagar.me
└── utils.ts         # Funções auxiliares

prisma/
├── schema.prisma    # Schema do banco
└── seed.ts          # Seeds
```

## 🔒 Segurança

### Nunca Commite

- ❌ `.env` ou variáveis de ambiente
- ❌ Senhas ou API keys
- ❌ Tokens ou secrets
- ❌ Dados sensíveis de usuários

### Sempre

- ✅ Use validação Zod em APIs
- ✅ Sanitize inputs
- ✅ Use autenticação/autorização
- ✅ Hash senhas com bcrypt
- ✅ Valide assinaturas de webhooks

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [NextAuth.js](https://next-auth.js.org)

## ❓ Dúvidas

- Abra uma [Issue](https://github.com/original/lumie-presentes/issues)
- Entre no Discord (link)
- Email: dev@lumie.com.br

---

**Obrigado por contribuir! 🎉**

Cada contribuição, por menor que seja, torna a LUMIÊ melhor.
