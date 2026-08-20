import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/common/PageShell';
import { useAuth } from '../contexts/AuthContext';
import {
  ClassSessionRecord,
  DIFFICULTY_LABELS,
  FEEDBACK_KIND_LABELS,
  FeedbackKind,
  GuidelineApplication,
  GuidelinePeriodType,
  GuidelineStatus,
  PedagogicalFeedback,
  PedagogicalGuideline,
  StudentDifficultyRecord,
  SupportMaterial,
  SupportMaterialType
} from '@modules/pedagogy/domain/entities/Pedagogy';
import { PedagogyDashboardStats, pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { UserRole } from '@/domain/entities/User';

type TabId = 'painel' | 'diretrizes' | 'encontros' | 'dificuldades' | 'aplicacao' | 'feedback' | 'relatorios';

const emptyMaterial = (): SupportMaterial => ({
  type: SupportMaterialType.Link,
  title: '',
  url: ''
});

const PedagogyManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<TabId>('painel');
  const [loading, setLoading] = useState(true);
  const [guidelines, setGuidelines] = useState<PedagogicalGuideline[]>([]);
  const [sessions, setSessions] = useState<ClassSessionRecord[]>([]);
  const [difficulties, setDifficulties] = useState<StudentDifficultyRecord[]>([]);
  const [applications, setApplications] = useState<GuidelineApplication[]>([]);
  const [feedback, setFeedback] = useState<PedagogicalFeedback[]>([]);
  const [stats, setStats] = useState<PedagogyDashboardStats | null>(null);
  const [educators, setEducators] = useState<Array<{ id: string; name: string }>>([]);

  const [guidelineForm, setGuidelineForm] = useState({
    title: '',
    content: '',
    periodType: GuidelinePeriodType.Semester,
    validFrom: '',
    validUntil: '',
    year: new Date().getFullYear(),
    semester: 1 as 1 | 2,
    classGroup: '',
    area: '',
    status: GuidelineStatus.Published,
    materials: [emptyMaterial()]
  });

  const [feedbackForm, setFeedbackForm] = useState({
    toEducatorId: '',
    isCollective: false,
    kind: FeedbackKind.Feedback,
    message: '',
    materialTitle: '',
    materialUrl: ''
  });

  const userRepository = useMemo(() => new FirebaseUserRepository(), []);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const users = await userRepository.findByRole('educator' as UserRole).catch(() => []);
      const educatorList = users.map(user => ({ id: user.id, name: user.displayName }));
      setEducators(educatorList);
      const [guideList, sessionList, difficultyList, applicationList, feedbackList, dashboard] = await Promise.all([
        pedagogyService.listGuidelines(),
        pedagogyService.listSessions(),
        pedagogyService.listDifficulties(),
        pedagogyService.listApplications(),
        pedagogyService.listAllFeedback(),
        pedagogyService.getDashboardStats(educatorList.map(item => item.id))
      ]);
      setGuidelines(guideList);
      setSessions(sessionList);
      setDifficulties(difficultyList);
      setApplications(applicationList);
      setFeedback(feedbackList);
      setStats(dashboard);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar a coordenação pedagógica');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuideline = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      await pedagogyService.createGuideline({
        title: guidelineForm.title,
        content: guidelineForm.content,
        periodType: guidelineForm.periodType,
        validFrom: new Date(guidelineForm.validFrom),
        validUntil: new Date(guidelineForm.validUntil),
        year: guidelineForm.year,
        semester: guidelineForm.semester,
        classGroup: guidelineForm.classGroup || undefined,
        area: guidelineForm.area || undefined,
        supportMaterials: guidelineForm.materials.filter(item => item.url.trim()),
        status: guidelineForm.status,
        createdBy: currentUser.id,
        createdByName: currentUser.displayName
      });
      toast.success('Diretriz publicada');
      setGuidelineForm({
        ...guidelineForm,
        title: '',
        content: '',
        classGroup: '',
        area: '',
        materials: [emptyMaterial()]
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar diretriz');
    }
  };

  const handleSendFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      const educator = educators.find(item => item.id === feedbackForm.toEducatorId);
      await pedagogyService.createFeedback({
        fromUserId: currentUser.id,
        fromUserName: currentUser.displayName,
        toEducatorId: feedbackForm.isCollective ? undefined : feedbackForm.toEducatorId,
        toEducatorName: feedbackForm.isCollective ? undefined : educator?.name,
        isCollective: feedbackForm.isCollective,
        kind: feedbackForm.kind,
        message: feedbackForm.message,
        materials: feedbackForm.materialUrl
          ? [{ type: SupportMaterialType.Link, title: feedbackForm.materialTitle || 'Material', url: feedbackForm.materialUrl }]
          : []
      });
      toast.success('Orientação enviada');
      setFeedbackForm({
        toEducatorId: '',
        isCollective: false,
        kind: FeedbackKind.Feedback,
        message: '',
        materialTitle: '',
        materialUrl: ''
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar feedback');
    }
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'painel', label: 'Painel' },
    { id: 'diretrizes', label: 'Diretrizes' },
    { id: 'encontros', label: 'Encontros' },
    { id: 'dificuldades', label: 'Dificuldades' },
    { id: 'aplicacao', label: 'Aplicação' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'relatorios', label: 'Relatórios' }
  ];

  const topDifficulties = pedagogyService.getTopDifficulties(difficulties);

  const fieldClass = 'w-full min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500';

  return (
    <PageShell
      title="Coordenação Pedagógica"
      subtitle="Organize, acompanhe e oriente as ações dos arte-educadores"
    >
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex">
            {tabs.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-3 px-4 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap ${
                  tab === item.id
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
      {loading && <p className="text-gray-600">Carregando registros pedagógicos...</p>}

      {!loading && tab === 'painel' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Alunos atendidos" value={String(stats.studentsServed)} />
          <StatCard label="Frequência média" value={`${stats.averageAttendance}%`} />
          <StatCard label="Engajamento médio" value={`${stats.averageEngagement}%`} />
          <StatCard label="Alunos com maior acompanhamento" value={String(stats.studentsNeedingFollowup)} />
          <StatCard label="Arte-educadores com registros pendentes" value={String(stats.educatorsWithPendingRecords)} />
          <StatCard label="Diretriz vigente" value={stats.activeGuidelineTitle} />
          <StatCard
            label="Último relatório"
            value={stats.lastApplicationDate ? stats.lastApplicationDate.toLocaleDateString('pt-BR') : '—'}
          />
        </div>
      )}

      {!loading && tab === 'diretrizes' && (
        <div className="space-y-8">
          <form onSubmit={handleCreateGuideline} className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Nova diretriz pedagógica</h3>
            <Field label="Título">
              <input
                className={fieldClass}
                placeholder="Ex.: Diretrizes do 2º semestre"
                value={guidelineForm.title}
                onChange={event => setGuidelineForm({ ...guidelineForm, title: event.target.value })}
              />
            </Field>
            <Field label="Orientações, objetivos, metodologias, temas e prioridades">
              <textarea
                className={`${fieldClass} min-h-[140px]`}
                placeholder="Descreva as orientações que devem nortear as atividades dos arte-educadores"
                value={guidelineForm.content}
                onChange={event => setGuidelineForm({ ...guidelineForm, content: event.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Período">
                <select
                  className={fieldClass}
                  value={guidelineForm.periodType}
                  onChange={event => setGuidelineForm({ ...guidelineForm, periodType: event.target.value as GuidelinePeriodType })}
                >
                  <option value={GuidelinePeriodType.Semester}>Semestre</option>
                  <option value={GuidelinePeriodType.Year}>Ano</option>
                  <option value={GuidelinePeriodType.Custom}>Personalizado</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={fieldClass}
                  value={guidelineForm.status}
                  onChange={event => setGuidelineForm({ ...guidelineForm, status: event.target.value as GuidelineStatus })}
                >
                  <option value={GuidelineStatus.Published}>Publicada</option>
                  <option value={GuidelineStatus.Draft}>Rascunho</option>
                  <option value={GuidelineStatus.Archived}>Arquivada</option>
                </select>
              </Field>
              <Field label="Início da vigência">
                <input
                  type="date"
                  className={fieldClass}
                  value={guidelineForm.validFrom}
                  onChange={event => setGuidelineForm({ ...guidelineForm, validFrom: event.target.value })}
                />
              </Field>
              <Field label="Fim da vigência">
                <input
                  type="date"
                  className={fieldClass}
                  value={guidelineForm.validUntil}
                  onChange={event => setGuidelineForm({ ...guidelineForm, validUntil: event.target.value })}
                />
              </Field>
              <Field label="Turma (opcional)">
                <input
                  className={fieldClass}
                  placeholder="Turma ou grupo"
                  value={guidelineForm.classGroup}
                  onChange={event => setGuidelineForm({ ...guidelineForm, classGroup: event.target.value })}
                />
              </Field>
              <Field label="Área de atuação (opcional)">
                <input
                  className={fieldClass}
                  placeholder="Música, teatro, artes visuais..."
                  value={guidelineForm.area}
                  onChange={event => setGuidelineForm({ ...guidelineForm, area: event.target.value })}
                />
              </Field>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Materiais de apoio</h4>
              {guidelineForm.materials.map((material, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Tipo">
                    <select
                      className={fieldClass}
                      value={material.type}
                      onChange={event => {
                        const materials = [...guidelineForm.materials];
                        materials[index] = { ...material, type: event.target.value as SupportMaterialType };
                        setGuidelineForm({ ...guidelineForm, materials });
                      }}
                    >
                      <option value={SupportMaterialType.Link}>Link</option>
                      <option value={SupportMaterialType.Image}>Imagem</option>
                      <option value={SupportMaterialType.Video}>Vídeo</option>
                    </select>
                  </Field>
                  <Field label="Título do material">
                    <input
                      className={fieldClass}
                      placeholder="Nome para exibição"
                      value={material.title}
                      onChange={event => {
                        const materials = [...guidelineForm.materials];
                        materials[index] = { ...material, title: event.target.value };
                        setGuidelineForm({ ...guidelineForm, materials });
                      }}
                    />
                  </Field>
                  <Field label="URL">
                    <input
                      className={fieldClass}
                      placeholder="https://"
                      value={material.url}
                      onChange={event => {
                        const materials = [...guidelineForm.materials];
                        materials[index] = { ...material, url: event.target.value };
                        setGuidelineForm({ ...guidelineForm, materials });
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 text-left"
                onClick={() => setGuidelineForm({ ...guidelineForm, materials: [...guidelineForm.materials, emptyMaterial()] })}
              >
                + Adicionar material de apoio
              </button>
              <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Publicar diretriz
              </button>
            </div>
          </form>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diretrizes publicadas</h3>
            {guidelines.length === 0 && (
              <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md px-4 py-8 text-center">
                Nenhuma diretriz cadastrada ainda.
              </p>
            )}
            <div className="space-y-4">
              {guidelines.map(item => (
                <article key={item.id} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.status} · {item.validFrom.toLocaleDateString('pt-BR')} até {item.validUntil.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-700 flex-shrink-0"
                      onClick={async () => {
                        await pedagogyService.deleteGuideline(item.id);
                        toast.success('Diretriz removida');
                        await loadData();
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{item.content}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {!loading && tab === 'encontros' && (
        <RecordsTable
          headers={['Data', 'Arte-educador', 'Turma', 'Presentes', 'Engajados', 'Baixo engajamento']}
          rows={sessions.map(item => [
            item.sessionDate.toLocaleDateString('pt-BR'),
            item.educatorName,
            item.classGroup,
            `${item.presentCount}/${item.totalStudents}`,
            String(item.engagedCount),
            String(item.lowEngagementCount)
          ])}
        />
      )}

      {!loading && tab === 'dificuldades' && (
        <div className="space-y-4">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
            Estes registros são instrumento de acompanhamento pedagógico, não diagnóstico do aluno.
          </p>
          {difficulties.map(item => (
            <article key={item.id} className="border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold">{item.studentName}</h4>
              <p className="text-xs text-gray-500">{item.educatorName} · {item.createdAt.toLocaleDateString('pt-BR')}</p>
              <p className="text-sm mt-2">
                {item.difficulties.map(type => DIFFICULTY_LABELS[type]).join(', ')}
                {item.otherDifficulty ? ` (${item.otherDifficulty})` : ''}
              </p>
              <p className="text-sm text-gray-700 mt-2">{item.description}</p>
            </article>
          ))}
        </div>
      )}

      {!loading && tab === 'aplicacao' && (
        <div className="space-y-4">
          {applications.map(item => (
            <article key={item.id} className="border border-gray-200 rounded-lg p-5 space-y-2">
              <h4 className="font-semibold">{item.guidelineTitle} · {String(item.month).padStart(2, '0')}/{item.year}</h4>
              <p className="text-xs text-gray-500">{item.educatorName}</p>
              <p><strong>Dificuldades:</strong> {item.applicationDifficulties || '—'}</p>
              <p><strong>Relato:</strong> {item.applicationNarrative}</p>
              <p><strong>Estratégias:</strong> {item.strategies || '—'}</p>
              <p><strong>Resultados:</strong> {item.observedResults || '—'}</p>
            </article>
          ))}
        </div>
      )}

      {!loading && tab === 'feedback' && (
        <div className="space-y-8">
          <form onSubmit={handleSendFeedback} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Enviar orientação</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={feedbackForm.isCollective}
                onChange={event => setFeedbackForm({ ...feedbackForm, isCollective: event.target.checked })}
              />
              Feedback coletivo
            </label>
            {!feedbackForm.isCollective && (
              <select
                className="w-full border rounded px-3 py-2"
                value={feedbackForm.toEducatorId}
                onChange={event => setFeedbackForm({ ...feedbackForm, toEducatorId: event.target.value })}
              >
                <option value="">Selecione o arte-educador</option>
                {educators.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
            <select
              className="w-full border rounded px-3 py-2"
              value={feedbackForm.kind}
              onChange={event => setFeedbackForm({ ...feedbackForm, kind: event.target.value as FeedbackKind })}
            >
              {Object.values(FeedbackKind).map(kind => (
                <option key={kind} value={kind}>{FEEDBACK_KIND_LABELS[kind]}</option>
              ))}
            </select>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[120px]"
              placeholder="Mensagem, orientação ou encaminhamento"
              value={feedbackForm.message}
              onChange={event => setFeedbackForm({ ...feedbackForm, message: event.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Título do material (opcional)"
              value={feedbackForm.materialTitle}
              onChange={event => setFeedbackForm({ ...feedbackForm, materialTitle: event.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Link de material ou estratégia"
              value={feedbackForm.materialUrl}
              onChange={event => setFeedbackForm({ ...feedbackForm, materialUrl: event.target.value })}
            />
            <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Enviar
            </button>
          </form>
          <div className="space-y-4">
            {feedback.map(item => (
              <article key={item.id} className="border border-gray-200 rounded-lg p-5">
                <p className="text-xs text-gray-500">
                  {FEEDBACK_KIND_LABELS[item.kind]} · {item.isCollective ? 'Coletivo' : item.toEducatorName} · {item.createdAt.toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm mt-2 whitespace-pre-wrap">{item.message}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'relatorios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Principais dificuldades identificadas</h3>
            <ul className="space-y-2 text-sm">
              {topDifficulties.map(item => (
                <li key={item.type} className="flex justify-between">
                  <span>{DIFFICULTY_LABELS[item.type as keyof typeof DIFFICULTY_LABELS] || item.type}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
              {topDifficulties.length === 0 && <li>Nenhum registro ainda.</li>}
            </ul>
          </article>
          <article className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Aplicação das diretrizes</h3>
            <p className="text-sm text-gray-700">
              {applications.length} relatos mensais registrados. Use o painel para identificar arte-educadores
              sem registros e alunos com dificuldades recorrentes.
            </p>
          </article>
        </div>
      )}
        </div>
      </div>
    </PageShell>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block min-w-0">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-semibold text-gray-900 mt-2 break-words">{value}</p>
  </div>
);

const RecordsTable: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => (
  <div className="border border-gray-200 rounded-lg overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-gray-50 text-left">
          {headers.map(header => (
            <th key={header} className="px-4 py-3 font-medium text-gray-700">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-t">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-4 py-3">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length === 0 && <p className="px-4 py-6 text-gray-500">Nenhum registro encontrado.</p>}
  </div>
);

export default PedagogyManagementPage;
