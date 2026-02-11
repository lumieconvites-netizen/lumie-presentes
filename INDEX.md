# 📚 LUMIÊ - Índice de Documentação

Bem-vindo à documentação completa do sistema LUMIÊ! Este índice te ajuda a encontrar rapidamente o que você precisa.

---

## 🚀 Para Começar

### Você é novo aqui?

1. **[QUICKSTART.md](QUICKSTART.md)** ⚡
   - Comece aqui! Guia rápido de 5 minutos
   - Instalação básica
   - Primeiros passos
   - Comandos essenciais

2. **[SETUP.md](SETUP.md)** 🔧
   - Instalação completa e detalhada
   - Configuração do banco de dados
   - Configuração do Pagar.me
   - Troubleshooting

3. **[CHECKLIST.md](CHECKLIST.md)** ✅
   - Checklist de verificação
   - Confirme que tudo está funcionando
   - Testes básicos
   - Preparação para produção

---

## 📖 Documentação Principal

### [README.md](README.md)
**Documentação completa do sistema** (511 linhas)

**Conteúdo:**
- Visão geral do projeto
- Principais funcionalidades
- Identidade visual (tema terracota)
- Estrutura do projeto
- Modelo de dados (Prisma)
- Integração Pagar.me
- Editor de blocos
- Dashboard do cliente
- Regras de negócio
- Deploy

**Quando usar:** Referência completa, arquitetura, decisões técnicas

---

## 🎯 Documentos Específicos

### [ENTREGA.md](ENTREGA.md)
**O que foi entregue no projeto** (421 linhas)

**Conteúdo:**
- Lista completa de arquivos criados
- Funcionalidades implementadas
- Estrutura do código
- Fluxo completo (cliente e convidado)
- Métricas e limites
- Resumo técnico

**Quando usar:** Ver o que foi feito, validar entrega

---

### [CONTRIBUTING.md](CONTRIBUTING.md)
**Guia de contribuição** (432 linhas)

**Conteúdo:**
- Como contribuir
- Padrões de código
- Convenções de commits
- Pull requests
- Segurança
- Áreas que precisam de contribuição

**Quando usar:** Antes de fazer mudanças no código

---

## 🗂️ Estrutura de Arquivos

### Configuração

```
├── package.json         → Dependências
├── tsconfig.json        → TypeScript config
├── tailwind.config.ts   → Tema terracota
├── next.config.js       → Next.js config
├── postcss.config.js    → PostCSS
├── .gitignore           → Git ignore
├── .env.example         → Exemplo de env vars
└── LICENSE              → Licença MIT
```

### Prisma (Banco de Dados)

```
prisma/
├── schema.prisma        → Schema completo (9 entidades)
└── seed.ts              → Seeds (5 templates)
```

### Código-fonte

```
app/
├── (auth)/              → Login, cadastro
├── (dashboard)/         → Área do cliente
├── (public)/            → Listas públicas
├── api/                 → API routes
├── globals.css          → Estilos globais
├── layout.tsx           → Layout raiz
├── page.tsx             → Home marketing
├── loading.tsx          → Loading global
└── not-found.tsx        → 404

components/
├── ui/                  → Button, Input, Card, etc
└── providers/           → NextAuth, React Query

lib/
├── prisma.ts            → Cliente Prisma
├── auth.ts              → NextAuth config
├── pagarme.ts           → Pagar.me SDK
└── utils.ts             → Funções auxiliares
```

---

## 🎓 Aprenda por Tópico

