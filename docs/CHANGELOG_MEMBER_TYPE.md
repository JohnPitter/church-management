# Implementação de Tipos de Membro (Membro vs Congregado)

**Data**: 06/12/2024
**Desenvolvedor**: Claude Code

## 📝 Resumo da Implementação

Implementado sistema para diferenciar **Membros** de **Congregados**, com regras específicas para assinatura de documentos.

---

## 🎯 Requisitos Implementados

### ✅ 1. Classificação de Membros
- Adicionado campo `memberType` na entidade Member
- Dois tipos disponíveis:
  - **Membro**: Pode assinar documentos e atas oficiais
  - **Congregado**: Não pode assinar documentos oficiais

### ✅ 2. Restrições de Assinatura
- Congregados **NÃO aparecem** em listas de assinatura
- Apenas membros oficiais podem assinar documentos
- Filtro automático em exportações PDF/Word de listas de assinatura

### ✅ 3. Inclusão em Relatórios
- Congregados **APARECEM** em todos os relatórios
- Estatísticas incluem ambos os tipos
- Exportações CSV/Excel incluem todos os membros

---

## 🔧 Arquivos Modificados

### **1. Domain Entity**
**`src/modules/church-management/members/domain/entities/Member.ts`**
- ✅ Adicionado enum `MemberType` (Member, Congregant)
- ✅ Adicionado campo `memberType: MemberType` na interface Member
- ✅ Criados métodos de validação:
  - `canSignDocuments()`: Verifica se pode assinar
  - `canVoteInAssembly()`: Atualizado para verificar tipo
  - `isCongregant()`: Verifica se é congregado
  - `isMember()`: Verifica se é membro oficial

### **2. Create Member Modal**
**`src/presentation/components/CreateMemberModal.tsx`**
- ✅ Adicionado campo de seleção "Tipo de Membro"
- ✅ Valor padrão: Membro
- ✅ Opções: Membro (pode assinar) / Congregado (não pode assinar)
- ✅ Texto explicativo sobre diferença

### **3. Members Management Page**
**`src/presentation/pages/MembersManagementPage.tsx`**
- ✅ Adicionado filtro de tipo de membro
- ✅ Adicionada coluna "Tipo" na tabela
- ✅ Função `getMembersWhoCanSign()` para filtrar apenas membros oficiais
- ✅ Atualizado exportSignatureListToPDF() para usar apenas membros oficiais
- ✅ Atualizado exportSignatureListToWord() para usar apenas membros oficiais
- ✅ Atualizado exportToCSV() para incluir tipo de membro
- ✅ Badge visual com cores:
  - Azul: Membro
  - Roxo: Congregado

---

## 📊 Regras de Negócio

### **Membros Oficiais**
```typescript
- Podem assinar documentos/atas
- Podem votar em assembleias (se batizados e maiores de 18)
- Aparecem em listas de assinatura
- Aparecem em relatórios
```

### **Congregados**
```typescript
- NÃO podem assinar documentos/atas
- NÃO podem votar em assembleias
- NÃO aparecem em listas de assinatura
- Aparecem em relatórios normalmente
```

---

## 🎨 Interface do Usuário

### **1. Formulário de Cadastro**
```
[Tipo de Membro *]
┌──────────────────────────────────────────┐
│ Membro (pode assinar atas)              │
│ Congregado (não pode assinar atas)      │
└──────────────────────────────────────────┘
ℹ️ Congregados aparecem nos relatórios mas não podem assinar documentos oficiais
```

### **2. Tabela de Membros**
```
| Nome | Contato | Idade | Tipo | Status | Ações |
|------|---------|-------|------|--------|-------|
| João | 123-456 | 25    | 🔵 Membro | ✅ Ativo | Editar |
| Maria| 789-012 | 30    | 🟣 Congregado | ✅ Ativo | Editar |
```

### **3. Filtros**
```
[Buscar...] [Status: Todos] [Tipo: Todos os Tipos ▼]
                             - Todos os Tipos
                             - Membros
                             - Congregados
```

---

## 📄 Exportações

### **Lista de Assinaturas (PDF/Word)**
```
Lista de Assinaturas
====================

01. João Silva
    (11) 98765-4321 • joao@email.com
    _______________________________________

02. Pedro Santos
    (11) 91234-5678 • pedro@email.com
    _______________________________________

Total de membros (aptos a assinar): 2

Nota: Congregados não aparecem nesta lista pois não podem
assinar documentos oficiais
```

