import React, { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/common/PageShell';
import PedagogyOrgSwitch from '../components/PedagogyOrgSwitch';
import PedagogyAttendancePanel from '../components/PedagogyAttendancePanel';
import { useAuth } from '../contexts/AuthContext';
import { pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';
import {
  ClassAttendanceRoll,
  ClassSessionRecord,
  DIFFICULTY_LABELS,
  FEEDBACK_KIND_LABELS,
  GuidelineApplication,
  PEDAGOGY_ORGANIZATION_LABELS,
  PedagogicalFeedback,
  PedagogicalGuideline,
  PedagogyEntity,
  PedagogyOrganization,
  StudentDifficultyRecord,
  StudentDifficultyType
} from '@modules/pedagogy/domain/entities/Pedagogy';

type TabId = 'diretrizes' | 'encontros' | 'chamada' | 'dificuldades' | 'aplicacao' | 'feedback';

const EducatorPedagogyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [organization, setOrganization] = useState(PedagogyOrganization.Church);
  const [tab, setTab] = useState<TabId>('diretrizes');
  const [loading, setLoading] = useState(true);
  const [guidelines, setGuidelines] = useState<PedagogicalGuideline[]>([]);
  const [sessions, setSessions] = useState<ClassSessionRecord[]>([]);
  const [attendanceRolls, setAttendanceRolls] = useState<ClassAttendanceRoll[]>([]);
  const [difficulties, setDifficulties] = useState<StudentDifficultyRecord[]>([]);
  const [applications, setApplications] = useState<GuidelineApplication[]>([]);
  const [feedback, setFeedback] = useState<PedagogicalFeedback[]>([]);

  const [sessionForm, setSessionForm] = useState({
    classGroup: '',
    area: '',
    sessionDate: '',
    totalStudents: '',
    presentCount: '',
    engagedCount: '',
    lowEngagementCount: '',
    notes: ''
  });

  const [difficultyForm, setDifficultyForm] = useState({
    studentName: '',
    classGroup: '',
    difficulties: [] as StudentDifficultyType[],
    otherDifficulty: '',
    description: ''
  });

  const [applicationForm, setApplicationForm] = useState({
    guidelineId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    applicationDifficulties: '',
    applicationNarrative: '',
    strategies: '',
    observedResults: ''
  });

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, organization]);

  const loadData = async () => {
    if (!currentUser?.id) {
      return;
    }
    setLoading(true);
    try {
      const [guideList, sessionList, attendanceList, difficultyList, applicationList, feedbackList] = await Promise.all([
        pedagogyService.listActiveGuidelines(new Date(), organization),
        pedagogyService.listSessions(currentUser.id, organization),
        pedagogyService.listAttendanceRolls(currentUser.id, organization),
        pedagogyService.listDifficulties(currentUser.id, organization),
        pedagogyService.listApplications(currentUser.id, organization),
        pedagogyService.listFeedbackForEducator(currentUser.id, organization)
      ]);
      setGuidelines(guideList);
      setSessions(sessionList);
      setAttendanceRolls(attendanceList || []);
      setDifficulties(difficultyList);
      setApplications(applicationList);
      setFeedback(feedbackList);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar sua área pedagógica');
    } finally {
      setLoading(false);
    }
  };

  const handleSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      await pedagogyService.createSession({
        organization,
        educatorId: currentUser.id,
        educatorName: currentUser.displayName,
        classGroup: sessionForm.classGroup,
        area: sessionForm.area || undefined,
        sessionDate: new Date(sessionForm.sessionDate),
        totalStudents: Number(sessionForm.totalStudents),
        presentCount: Number(sessionForm.presentCount),
        engagedCount: Number(sessionForm.engagedCount),
        lowEngagementCount: Number(sessionForm.lowEngagementCount),
        notes: sessionForm.notes || undefined
      });
      toast.success('Encontro registrado');
      setSessionForm({
        classGroup: '',
        area: '',
        sessionDate: '',
        totalStudents: '',
        presentCount: '',
        engagedCount: '',
        lowEngagementCount: '',
        notes: ''
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar encontro');
    }
  };

  const handleDifficulty = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      await pedagogyService.createDifficulty({
        organization,
        educatorId: currentUser.id,
        educatorName: currentUser.displayName,
        studentName: difficultyForm.studentName,
        classGroup: difficultyForm.classGroup || undefined,
        difficulties: difficultyForm.difficulties,
        otherDifficulty: difficultyForm.otherDifficulty || undefined,
        description: difficultyForm.description
      });
      toast.success('Dificuldade registrada para acompanhamento pedagógico');
      setDifficultyForm({
        studentName: '',
        classGroup: '',
        difficulties: [],
        otherDifficulty: '',
        description: ''
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar dificuldade');
    }
  };

  const handleApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    const guideline = guidelines.find(item => item.id === applicationForm.guidelineId)
      || (await pedagogyService.listGuidelines(organization)).find(item => item.id === applicationForm.guidelineId);
    try {
      await pedagogyService.createApplication({
        organization,
        educatorId: currentUser.id,
        educatorName: currentUser.displayName,
        guidelineId: applicationForm.guidelineId,
        guidelineTitle: guideline?.title || 'Diretriz',
        month: Number(applicationForm.month),
        year: Number(applicationForm.year),
        applicationDifficulties: applicationForm.applicationDifficulties,
        applicationNarrative: applicationForm.applicationNarrative,
        strategies: applicationForm.strategies,
        observedResults: applicationForm.observedResults
      });
      toast.success('Aplicação da diretriz registrada');
      setApplicationForm({
        ...applicationForm,
        applicationDifficulties: '',
        applicationNarrative: '',
        strategies: '',
        observedResults: ''
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar aplicação');
    }
  };

  const toggleDifficulty = (type: StudentDifficultyType) => {
    setDifficultyForm(current => ({
      ...current,
      difficulties: current.difficulties.includes(type)
        ? current.difficulties.filter(item => item !== type)
        : [...current.difficulties, type]
    }));
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'diretrizes', label: 'Diretrizes' },
    { id: 'encontros', label: 'Frequência e engajamento' },
    { id: 'chamada', label: 'Chamada' },
    { id: 'dificuldades', label: 'Dificuldades' },
    { id: 'aplicacao', label: 'Aplicação da diretriz' },
    { id: 'feedback', label: 'Orientações' }
  ];

  const fieldClass = 'w-full min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500';
  const primaryButtonClass = 'bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium';

  return (
    <PageShell
      title="Área do Arte-Educador"
      subtitle={`Contexto: ${PEDAGOGY_ORGANIZATION_LABELS[organization]} — diretrizes, registros e orientações da coordenação`}
    >
      <div className="mb-4">
        <PedagogyOrgSwitch value={organization} onChange={setOrganization} />
      </div>
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

        <div className="p-4 sm:p-6 space-y-8">
          {loading && <p className="text-gray-600">Carregando sua área pedagógica...</p>}

          {!loading && tab === 'diretrizes' && (
            <div className="space-y-4">
              {guidelines.length === 0 && (
                <p className="text-gray-500">Não há diretriz pedagógica vigente no momento.</p>
              )}
              {guidelines.map(item => (
                <article key={item.id} className="border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Vigência: {item.validFrom.toLocaleDateString('pt-BR')} a {item.validUntil.toLocaleDateString('pt-BR')}
                    {item.classGroup ? ` · Turma ${item.classGroup}` : ''}
                    {item.area ? ` · ${item.area}` : ''}
                  </p>
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{item.content}</p>
                  {item.supportMaterials.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm">
                      {item.supportMaterials.map(material => (
                        <li key={`${material.title}-${material.url}`}>
                          <a className="text-sky-700 underline" href={material.url} target="_blank" rel="noreferrer">
                            {material.title || material.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}

          {!loading && tab === 'encontros' && (
            <div className="space-y-8">
              <form onSubmit={handleSession} className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900">Registrar encontro</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Turma">
                    <input
                      className={fieldClass}
                      placeholder="Ex.: Turma A"
                      value={sessionForm.classGroup}
                      onChange={event => setSessionForm({ ...sessionForm, classGroup: event.target.value })}
                    />
                  </Field>
                  <Field label="Área (opcional)">
                    <input
                      className={fieldClass}
                      placeholder="Música, teatro..."
                      value={sessionForm.area}
                      onChange={event => setSessionForm({ ...sessionForm, area: event.target.value })}
                    />
                  </Field>
                  <Field label="Data do encontro">
                    <input
                      type="date"
                      className={fieldClass}
                      value={sessionForm.sessionDate}
                      onChange={event => setSessionForm({ ...sessionForm, sessionDate: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Total de alunos">
                    <input
                      className={fieldClass}
                      type="number"
                      min={0}
                      value={sessionForm.totalStudents}
                      onChange={event => setSessionForm({ ...sessionForm, totalStudents: event.target.value })}
                    />
                  </Field>
                  <Field label="Presentes">
                    <input
                      className={fieldClass}
                      type="number"
                      min={0}
                      value={sessionForm.presentCount}
                      onChange={event => setSessionForm({ ...sessionForm, presentCount: event.target.value })}
                    />
                  </Field>
                  <Field label="Engajados">
                    <input
                      className={fieldClass}
                      type="number"
                      min={0}
                      value={sessionForm.engagedCount}
                      onChange={event => setSessionForm({ ...sessionForm, engagedCount: event.target.value })}
                    />
                  </Field>
                  <Field label="Baixo engajamento">
                    <input
                      className={fieldClass}
                      type="number"
                      min={0}
                      value={sessionForm.lowEngagementCount}
                      onChange={event => setSessionForm({ ...sessionForm, lowEngagementCount: event.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Observações (opcional)">
                  <textarea
                    className={`${fieldClass} min-h-[100px]`}
                    placeholder="Registre o que for relevante sobre o encontro"
                    value={sessionForm.notes}
                    onChange={event => setSessionForm({ ...sessionForm, notes: event.target.value })}
                  />
                </Field>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button type="submit" className={primaryButtonClass}>Salvar encontro</button>
                </div>
              </form>
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Encontros registrados</h3>
                {sessions.length === 0 ? (
                  <p className="text-gray-500">Nenhum encontro registrado ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.map(item => (
                      <article key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-medium text-gray-900">
                          {item.classGroup} · {item.sessionDate.toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Frequência {PedagogyEntity.attendanceRate(item)}% · Engajamento {PedagogyEntity.engagementRate(item)}%
                        </p>
                        {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {!loading && tab === 'chamada' && currentUser && (
            <PedagogyAttendancePanel
              organization={organization}
              rolls={attendanceRolls}
              difficulties={difficulties}
              educatorOptions={[{ id: currentUser.id, name: currentUser.displayName }]}
              defaultEducatorId={currentUser.id}
              defaultEducatorName={currentUser.displayName}
              canPickEducator={false}
              onSaved={loadData}
              fieldClass={fieldClass}
            />
          )}

          {!loading && tab === 'dificuldades' && (
            <div className="space-y-8">
              <form onSubmit={handleDifficulty} className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900">Identificar dificuldade</h3>
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                  Registro de acompanhamento pedagógico, não diagnóstico.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Aluno">
                    <input
                      className={fieldClass}
                      placeholder="Nome do aluno"
                      value={difficultyForm.studentName}
                      onChange={event => setDifficultyForm({ ...difficultyForm, studentName: event.target.value })}
                    />
                  </Field>
                  <Field label="Turma (opcional)">
                    <input
                      className={fieldClass}
                      placeholder="Turma ou grupo"
                      value={difficultyForm.classGroup}
                      onChange={event => setDifficultyForm({ ...difficultyForm, classGroup: event.target.value })}
                    />
                  </Field>
                </div>
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">Dificuldades observadas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.values(StudentDifficultyType).map(type => (
                      <label key={type} className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2">
                        <input
                          type="checkbox"
                          checked={difficultyForm.difficulties.includes(type)}
                          onChange={() => toggleDifficulty(type)}
                        />
                        {DIFFICULTY_LABELS[type]}
                      </label>
                    ))}
                  </div>
                </div>
                {difficultyForm.difficulties.includes(StudentDifficultyType.Other) && (
                  <Field label="Outros: descreva">
                    <input
                      className={fieldClass}
                      placeholder="Descreva a dificuldade"
                      value={difficultyForm.otherDifficulty}
                      onChange={event => setDifficultyForm({ ...difficultyForm, otherDifficulty: event.target.value })}
                    />
                  </Field>
                )}
                <Field label="Descrição breve da situação">
                  <textarea
                    className={`${fieldClass} min-h-[100px]`}
                    placeholder="O que foi observado neste acompanhamento"
                    value={difficultyForm.description}
                    onChange={event => setDifficultyForm({ ...difficultyForm, description: event.target.value })}
                  />
                </Field>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button type="submit" className={primaryButtonClass}>Salvar registro</button>
                </div>
              </form>
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Registros anteriores</h3>
                {difficulties.length === 0 ? (
                  <p className="text-gray-500">Nenhuma dificuldade registrada ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {difficulties.map(item => (
                      <article key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-medium text-gray-900">{item.studentName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.difficulties.map(type => DIFFICULTY_LABELS[type]).join(', ')}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">{item.description}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {!loading && tab === 'aplicacao' && (
            <div className="space-y-8">
              <form onSubmit={handleApplication} className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900">Como a diretriz está sendo aplicada</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Diretriz">
                    <select
                      className={fieldClass}
                      value={applicationForm.guidelineId}
                      onChange={event => setApplicationForm({ ...applicationForm, guidelineId: event.target.value })}
                    >
                      <option value="">Selecione a diretriz</option>
                      {guidelines.map(item => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Mês">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className={fieldClass}
                      value={applicationForm.month}
                      onChange={event => setApplicationForm({ ...applicationForm, month: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Ano">
                    <input
                      type="number"
                      className={fieldClass}
                      value={applicationForm.year}
                      onChange={event => setApplicationForm({ ...applicationForm, year: Number(event.target.value) })}
                    />
                  </Field>
                </div>
                <Field label="Dificuldades na aplicação">
                  <textarea
                    className={`${fieldClass} min-h-[90px]`}
                    placeholder="Quais dificuldades estão sendo encontradas na aplicação da Diretriz Pedagógica?"
                    value={applicationForm.applicationDifficulties}
                    onChange={event => setApplicationForm({ ...applicationForm, applicationDifficulties: event.target.value })}
                  />
                </Field>
                <Field label="Como ocorreu a aplicação">
                  <textarea
                    className={`${fieldClass} min-h-[120px]`}
                    placeholder="Descreva brevemente como ocorreu a aplicação durante o mês"
                    value={applicationForm.applicationNarrative}
                    onChange={event => setApplicationForm({ ...applicationForm, applicationNarrative: event.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Estratégias utilizadas">
                    <textarea
                      className={`${fieldClass} min-h-[90px]`}
                      placeholder="Quais estratégias foram utilizadas?"
                      value={applicationForm.strategies}
                      onChange={event => setApplicationForm({ ...applicationForm, strategies: event.target.value })}
                    />
                  </Field>
                  <Field label="Resultados observados">
                    <textarea
                      className={`${fieldClass} min-h-[90px]`}
                      placeholder="Quais resultados foram observados?"
                      value={applicationForm.observedResults}
                      onChange={event => setApplicationForm({ ...applicationForm, observedResults: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button type="submit" className={primaryButtonClass}>Registrar aplicação</button>
                </div>
              </form>
              {applications.length > 0 && (
                <p className="text-sm text-gray-500">{applications.length} relato(s) enviado(s).</p>
              )}
            </div>
          )}

          {!loading && tab === 'feedback' && (
            <div className="space-y-4">
              {feedback.length === 0 && <p className="text-gray-500">Nenhuma orientação recebida ainda.</p>}
              {feedback.map(item => (
                <article key={item.id} className="border border-gray-200 rounded-lg p-5">
                  <p className="text-xs text-gray-500">
                    {FEEDBACK_KIND_LABELS[item.kind]} · {item.fromUserName} · {item.createdAt.toLocaleDateString('pt-BR')}
                    {item.isCollective ? ' · Coletivo' : ''}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{item.message}</p>
                  {item.materials.map(material => (
                    <a
                      key={material.url}
                      className="block text-sm text-sky-700 underline mt-2"
                      href={material.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {material.title || material.url}
                    </a>
                  ))}
                </article>
              ))}
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

export default EducatorPedagogyPage;
