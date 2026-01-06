const fs = require('fs');
const path = require('path');

// Mapeamento completo de imports antigos para novos
const importMappings = [
  // ========== DOMAIN ENTITIES ==========
  { old: /from ['"]([\.\/]*)domain\/entities\/Asset['"]/g, new: "from '@modules/church-management/assets/domain/entities/Asset'" },
  { old: /from ['"]([\.\/]*)domain\/entities\/Assistencia['"]/g, new: "from '@modules/assistance/assistencia/domain/entities/Assistencia'" },
  { old: /from ['"]([\.\/]*)domain\/entities\/Department['"]/g, new: "from '@modules/church-management/departments/domain/entities/Department'" },
  { old: /from ['"]([\.\/]*)domain\/entities\/Notification['"]/g, new: "from '@modules/shared-kernel/notifications/domain/entities/Notification'" },
  { old: /from ['"]([\.\/]*)domain\/entities\/PublicPageSettings['"]/g, new: "from '@modules/content-management/public-pages/domain/entities/PublicPageSettings'" },

  // ========== DOMAIN SERVICES ==========
  { old: /from ['"]([\.\/]*)domain\/services\/IAssistenciaService['"]/g, new: "from '@modules/assistance/assistencia/domain/services/IAssistenciaService'" },
  { old: /from ['"]([\.\/]*)domain\/services\/IAssistidoService['"]/g, new: "from '@modules/assistance/assistidos/domain/services/IAssistidoService'" },
  { old: /from ['"]([\.\/]*)domain\/services\/IAuditService['"]/g, new: "from '@modules/shared-kernel/audit/domain/services/IAuditService'" },
  { old: /from ['"]([\.\/]*)domain\/services\/IAuthService['"]/g, new: "from '@modules/user-management/auth/domain/services/IAuthService'" },
  { old: /from ['"]([\.\/]*)domain\/services\/INotificationService['"]/g, new: "from '@modules/shared-kernel/notifications/domain/services/INotificationService'" },

  // ========== DOMAIN REPOSITORIES ==========
  { old: /from ['"]([\.\/]*)domain\/repositories\/IAssistenciaRepository['"]/g, new: "from '@modules/assistance/assistencia/domain/repositories/IAssistenciaRepository'" },
  { old: /from ['"]([\.\/]*)domain\/repositories\/IAssistidoRepository['"]/g, new: "from '@modules/assistance/assistidos/domain/repositories/IAssistidoRepository'" },
  { old: /from ['"]([\.\/]*)domain\/repositories\/INotificationRepository['"]/g, new: "from '@modules/shared-kernel/notifications/domain/repositories/INotificationRepository'" },
  { old: /from ['"]([\.\/]*)domain\/repositories\/IProjectRepository['"]/g, new: "from '@modules/content-management/projects/domain/repositories/IProjectRepository'" },

  // ========== FIREBASE REPOSITORIES ==========
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseAgendamentoAssistenciaRepository['"]/g, new: "from '@modules/assistance/agendamento/infrastructure/repositories/FirebaseAgendamentoAssistenciaRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseAssistidoRepository['"]/g, new: "from '@modules/assistance/assistidos/infrastructure/repositories/FirebaseAssistidoRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseBlogRepository['"]/g, new: "from '@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseEventRepository['"]/g, new: "from '@modules/church-management/events/infrastructure/repositories/FirebaseEventRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseFichaAcompanhamentoRepository['"]/g, new: "from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseHelpRequestRepository['"]/g, new: "from '@modules/assistance/help-requests/infrastructure/repositories/FirebaseHelpRequestRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseHomeBuilderRepository['"]/g, new: "from '@modules/content-management/home-builder/infrastructure/repositories/FirebaseHomeBuilderRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseLiveStreamRepository['"]/g, new: "from '@modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseLogRepository['"]/g, new: "from '@modules/shared-kernel/logging/infrastructure/repositories/FirebaseLogRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseMemberRepository['"]/g, new: "from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseNotificationRepository['"]/g, new: "from '@modules/shared-kernel/notifications/infrastructure/repositories/FirebaseNotificationRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseONGRepository['"]/g, new: "from '@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebasePrayerRequestRepository['"]/g, new: "from '@modules/church-management/prayer-requests/infrastructure/repositories/FirebasePrayerRequestRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseProfissionalAssistenciaRepository['"]/g, new: "from '@modules/assistance/professional/infrastructure/repositories/FirebaseProfissionalAssistenciaRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseProjectRepository['"]/g, new: "from '@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository'" },
  { old: /from ['"]([\.\/]*)data\/repositories\/FirebaseUserRepository['"]/g, new: "from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository'" },

  // ========== SERVICES ==========
  { old: /from ['"]([\.\/]*)infrastructure\/services\/AnamnesesPsicologicaService['"]/g, new: "from '@modules/assistance/fichas/application/services/AnamnesesPsicologicaService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/AssetService['"]/g, new: "from '@modules/church-management/assets/application/services/AssetService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/AssistenciaService['"]/g, new: "from '@modules/assistance/assistencia/application/services/AssistenciaService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/AssistidoService['"]/g, new: "from '@modules/assistance/assistidos/application/services/AssistidoService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/BackupService['"]/g, new: "from '@modules/analytics/backup/application/services/BackupService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/ChurchFinancialService['"]/g, new: "from '@modules/financial/church-finance/application/services/ChurchFinancialService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/DailyVerseUpdateService['"]/g, new: "from '@modules/church-management/devotionals/application/services/DailyVerseUpdateService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/DataMigrationService['"]/g, new: "from '@modules/shared-kernel/migration/application/services/DataMigrationService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/DefaultFinancialCategories['"]/g, new: "from '@modules/financial/church-finance/application/services/DefaultFinancialCategories'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/DepartmentFinancialService['"]/g, new: "from '@modules/financial/department-finance/application/services/DepartmentFinancialService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/DevotionalService['"]/g, new: "from '@modules/church-management/devotionals/application/services/DevotionalService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/FichaAcompanhamentoService['"]/g, new: "from '@modules/assistance/fichas/application/services/FichaAcompanhamentoService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/FinancialService['"]/g, new: "from '@modules/financial/church-finance/application/services/FinancialService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/FirebaseAuditService['"]/g, new: "from '@modules/shared-kernel/audit/infrastructure/services/FirebaseAuditService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/FirebaseAuthService['"]/g, new: "from '@modules/user-management/users/application/services/FirebaseAuthService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/FirebaseNotificationService['"]/g, new: "from '@modules/shared-kernel/notifications/infrastructure/services/FirebaseNotificationService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/ForumService['"]/g, new: "from '@modules/content-management/forum/infrastructure/services/ForumService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/HelpRequestService['"]/g, new: "from '@modules/assistance/help-requests/application/services/HelpRequestService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/HomeBuilderService['"]/g, new: "from '@modules/content-management/home-builder/application/services/HomeBuilderService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/LoggingService['"]/g, new: "from '@modules/shared-kernel/logging/infrastructure/services/LoggingService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/LogSeederService['"]/g, new: "from '@modules/shared-kernel/logging/infrastructure/services/LogSeederService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/MemberService['"]/g, new: "from '@modules/church-management/members/application/services/MemberService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/NotificationService['"]/g, new: "from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/ONGFinancialService['"]/g, new: "from '@modules/financial/ong-finance/application/services/ONGFinancialService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/PermissionService['"]/g, new: "from '@modules/user-management/permissions/application/services/PermissionService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/PrayerRequestService['"]/g, new: "from '@modules/church-management/prayer-requests/application/services/PrayerRequestService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/ProfessionalHelpRequestService['"]/g, new: "from '@modules/assistance/professional/application/services/ProfessionalHelpRequestService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/ProjectsService['"]/g, new: "from '@modules/content-management/projects/application/services/ProjectsService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/PublicPageService['"]/g, new: "from '@modules/content-management/public-pages/application/services/PublicPageService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/ReportsService['"]/g, new: "from '@modules/ong-management/settings/application/services/ReportsService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/VerseOfTheDayService['"]/g, new: "from '@modules/church-management/devotionals/application/services/VerseOfTheDayService'" },
  { old: /from ['"]([\.\/]*)infrastructure\/services\/VisitorService['"]/g, new: "from '@modules/church-management/visitors/application/services/VisitorService'" },

  // ========== USE CASES ==========
  { old: /from ['"]([\.\/]*)domain\/usecases\/auth\/LoginUseCase['"]/g, new: "from '@modules/user-management/users/application/usecases/LoginUseCase'" },
  { old: /from ['"]([\.\/]*)domain\/usecases\/auth\/RegisterUseCase['"]/g, new: "from '@modules/user-management/users/application/usecases/RegisterUseCase'" },
  { old: /from ['"]([\.\/]*)domain\/usecases\/events\/ConfirmEventAttendanceUseCase['"]/g, new: "from '@modules/church-management/events/application/usecases/ConfirmEventAttendanceUseCase'" },
  { old: /from ['"]([\.\/]*)domain\/usecases\/events\/CreateEventUseCase['"]/g, new: "from '@modules/church-management/events/application/usecases/CreateEventUseCase'" },
  { old: /from ['"]([\.\/]*)domain\/usecases\/members\/CreateMemberUseCase['"]/g, new: "from '@modules/church-management/members/application/usecases/CreateMemberUseCase'" },
];

let totalUpdates = 0;
let filesUpdated = 0;

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  let fileUpdates = 0;

  importMappings.forEach(mapping => {
    const matches = content.match(mapping.old);
    if (matches) {
      content = content.replace(mapping.old, mapping.new);
      updated = true;
      fileUpdates += matches.length;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalUpdates += fileUpdates;
    filesUpdated++;
    console.log(`✅ Updated ${fileUpdates} import(s) in: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('build')) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFile(filePath);
    }
  });
}

console.log('🚀 Starting import updates...\n');
processDirectory('./src');
console.log(`\n✅ Import updates complete!`);
console.log(`📊 Total: ${totalUpdates} imports updated in ${filesUpdated} files`);
