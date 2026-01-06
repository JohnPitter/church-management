#!/bin/bash

# Script to restore service files from git and fix their imports

# List of service files to restore (path in original commit -> new path)
declare -A SERVICE_FILES=(
  # Most critical services
  ["src/modules/church-management/devotionals/application/services/DevotionalService.ts"]="src/modules/church-management/devotionals/application/services/DevotionalService.ts"
  ["src/modules/financial/church-finance/application/services/FinancialService.ts"]="src/modules/financial/church-finance/application/services/FinancialService.ts"
  ["src/modules/financial/church-finance/application/services/ChurchFinancialService.ts"]="src/modules/financial/church-finance/application/services/ChurchFinancialService.ts"
  ["src/modules/content-management/forum/infrastructure/services/ForumService.ts"]="src/modules/content-management/forum/infrastructure/services/ForumService.ts"
  ["src/modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository.ts"]="src/modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository.ts"
  ["src/modules/financial/department-finance/application/services/DepartmentFinancialService.ts"]="src/modules/financial/department-finance/application/services/DepartmentFinancialService.ts"
  ["src/modules/financial/ong-finance/application/services/ONGFinancialService.ts"]="src/modules/financial/ong-finance/application/services/ONGFinancialService.ts"
  ["src/modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository.ts"]="src/modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository.ts"
  ["src/modules/church-management/prayer-requests/application/services/PrayerRequestService.ts"]="src/modules/church-management/prayer-requests/application/services/PrayerRequestService.ts"
  ["src/modules/assistance/assistidos/application/services/AssistidoService.ts"]="src/modules/assistance/assistidos/application/services/AssistidoService.ts"
  ["src/modules/analytics/backup/application/services/BackupService.ts"]="src/modules/analytics/backup/application/services/BackupService.ts"
  ["src/modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository.ts"]="src/modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository.ts"
  ["src/modules/content-management/home-builder/application/services/HomeBuilderService.ts"]="src/modules/content-management/home-builder/application/services/HomeBuilderService.ts"
  ["src/modules/church-management/members/application/services/MemberService.ts"]="src/modules/church-management/members/application/services/MemberService.ts"
  ["src/modules/assistance/professional/application/services/ProfessionalHelpRequestService.ts"]="src/modules/assistance/professional/application/services/ProfessionalHelpRequestService.ts"
  ["src/modules/financial/church-finance/application/services/DefaultFinancialCategories.ts"]="src/modules/financial/church-finance/application/services/DefaultFinancialCategories.ts"
)

COMMIT="1e3d151"

for orig_path in "${!SERVICE_FILES[@]}"; do
  new_path="${SERVICE_FILES[$orig_path]}"

  echo "Restoring: $new_path"

  # Check if file exists in git
  if git show "$COMMIT:$orig_path" > /dev/null 2>&1; then
    # Restore the file
    git show "$COMMIT:$orig_path" > "$new_path"
    echo "  ✓ Restored from git"
  else
    echo "  ✗ File not found in git: $orig_path"
  fi
done

echo ""
echo "Now running import fixer script..."
node scripts/fix-service-imports.js
