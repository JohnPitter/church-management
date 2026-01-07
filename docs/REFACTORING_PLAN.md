# Plano de Refatoração - Reorganização de Estrutura

Este documento detalha o plano de reorganização do projeto para seguir corretamente a arquitetura modular baseada em DDD.

## Problema Identificado

O projeto atualmente tem **violações graves da arquitetura modular**:
- 32 serviços em `src/infrastructure/services/` que deveriam estar em módulos
- 16 repositórios em `src/data/repositories/` que deveriam estar em módulos
- 13 componentes duplicados entre root e módulos
- 4 diretórios vazios sem implementação
- Múltiplos arquivos em `src/domain/` que deveriam estar em módulos

## Estratégia de Refatoração

### Fase 1: Limpeza Inicial (Baixo Risco)
✅ **Ação Imediata - Pode ser feita agora**

1. **Remover diretórios vazios**
   ```bash
   rm -rf src/modules/analytics/dashboard
   rm -rf src/modules/ong-management/activities
   rm -rf src/modules/ong-management/reports
   rm -rf src/modules/ong-management/volunteers
   rm -rf config
   ```

2. **Remover componentes duplicados em src/presentation/components/**
   - CreateMemberModal.tsx (existe em members module)
   - CreateDevotionalModal.tsx (existe em devotionals module)
   - EditDevotionalModal.tsx (existe em devotionals module)
   - DevotionalDetailModal.tsx (existe em devotionals module)
   - AssistidoModal.tsx (existe em assistidos module)
   - CreatePrayerRequestModal.tsx (existe em prayer-requests module)
   - EventsCalendar.tsx (existe em events module)
   - CreateForumCategoryModal.tsx (existe em forum module)
   - SolicitarAjudaModal.tsx (existe em help-requests module)
   - Pasta `src/presentation/components/visitors/` inteira (existe em visitors module)

### Fase 2: Criação de Estrutura de Módulos Faltantes (Médio Risco)
⚠️ **Requer atenção - Criação de novas pastas**

Criar estrutura completa para módulos incompletos:

```bash
# Church Management
mkdir -p src/modules/church-management/assets/{domain/entities,application/services,infrastructure/repositories}
mkdir -p src/modules/church-management/departments/{domain/entities,application/services}
mkdir -p src/modules/church-management/events/{application/usecases,infrastructure/repositories}
mkdir -p src/modules/church-management/visitors/application/services

# Content Management
mkdir -p src/modules/content-management/blog/application/services
mkdir -p src/modules/content-management/live-streaming/application/services
mkdir -p src/modules/content-management/projects/{application/services,infrastructure/repositories}
mkdir -p src/modules/content-management/public-pages/{domain/entities,application/services}

# Financial
mkdir -p src/modules/financial/department-finance/domain/entities

# Assistance
mkdir -p src/modules/assistance/assistencia/{domain/entities,application/services}
mkdir -p src/modules/assistance/agendamento/{domain/entities,infrastructure/repositories}

# Shared Kernel
mkdir -p src/modules/shared-kernel/notifications/{domain/entities,application/services,infrastructure/repositories}
mkdir -p src/modules/shared-kernel/audit/{domain/services,infrastructure/services}
mkdir -p src/modules/shared-kernel/logging/{infrastructure/repositories,infrastructure/services}
mkdir -p src/modules/shared-kernel/migration/application/services

# User Management
mkdir -p src/modules/user-management/auth/{domain/services,application/usecases}
```

### Fase 3: Mover Entidades de Domínio (Médio Risco)
⚠️ **Requer atenção - Movimentação de arquivos core**

```bash
# Mover entidades que não são re-exports
mv src/domain/entities/Asset.ts src/modules/church-management/assets/domain/entities/
mv src/domain/entities/Assistencia.ts src/modules/assistance/assistencia/domain/entities/
mv src/domain/entities/Department.ts src/modules/church-management/departments/domain/entities/
mv src/domain/entities/Notification.ts src/modules/shared-kernel/notifications/domain/entities/
mv src/domain/entities/PublicPageSettings.ts src/modules/content-management/public-pages/domain/entities/

# Mover interfaces de serviço de domínio
mv src/domain/services/IAssistenciaService.ts src/modules/assistance/assistencia/domain/services/
mv src/domain/services/IAssistidoService.ts src/modules/assistance/assistidos/domain/services/
mv src/domain/services/IAuditService.ts src/modules/shared-kernel/audit/domain/services/
mv src/domain/services/IAuthService.ts src/modules/user-management/auth/domain/services/
mv src/domain/services/INotificationService.ts src/modules/shared-kernel/notifications/domain/services/

# Mover repositórios de domínio
mv src/domain/repositories/IAssistenciaRepository.ts src/modules/assistance/assistencia/domain/repositories/
mv src/domain/repositories/IAssistidoRepository.ts src/modules/assistance/assistidos/domain/repositories/
mv src/domain/repositories/INotificationRepository.ts src/modules/shared-kernel/notifications/domain/repositories/
mv src/domain/repositories/IProjectRepository.ts src/modules/content-management/projects/domain/repositories/
```

### Fase 4: Mover Repositórios Firebase (Alto Risco)
🔴 **ALTO RISCO - Muitos imports para atualizar**

Mover todos os repositórios de `src/data/repositories/` para os módulos correspondentes:

| Arquivo | Destino |
|---------|---------|
| FirebaseAgendamentoAssistenciaRepository.ts | src/modules/assistance/agendamento/infrastructure/repositories/ |
| FirebaseAssistidoRepository.ts | src/modules/assistance/assistidos/infrastructure/repositories/ |
| FirebaseBlogRepository.ts | src/modules/content-management/blog/infrastructure/repositories/ |
| FirebaseEventRepository.ts | src/modules/church-management/events/infrastructure/repositories/ |
| FirebaseFichaAcompanhamentoRepository.ts | src/modules/assistance/fichas/infrastructure/repositories/ |
| FirebaseHelpRequestRepository.ts | src/modules/assistance/help-requests/infrastructure/repositories/ |
| FirebaseHomeBuilderRepository.ts | src/modules/content-management/home-builder/infrastructure/repositories/ |
| FirebaseLiveStreamRepository.ts | src/modules/content-management/live-streaming/infrastructure/repositories/ |
| FirebaseLogRepository.ts | src/modules/shared-kernel/logging/infrastructure/repositories/ |
| FirebaseMemberRepository.ts | src/modules/church-management/members/infrastructure/repositories/ |
| FirebaseNotificationRepository.ts | src/modules/shared-kernel/notifications/infrastructure/repositories/ |
| FirebaseONGRepository.ts | src/modules/ong-management/settings/infrastructure/repositories/ |
| FirebasePrayerRequestRepository.ts | src/modules/church-management/prayer-requests/infrastructure/repositories/ |
| FirebaseProfissionalAssistenciaRepository.ts | src/modules/assistance/professional/infrastructure/repositories/ |
| FirebaseProjectRepository.ts | src/modules/content-management/projects/infrastructure/repositories/ |
| FirebaseUserRepository.ts | src/modules/user-management/users/infrastructure/repositories/ |

### Fase 5: Mover Serviços (Alto Risco)
🔴 **ALTO RISCO - Muitos imports para atualizar**

Mover todos os serviços de `src/infrastructure/services/` para os módulos correspondentes conforme tabela na análise.

### Fase 6: Mover Use Cases (Médio Risco)
⚠️ **Requer atenção**

```bash
mv src/domain/usecases/auth/LoginUseCase.ts src/modules/user-management/users/application/usecases/
mv src/domain/usecases/auth/RegisterUseCase.ts src/modules/user-management/users/application/usecases/
mv src/domain/usecases/events/* src/modules/church-management/events/application/usecases/
mv src/domain/usecases/members/* src/modules/church-management/members/application/usecases/
```

### Fase 7: Atualizar Todos os Imports (CRÍTICO)
🔴 **CRÍTICO - Pode quebrar a aplicação**

Esta é a fase mais complexa e arriscada. Requer:

1. **Encontrar todos os arquivos que importam os arquivos movidos**
2. **Atualizar cada import** para o novo caminho
3. **Testar após cada mudança**

**Ferramentas sugeridas:**
- Usar find e grep para localizar imports
- Usar sed ou script Node.js para substituição em massa
- Executar `npm run typecheck` após cada lote de mudanças
- Executar `npm run build` para verificar

### Fase 8: Limpar Estrutura Antiga (Baixo Risco)
✅ **Depois de todos os imports atualizados**

```bash
# Remover diretórios vazios
rm -rf src/data/repositories  # Se todos os arquivos foram movidos
rm -rf src/domain/repositories  # Se todos foram movidos/convertidos em re-exports
rm -rf src/domain/services  # Se todos foram movidos
rm -rf src/domain/usecases  # Se todos foram movidos
rm -rf src/infrastructure/services  # Se todos foram movidos
```

## Recomendação

### Opção A: Refatoração Completa (Recomendado para projeto em desenvolvimento)
Executar todas as 8 fases, mas fazer em **pequenos commits incrementais**:
- Cada fase = 1 commit
- Testar build após cada commit
- Se algo quebrar, fazer revert do último commit

### Opção B: Refatoração Gradual (Recomendado para projeto em produção)
Executar apenas **Fase 1** agora (limpeza inicial - baixo risco):
- Remover diretórios vazios
- Remover componentes duplicados
- Commits: "Clean up empty directories and duplicate components"

Deixar as fases 2-8 para serem feitas **módulo por módulo** ao longo do tempo:
- Priorizar módulos mais usados primeiro
- Fazer 1 módulo por sprint
- Manter compatibilidade com imports antigos via re-exports

### Opção C: Apenas Documentação (Menos recomendado)
Apenas documentar no IMPROVEMENT_PLAN.md e deixar para refatorar depois.

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar builds | Alta | Alto | Testar após cada mudança, commits pequenos |
| Quebrar testes | Média | Médio | Executar testes após cada fase |
| Imports quebrados | Alta | Alto | Usar ferramenta automatizada para busca/substituição |
| Perder código | Baixa | Crítico | Git permite recuperar, fazer backup antes |
| Conflitos de merge | Média | Médio | Comunicar time, fazer em branch separada |

## Estimativa de Esforço

- **Fase 1 (Limpeza)**: 15 minutos
- **Fase 2 (Estrutura)**: 30 minutos
- **Fase 3 (Entidades)**: 1 hora
- **Fase 4 (Repositórios)**: 2-3 horas
- **Fase 5 (Serviços)**: 3-4 horas
- **Fase 6 (Use Cases)**: 1 hora
- **Fase 7 (Imports)**: 4-6 horas ⚠️ **MAIS DEMORADO**
- **Fase 8 (Cleanup)**: 30 minutos

**Total estimado**: 12-16 horas de trabalho

## Decisão Necessária

**Qual opção você prefere?**
- [ ] **Opção A** - Refatoração completa agora (12-16h, alto risco, alta recompensa)
- [ ] **Opção B** - Apenas Fase 1 agora + gradual depois (15min agora, baixo risco)
- [ ] **Opção C** - Apenas documentar para depois

**Recomendação do Claude Code**: **Opção B** - Executar Fase 1 agora para limpar o que é seguro, e planejar as outras fases gradualmente conforme o time tiver disponibilidade.
