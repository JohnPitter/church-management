const fs = require('fs');

const fixes = [
  // AdminDevotionalPage
  {
    file: 'src/presentation/pages/AdminDevotionalPage.tsx',
    replacements: [
      { from: "../components/CreateDevotionalModal", to: "@modules/church-management/devotionals/presentation/components/CreateDevotionalModal" },
      { from: "../components/EditDevotionalModal", to: "@modules/church-management/devotionals/presentation/components/EditDevotionalModal" },
      { from: "../components/DevotionalDetailModal", to: "@modules/church-management/devotionals/presentation/components/DevotionalDetailModal" }
    ]
  },
  // AdminForumPage
  {
    file: 'src/presentation/pages/AdminForumPage.tsx',
    replacements: [
      { from: "../components/CreateForumCategoryModal", to: "@modules/content-management/forum/presentation/components/CreateForumCategoryModal" }
    ]
  },
  // AdminVisitorsPage
  {
    file: 'src/presentation/pages/AdminVisitorsPage.tsx',
    replacements: [
      { from: "../components/visitors/CreateVisitorModal", to: "@modules/church-management/visitors/presentation/components/visitors/CreateVisitorModal" },
      { from: "../components/visitors/VisitorDetailsModal", to: "@modules/church-management/visitors/presentation/components/visitors/VisitorDetailsModal" },
      { from: "../components/visitors/ContactVisitorModal", to: "@modules/church-management/visitors/presentation/components/visitors/ContactVisitorModal" },
      { from: "../components/visitors/RecordVisitModal", to: "@modules/church-management/visitors/presentation/components/visitors/RecordVisitModal" }
    ]
  },
  // AssistidosManagementPage
  {
    file: 'src/presentation/pages/AssistidosManagementPage.tsx',
    replacements: [
      { from: "../components/AssistidoModal", to: "@modules/assistance/assistidos/presentation/components/AssistidoModal" }
    ]
  },
  // MembersManagementPage
  {
    file: 'src/presentation/pages/MembersManagementPage.tsx',
    replacements: [
      { from: "../components/CreateMemberModal", to: "@modules/church-management/members/presentation/components/CreateMemberModal" }
    ]
  },
  // PainelPage
  {
    file: 'src/presentation/pages/PainelPage.tsx',
    replacements: [
      { from: "../components/EventsCalendar", to: "@modules/church-management/events/presentation/components/EventsCalendar" }
    ]
  },
  // PrayerRequests
  {
    file: 'src/presentation/pages/PrayerRequests.tsx',
    replacements: [
      { from: "../components/CreatePrayerRequestModal", to: "@modules/church-management/prayer-requests/presentation/components/CreatePrayerRequestModal" }
    ]
  },
  // VisitorsPage
  {
    file: 'src/presentation/pages/VisitorsPage.tsx',
    replacements: [
      { from: "../components/visitors/CreateVisitorModal", to: "@modules/church-management/visitors/presentation/components/visitors/CreateVisitorModal" },
      { from: "../components/visitors/VisitorDetailsModal", to: "@modules/church-management/visitors/presentation/components/visitors/VisitorDetailsModal" },
      { from: "../components/visitors/ContactVisitorModal", to: "@modules/church-management/visitors/presentation/components/visitors/ContactVisitorModal" },
      { from: "../components/visitors/RecordVisitModal", to: "@modules/church-management/visitors/presentation/components/visitors/RecordVisitModal" }
    ]
  }
];

let totalFixed = 0;

fixes.forEach(({file, replacements}) => {
  if (!fs.existsSync(file)) {
    console.log(`⏭️  Skipping (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let count = 0;

  replacements.forEach(({from, to}) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      count++;
    }
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed ${count} imports in: ${file}`);
    totalFixed += count;
  }
});

console.log(`\n📊 Fixed ${totalFixed} component imports`);
