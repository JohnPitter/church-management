# Instruções de Validação de Formulários

**Data de Criação**: 28/11/2025
**Versão**: 1.1
**Aplicável a**: Todos os formulários do sistema

---

## ⚠️ IMPORTANTE: Documentação Completa

Este documento foca especificamente em **validação de formulários**.

Para o **processo completo** de desenvolvimento de novas funcionalidades, incluindo:
- ✅ Configuração Firebase (firestore.rules, indexes, storage.rules)
- ✅ Sistema de Permissões
- ✅ Sistema de Logs e Auditoria
- ✅ Estrutura de arquivos

**Consulte**: `DEVELOPMENT_INSTRUCTIONS.md`

---

## 📋 Índice

1. [Princípios Gerais](#princípios-gerais)
2. [Regras de Validação por Tipo de Campo](#regras-de-validação-por-tipo-de-campo)
3. [Comportamento do Botão Salvar](#comportamento-do-botão-salvar)
4. [Validação em Tempo Real](#validação-em-tempo-real)
5. [Mensagens de Erro](#mensagens-de-erro)
6. [Exemplos de Implementação](#exemplos-de-implementação)

---

## Princípios Gerais

### 1. Validação Obrigatória
- **TODOS** os campos input devem ter validação
- Campos obrigatórios devem ser marcados com asterisco vermelho `<span className="text-red-500">*</span>`
- Validação deve ocorrer tanto no frontend quanto no backend

### 2. Botão Salvar Desabilitado
- O botão de salvar/submeter **DEVE** estar desabilitado até que todos os campos obrigatórios sejam preenchidos corretamente
- Use o atributo `disabled` no botão
- Aplique classes CSS diferentes para estado desabilitado: `bg-gray-300 text-gray-500 cursor-not-allowed`
- Adicione um `title` no botão desabilitado explicando o que falta: `"Preencha todos os campos obrigatórios corretamente"`

### 3. Feedback Visual
- Campos com erro devem ter borda vermelha
- Campos válidos (após interação) devem ter feedback visual positivo (opcional)
- Mensagens de erro devem aparecer próximas ao campo relevante
- Use um painel de resumo de erros no topo do formulário quando houver múltiplos erros

---

## Regras de Validação por Tipo de Campo

### 📝 Campos de Texto (input type="text")

#### Nome/Título
```typescript
// Validações obrigatórias:
- Não pode estar vazio
- Mínimo: 2 caracteres
- Máximo: 200 caracteres (ajuste conforme necessidade)
- Sem caracteres especiais perigosos (XSS protection)

// Exemplo de validação:
if (!name?.trim()) {
  errors.push('Nome é obrigatório');
}
if (name && name.length < 2) {
  errors.push('Nome deve ter pelo menos 2 caracteres');
}
if (name && name.length > 200) {
  errors.push('Nome não pode ter mais de 200 caracteres');
}
```

#### Descrição
```typescript
// Validações:
- Opcional ou obrigatório (defina claramente)
- Máximo: 1000 caracteres (ou conforme necessidade)
- Use <textarea> para textos longos

// Exemplo:
if (description && description.length > 1000) {
  errors.push('Descrição não pode ter mais de 1000 caracteres');
}
```

### 📧 Email
```typescript
// Validações obrigatórias:
- Formato válido de email
- Máximo: 255 caracteres

// Regex recomendado:
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (email && !emailRegex.test(email)) {
  errors.push('Email inválido');
}
```

### 📱 Telefone
```typescript
// Validações:
- Formato brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
- Remover caracteres não numéricos antes de salvar

// Regex recomendado:
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;

if (phone && !phoneRegex.test(phone)) {
  errors.push('Telefone inválido. Use formato: (XX) XXXXX-XXXX');
}
```

### 💰 Valores Monetários (input type="number")
```typescript
// Validações obrigatórias:
- Não pode ser negativo (geralmente)
- Máximo 2 casas decimais
- Use step="0.01"

if (value === undefined || value < 0) {
  errors.push('Valor deve ser positivo');
}

// Formatação para exibição:
const formatted = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(value);
```

### 📅 Datas (input type="date")
```typescript
// Validações comuns:
- Data de nascimento: não pode ser futura
- Data de aquisição: não pode ser futura
- Data de vencimento: não pode ser anterior à data de início
- Data de evento futuro: não pode ser no passado

// Exemplos:
if (date && date > new Date()) {
  errors.push('Data não pode ser no futuro');
}

if (endDate && startDate && endDate < startDate) {
  errors.push('Data final não pode ser anterior à data inicial');
}

// Formato para input:
const dateString = date.toISOString().split('T')[0];

// Atributos úteis:
- max={new Date().toISOString().split('T')[0]} // Data máxima hoje
- min={startDate?.toISOString().split('T')[0]} // Data mínima
```

### 🔢 Números Inteiros
```typescript
// Validações:
- Apenas números inteiros
- Sem casas decimais
- Range mínimo/máximo quando aplicável

if (!Number.isInteger(quantity)) {
  errors.push('Quantidade deve ser um número inteiro');
}

if (quantity < 1) {
  errors.push('Quantidade deve ser maior que zero');
}
```

### 📋 Select/Dropdown
```typescript
// Validações:
- Valor deve estar na lista de opções válidas
- Não pode ser vazio se obrigatório

if (!category) {
  errors.push('Categoria é obrigatória');
}

// Sempre forneça uma opção padrão ou placeholder:
<select required>
  <option value="">Selecione uma opção</option>
  <option value="value1">Label 1</option>
</select>
```

### ✅ Checkbox
```typescript
// Validações:
- Se obrigatório, deve estar marcado
- Para termos de uso/políticas

if (requiresAgreement && !agreed) {
  errors.push('Você deve concordar com os termos');
}
```

### 📎 Upload de Arquivos
```typescript
// Validações obrigatórias:
- Tipo de arquivo permitido
- Tamanho máximo
- Quantidade máxima (se múltiplos)

const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
const maxSize = 5 * 1024 * 1024; // 5MB

if (file && !allowedTypes.includes(file.type)) {
  errors.push('Tipo de arquivo não permitido');
}

if (file && file.size > maxSize) {
  errors.push('Arquivo muito grande. Máximo: 5MB');
}
```

---

## Comportamento do Botão Salvar

### Estado Desabilitado
```tsx
const [formData, setFormData] = useState<Partial<Entity>>({...});
const [validationErrors, setValidationErrors] = useState<string[]>([]);

// Função de validação que retorna true se válido
const isFormValid = EntityValidator.isFormValid(formData);

// No botão:
<button
  type="submit"
  disabled={!isFormValid}
  className={`px-6 py-2 font-medium rounded-lg transition-colors ${
    isFormValid
      ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
  title={!isFormValid ? 'Preencha todos os campos obrigatórios corretamente' : ''}
>
  Salvar
</button>
```

### Checklist do Botão Salvar
- [ ] Tem atributo `disabled` baseado na validação
- [ ] Muda de cor quando desabilitado (cinza)
- [ ] Cursor muda para `not-allowed` quando desabilitado
- [ ] Tem `title` explicativo quando desabilitado
- [ ] Não permite submissão quando há erros

---

## Validação em Tempo Real

### Quando Validar
1. **onChange**: Para feedback imediato (opcional, pode ser muito intrusivo)
2. **onBlur**: Quando o usuário sai do campo (recomendado)
3. **onSubmit**: Sempre validar antes de submeter

### Implementação Recomendada
```tsx
const handleInputChange = (field: keyof Entity, value: any) => {
  const newFormData = { ...formData, [field]: value };
  setFormData(newFormData);

  // Validação em tempo real
  const errors = EntityValidator.validate(newFormData);
  setValidationErrors(errors);
};

// No input:
<input
  type="text"
  value={formData.name}
  onChange={(e) => handleInputChange('name', e.target.value)}
  onBlur={() => {
    // Validar especificamente este campo ao perder foco
    const errors = EntityValidator.validate(formData);
    setValidationErrors(errors);
  }}
  className={`w-full px-4 py-2 border rounded-lg ${
    validationErrors.some(e => e.includes('Nome'))
      ? 'border-red-500'
      : 'border-gray-300'
  }`}
/>
```

---

## Mensagens de Erro

### Localização
1. **Painel de Resumo** (topo do formulário):
```tsx
{validationErrors.length > 0 && (
  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
    <h3 className="text-sm font-medium text-red-800 mb-2">
      Erros de validação:
    </h3>
    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
      {validationErrors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  </div>
)}
```

2. **Abaixo do Campo** (específico):
```tsx
<input ... />
{fieldError && (
  <p className="mt-1 text-sm text-red-600">{fieldError}</p>
)}
```

### Boas Práticas para Mensagens
- ✅ Seja específico: "Email inválido" ao invés de "Erro no campo"
- ✅ Seja construtivo: "CPF deve conter 11 dígitos" ao invés de "CPF errado"
- ✅ Use linguagem amigável e em português
- ✅ Evite jargão técnico
- ❌ Não use mensagens genéricas: "Erro", "Campo inválido"
- ❌ Não culpe o usuário: "Você digitou errado"

---

## Exemplos de Implementação

### Exemplo Completo: Entidade com Validação

#### 1. Entity Definition (Domain Layer)
```typescript
// src/domain/entities/Asset.ts

export interface Asset {
  id: string;
  name: string;
  value: number;
  acquisitionDate: Date;
  // ... outros campos
}

export class AssetEntity {
  static validateAsset(asset: Partial<Asset>): string[] {
    const errors: string[] = [];

    // Nome obrigatório
    if (!asset.name?.trim()) {
      errors.push('Nome é obrigatório');
    }
    if (asset.name && asset.name.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    if (asset.name && asset.name.length > 200) {
      errors.push('Nome não pode ter mais de 200 caracteres');
    }

    // Valor obrigatório e positivo
    if (asset.value === undefined || asset.value < 0) {
      errors.push('Valor é obrigatório e deve ser positivo');
    }

    // Data não pode ser futura
    if (asset.acquisitionDate && asset.acquisitionDate > new Date()) {
      errors.push('Data de aquisição não pode ser no futuro');
    }

    return errors;
  }

  static isFormValid(asset: Partial<Asset>): boolean {
    return this.validateAsset(asset).length === 0;
  }
}
```

#### 2. Form Component (Presentation Layer)
```tsx
// src/presentation/pages/AssetFormPage.tsx

import { Asset, AssetEntity } from '../../domain/entities/Asset';

const AssetFormPage: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    value: 0,
    acquisitionDate: new Date()
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (field: keyof Asset, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Validação em tempo real
    const errors = AssetEntity.validateAsset(newFormData);
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação final
    if (!AssetEntity.isFormValid(formData)) {
      alert('Por favor, corrija os erros no formulário antes de salvar.');
      return;
    }

    try {
      // Salvar no serviço
      await assetService.createAsset(formData);
      alert('Patrimônio criado com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    }
  };

  const isFormValid = AssetEntity.isFormValid(formData);

  return (
    <form onSubmit={handleSubmit}>
      {/* Painel de Erros */}
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Erros de validação:
          </h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Campo Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Patrimônio <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          maxLength={200}
          required
        />
      </div>

      {/* Campo Valor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valor (R$) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.value}
          onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      {/* Campo Data */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data de Aquisição <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.acquisitionDate instanceof Date
            ? formData.acquisitionDate.toISOString().split('T')[0]
            : ''}
          onChange={(e) => handleInputChange('acquisitionDate', new Date(e.target.value))}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      {/* Nota de Campos Obrigatórios */}
      <p className="mt-4 text-sm text-gray-500">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => history.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isFormValid}
          className={`px-6 py-2 font-medium rounded-lg transition-colors ${
            isFormValid
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isFormValid ? 'Preencha todos os campos obrigatórios corretamente' : ''}
        >
          Salvar Patrimônio
        </button>
      </div>
    </form>
  );
};
```

---

## Checklist de Validação

Use este checklist para garantir que seu formulário está completo:

### Estrutura
- [ ] Todos os campos têm validação definida
- [ ] Campos obrigatórios marcados com asterisco vermelho
- [ ] Função de validação criada na camada de domínio
- [ ] Função `isFormValid()` implementada

### Campos
- [ ] Inputs têm atributos adequados (type, min, max, maxLength, etc.)
- [ ] Placeholders informativos
- [ ] Labels descritivos e claros
- [ ] Classes CSS para estados de erro

### Validação
- [ ] Validação em tempo real implementada
- [ ] Validação no submit implementada
- [ ] Mensagens de erro específicas e claras
- [ ] Painel de resumo de erros no topo do formulário

### Botão Salvar
- [ ] Desabilitado quando há erros
- [ ] Muda de cor quando desabilitado
- [ ] Cursor `not-allowed` quando desabilitado
- [ ] Title explicativo quando desabilitado
- [ ] Não permite submit quando inválido

### UX
- [ ] Feedback visual para campos com erro
- [ ] Mensagens em português
- [ ] Linguagem amigável
- [ ] Nota sobre campos obrigatórios

---

## Notas Finais

### Segurança
- Sempre valide no backend também (nunca confie apenas no frontend)
- Sanitize inputs para prevenir XSS
- Use prepared statements para prevenir SQL Injection
- Valide tipos de arquivo no upload

### Performance
- Debounce validações em tempo real se necessário
- Não faça requisições de rede durante digitação
- Cache resultados de validação quando apropriado

### Acessibilidade
- Use atributos `aria-invalid` em campos com erro
- Use `aria-describedby` para associar mensagens de erro
- Garanta que labels estejam associados aos inputs (atributo `for`)
- Ordem de foco lógica (tab order)

---

## Referência Cruzada

### Outros Documentos Importantes

Para uma implementação completa de nova funcionalidade, consulte também:

📘 **`DEVELOPMENT_INSTRUCTIONS.md`** - Checklist completo incluindo:
- ✅ Configuração Firebase (firestore.rules, indexes, storage.rules)
- ✅ Sistema de Permissões (Permission.ts, App.tsx, AdminDashboard)
- ✅ Sistema de Logs e Auditoria
- ✅ Estrutura de arquivos
- ✅ Fluxo de trabalho completo

Este documento (`VALIDATION_INSTRUCTIONS.md`) foca especificamente na **validação de formulários**.
Para o processo completo de desenvolvimento, **sempre** siga o `DEVELOPMENT_INSTRUCTIONS.md`.

---

**Última Atualização**: 28/11/2025
**Responsável**: Sistema de Gerenciamento da Igreja
**Versão do Documento**: 1.1