### Autenticação
- **[README.md > Autenticação](README.md#autenticação)**
- Arquivos: `lib/auth.ts`, `app/api/auth/`
- NextAuth + JWT + bcrypt

### Presentes
- **[README.md > CRUD de Presentes](README.md#crud-de-presentes)**
- Arquivos: `app/api/gifts/`, `app/(dashboard)/dashboard/presentes/`
- Limite de 100, validações, duplicação

### Pagamentos
- **[README.md > Integração Pagar.me](README.md#integração-pagarme)**
- Arquivos: `lib/pagarme.ts`, `app/api/webhooks/pagarme/`
- Split, subcontas, taxa 7,99%

### Templates
- **[README.md > Templates Prontos](README.md#templates-prontos)**
- Arquivo: `prisma/seed.ts`
- 5 templates com blocos configurados

### Dashboard
- **[README.md > Dashboard do Cliente](README.md#dashboard-do-cliente)**
- Arquivo: `app/(dashboard)/dashboard/page.tsx`
- Métricas, ações rápidas

### Página Pública
- **[README.md > Página Pública](README.md#página-pública)**
- Arquivo: `app/(public)/lista/[slug]/page.tsx`
- Mini-site do cliente

---

## 🛠️ Tarefas Comuns

### Instalar e Rodar

```bash
# Instalação rápida
→ Ver: QUICKSTART.md

# Instalação completa
→ Ver: SETUP.md
```

### Criar um Presente

```bash
→ Ver: QUICKSTART.md > "Criar Primeiro Presente"
→ Código: app/api/gifts/route.ts
```

### Configurar Pagar.me

```bash
→ Ver: SETUP.md > "Configurar Pagar.me"
→ Código: lib/pagarme.ts
```

### Adicionar Template

```bash
→ Ver: README.md > "Templates Prontos"
→ Código: prisma/seed.ts
```

### Deploy

```bash
→ Ver: README.md > "Deploy"
→ Ver: SETUP.md > "Deploy"
```

### Troubleshooting

```bash
→ Ver: SETUP.md > "Problemas Comuns"
→ Ver: QUICKSTART.md > "Problemas Comuns"
```

---

## 📊 Por Nível de Experiência

### Iniciante
1. [QUICKSTART.md](QUICKSTART.md) - Comece aqui
2. [CHECKLIST.md](CHECKLIST.md) - Verifique tudo
3. [README.md > Como Usar](README.md#como-usar) - Entenda o básico

### Intermediário
1. [README.md](README.md) - Leia completo
2. [SETUP.md](SETUP.md) - Configuração avançada
3. Explore o código em `app/` e `lib/`

### Avançado
1. [ENTREGA.md](ENTREGA.md) - Arquitetura completa
2. [CONTRIBUTING.md](CONTRIBUTING.md) - Padrões de código
3. Código-fonte: `prisma/schema.prisma`, `lib/pagarme.ts`

---

## 🔍 Busca Rápida

### Por Palavra-chave

| Busco por... | Veja |
|-------------|------|
| Instalação | QUICKSTART.md, SETUP.md |
| Banco de dados | SETUP.md > "Configurar Banco" |
| Pagar.me | README.md > "Integração Pagar.me" |
| Presentes | README.md > "CRUD de Presentes" |
| Templates | README.md > "Templates", seed.ts |
| Dashboard | README.md > "Dashboard" |
| Checkout | README.md > "Checkout" |
| Deploy | README.md > "Deploy" |
| Erros | SETUP.md > "Problemas Comuns" |
| Contribuir | CONTRIBUTING.md |

---

## 📞 Ajuda

### Sequência Recomendada de Leitura

```
Problema com instalação?
↓
1. QUICKSTART.md
2. SETUP.md > "Problemas Comuns"
3. CHECKLIST.md

Dúvida sobre funcionalidade?
↓
1. README.md (busque na página)
2. ENTREGA.md (veja o que foi feito)

Quer contribuir?
↓
1. CONTRIBUTING.md
2. README.md > "Estrutura"
```

### Ainda com Dúvidas?

1. Pesquise neste índice
2. Leia o documento relevante
3. Veja os exemplos de código
4. Abra uma issue no GitHub

---

## 📝 Documentos por Tamanho

| Documento | Linhas | Tempo de Leitura |
|-----------|--------|------------------|
| QUICKSTART.md | ~300 | 5-10 min |
| CHECKLIST.md | ~200 | 10 min (fazendo) |
| ENTREGA.md | ~400 | 15 min |
| CONTRIBUTING.md | ~400 | 15 min |
| README.md | ~500 | 20-30 min |
| SETUP.md | ~350 | 15-20 min |

---

## ✅ Checklist de Leitura

Para dominar o projeto completamente:

- [ ] Li o QUICKSTART.md
- [ ] Segui o SETUP.md
- [ ] Completei o CHECKLIST.md
- [ ] Li o README.md completo
- [ ] Vi o ENTREGA.md
- [ ] Entendi o CONTRIBUTING.md
- [ ] Explorei o código-fonte
- [ ] Testei todas as funcionalidades

---

## 🎯 Objetivos por Documento

| Documento | Objetivo |
|-----------|----------|
| **QUICKSTART.md** | Rodar em 5 minutos |
| **SETUP.md** | Instalação completa |
| **CHECKLIST.md** | Validar funcionamento |
| **README.md** | Entender arquitetura |
| **ENTREGA.md** | Ver o que foi feito |
| **CONTRIBUTING.md** | Contribuir com qualidade |

---

**Comece por:** [QUICKSTART.md](QUICKSTART.md) ⚡

**Dúvidas?** Leia [SETUP.md](SETUP.md) 🔧

**Tudo funcionando?** Veja [CHECKLIST.md](CHECKLIST.md) ✅

---

**LUMIÊ** - Transforme seus presentes em realizações ✨