### **Relatórios Completos (CSV/Excel/PDF)**
```
Nome    | Email  | Tipo         | Status
--------|--------|--------------|--------
João    | j@...  | Membro       | Ativo
Maria   | m@...  | Congregado   | Ativo
Pedro   | p@...  | Membro       | Ativo
```

---

## 🧪 Casos de Uso

### **Caso 1: Cadastrar Novo Membro**
1. Clicar em "Novo Membro"
2. Preencher dados pessoais
3. **Selecionar tipo**: Membro ou Congregado
4. Salvar
✅ Membro criado com tipo correto

### **Caso 2: Gerar Lista de Assinaturas**
1. Ir para aba "Relatórios"
2. Clicar em "Lista de Assinatura em PDF"
✅ Apenas membros oficiais aparecem
❌ Congregados são excluídos automaticamente

### **Caso 3: Exportar Relatório Geral**
1. Ir para aba "Relatórios"
2. Clicar em "Exportar para CSV"
✅ Todos os membros aparecem (incluindo congregados)
✅ Coluna "Tipo de Membro" mostra classificação

### **Caso 4: Filtrar Apenas Congregados**
1. Na tabela de membros
2. Filtro "Tipo" → Selecionar "Congregados"
✅ Mostra apenas congregados
✅ Estatísticas atualizam

---

## 📋 Checklist de Implementação

### Entidade e Domain
- [x] Criar enum `MemberType`
- [x] Adicionar campo `memberType` em Member
- [x] Criar método `canSignDocuments()`
- [x] Atualizar `canVoteInAssembly()`
- [x] Criar métodos `isCongregant()` e `isMember()`

### Interface de Cadastro
- [x] Adicionar seletor de tipo no formulário
- [x] Definir valor padrão como "Membro"
- [x] Adicionar texto explicativo
- [x] Incluir no formData inicial
- [x] Incluir ao editar membro existente

### Interface de Listagem
- [x] Adicionar filtro de tipo
- [x] Adicionar coluna "Tipo" na tabela
- [x] Criar funções de label e cor
- [x] Atualizar filtro combinado

### Exportações
- [x] Criar função `getMembersWhoCanSign()`
- [x] Atualizar exportSignatureListToPDF()
- [x] Atualizar exportSignatureListToWord()
- [x] Adicionar tipo em exportToCSV()
- [x] Adicionar nota explicativa em listas

### Testes
- [ ] Testar cadastro de membro
- [ ] Testar cadastro de congregado
- [ ] Testar filtro por tipo
- [ ] Testar lista de assinaturas (sem congregados)
- [ ] Testar relatórios (com congregados)
- [ ] Testar edição de tipo

---

## 🚀 Próximos Passos

1. **Testar a funcionalidade**
   - Criar membros de ambos os tipos
   - Gerar listas de assinatura
   - Verificar relatórios

2. **Migrar dados existentes**
   - Todos os membros existentes precisam receber um tipo
   - Sugerido: Definir todos como "Membro" por padrão
   - Script de migração recomendado:

```typescript
// Script de migração (executar no console Firebase)
const updateExistingMembers = async () => {
  const membersRef = collection(db, 'members');
  const snapshot = await getDocs(membersRef);

  snapshot.forEach(async (doc) => {
    if (!doc.data().memberType) {
      await updateDoc(doc.ref, {
        memberType: 'member' // Define todos como membros por padrão
      });
    }
  });
};
```

3. **Atualizar Firestore Rules**
   - Garantir que o campo `memberType` seja obrigatório
   - Validar valores permitidos (member/congregant)

---

## 💡 Dicas de Uso

1. **Quando cadastrar como Congregado?**
   - Pessoas que frequentam mas não são membros oficiais
   - Visitantes regulares
   - Pessoas em processo de membresia

2. **Quando cadastrar como Membro?**
   - Membros batizados
   - Pessoas transferidas de outras igrejas
   - Membros com direitos completos

3. **Listas de Assinatura**
   - Use sempre PDF ou Word para atas oficiais
   - Congregados não aparecerão automaticamente
   - Ideal para assembleias, reuniões oficiais

4. **Relatórios Estatísticos**
   - Use CSV/Excel para análises completas
   - Todos os tipos aparecem
   - Útil para planejamento e acompanhamento

---

**Desenvolvido com ❤️ por Claude Code**
