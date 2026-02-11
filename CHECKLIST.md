# ✅ Checklist de Verificação - LUMIÊ

Use este checklist para garantir que tudo está funcionando corretamente.

## 📋 Antes de Começar

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] PostgreSQL instalado ou conta Supabase criada
- [ ] Editor de código instalado (VS Code recomendado)

## 🔧 Instalação

- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Banco de dados criado
- [ ] Migrações executadas (`npx prisma migrate dev`)
- [ ] Cliente Prisma gerado (`npx prisma generate`)
- [ ] Seeds executados (`npx prisma db seed`) - opcional
- [ ] Logo copiado para `public/logo.png`

## 🚀 Servidor

- [ ] Servidor iniciado (`npm run dev`)
- [ ] Acesso ao http://localhost:3000 funcionando
- [ ] Sem erros no console

## 🔐 Autenticação

- [ ] Página de cadastro acessível (`/cadastro`)
- [ ] Cadastro funciona (criar usuário de teste)
- [ ] Página de login acessível (`/login`)
- [ ] Login funciona com usuário criado
- [ ] Redirecionamento para dashboard após login

## 📊 Dashboard

- [ ] Dashboard carrega (`/dashboard`)
- [ ] Cards de métricas exibem zeros inicialmente
- [ ] Botão "Novo presente" funciona
- [ ] Botão "Ver minha lista" funciona

## 🎁 Presentes

- [ ] Criar presente funciona
- [ ] Upload de foto funciona (ou base64)
- [ ] Presente aparece na lista
- [ ] Editar presente funciona
- [ ] Duplicar presente funciona
- [ ] Deletar presente funciona
- [ ] Limite de 100 presentes validado

## 🌐 Página Pública

- [ ] Lista pública acessível (`/lista/:slug`)
- [ ] Presentes aparecem corretamente
- [ ] Fotos carregam
- [ ] Valores formatados (R$ 1.234,56)
- [ ] Botão "Presentear" funciona
- [ ] Seção "Como funciona" visível

## 🛒 Checkout

- [ ] Página de checkout carrega
- [ ] Formulário validado
- [ ] Cálculo de valores correto
- [ ] Taxa exibida (se PASS_TO_GUEST)
- [ ] Campo de recado aparece (se permitido)
- [ ] Botão "Pagar" funciona
- [ ] Redirecionamento para página de sucesso

## ✅ Após "Pagamento"

- [ ] Página de sucesso exibe confirmação
- [ ] Quantidade disponível atualizada
- [ ] Pedido aparece no dashboard
- [ ] Recado aparece (se deixado)
- [ ] Status do pedido = PAID

## 🗄️ Banco de Dados

- [ ] Prisma Studio funciona (`npx prisma studio`)
- [ ] Tabelas criadas corretamente
- [ ] Templates carregados (se executou seed)
- [ ] Dados salvando corretamente

## 🎨 Visual

- [ ] Logo LUMIÊ aparece
- [ ] Cores terracota aplicadas
- [ ] Fonte Playfair Display carrega
- [ ] Fonte Inter carrega
- [ ] Layout responsivo no mobile
- [ ] Animações funcionam

## ⚙️ Configurações

- [ ] Arquivo `.env` não está no git
- [ ] `.gitignore` configurado
- [ ] Variáveis de ambiente documentadas
- [ ] NEXTAUTH_SECRET configurado

## 💳 Pagar.me (Opcional - Sandbox)

- [ ] API Key configurada
- [ ] Ambiente = sandbox
- [ ] Webhook URL configurada (em produção)

## 📝 Documentação

- [ ] README.md lido
- [ ] SETUP.md lido
- [ ] ENTREGA.md lido
- [ ] QUICKSTART.md lido

## 🧪 Testes Básicos

### Teste 1: Fluxo Completo Cliente

1. [ ] Cadastrar
2. [ ] Login
3. [ ] Criar 3 presentes
4. [ ] Editar 1 presente
5. [ ] Duplicar 1 presente
6. [ ] Deletar 1 presente
7. [ ] Verificar que ficou com 4 presentes
8. [ ] Ver lista pública

### Teste 2: Fluxo Completo Convidado

1. [ ] Abrir aba anônima
2. [ ] Acessar lista pública
3. [ ] Escolher presente
4. [ ] Preencher checkout
5. [ ] Deixar recado
6. [ ] Finalizar "pagamento"
7. [ ] Ver confirmação

### Teste 3: Verificação Dashboard

1. [ ] Voltar ao dashboard
2. [ ] Ver total arrecadado atualizado
3. [ ] Ver quantidade de presentes
4. [ ] Ver recado recebido
5. [ ] Verificar que quantidade disponível diminuiu

## 🐛 Problemas Conhecidos

Se encontrar problemas, verifique:

### Imagens não carregam
- [ ] Domínios configurados em `next.config.js`
- [ ] Logo existe em `public/logo.png`

### Erro no banco
- [ ] DATABASE_URL correto
- [ ] PostgreSQL rodando
- [ ] Migrações executadas

### Erro no NextAuth
- [ ] NEXTAUTH_SECRET configurado
- [ ] NEXTAUTH_URL correto

### Build falha
- [ ] Todas dependências instaladas
- [ ] TypeScript sem erros
- [ ] Prisma client gerado

## ✅ Pronto para Produção

Antes de fazer deploy, verifique:

- [ ] Variáveis de ambiente configuradas no host
- [ ] DATABASE_URL de produção
- [ ] NEXTAUTH_URL de produção
- [ ] PAGARME_ENVIRONMENT = "production"
- [ ] Logo otimizado
- [ ] Seeds executados no banco de produção
- [ ] Teste completo em produção

## 🎉 Tudo Funcionando?

Se você marcou todos os checkboxes acima, parabéns! 🎊

Seu sistema LUMIÊ está **100% funcional** e pronto para uso.

---

## 📞 Precisa de Ajuda?

1. Leia `README.md` - Documentação completa
2. Leia `SETUP.md` - Guia de instalação
3. Leia `QUICKSTART.md` - Início rápido
4. Veja os logs do terminal
5. Use `npx prisma studio` para ver o banco

---

**Criado com ❤️ para a LUMIÊ**
