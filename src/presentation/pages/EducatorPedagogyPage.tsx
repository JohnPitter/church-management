import React, { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/common/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';
import {
  ClassSessionRecord,
  DIFFICULTY_LABELS,
  FEEDBACK_KIND_LABELS,
  GuidelineApplication,
  PedagogicalFeedback,
  PedagogicalGuideline,
  PedagogyEntity,
  StudentDifficultyRecord,
  StudentDifficultyType
} from '@modules/pedagogy/domain/entities/Pedagogy';

type TabId = 'diretrizes' | 'encontros' | 'dificuldades' | 'aplicacao' | 'feedback';

const EducatorPedagogyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<TabId>('diretrizes');
  const [loading, setLoading] = useState(true);
  const [guidelines, setGuidelines] = useState<PedagogicalGuideline[]>([]);
  const [sessions, setSessions] = useState<ClassSessionRecord[]>([]);
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
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) {
      return;
    }
    setLoading(true);
    try {
      const [guideList, sessionList, difficultyList, applicationList, feedbackList] = await Promise.all([
        pedagogyService.listActiveGuidelines(),
        pedagogyService.listSessions(currentUser.id),
        pedagogyService.listDifficulties(currentUser.id),
        pedagogyService.listApplications(currentUser.id),
        pedagogyService.listFeedbackForEducator(currentUser.id)
      ]);
      setGuidelines(guideList);
      setSessions(sessionList);
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
      || (await pedagogyService.listGuidelines()).find(item => item.id === applicationForm.guidelineId);
    try {
      await pedagogyService.createApplication({
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
    { id: 'dificuldades', label: 'Dificuldades' },
    { id: 'aplicacao', label: 'Aplicação da diretriz' },
    { id: 'feedback', label: 'Orientações' }
  ];

  return (
    <PageShell
      title="Área do Arte-Educador"
      subtitle="Consulte as diretrizes, registre os encontros e acompanhe as orientações da coordenação"
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              tab === item.id ? 'bg-sky-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-600">Carregando sua área pedagógica...</p>}

      {!loading && tab === 'diretrizes' && (
        <div className="space-y-4">
          {guidelines.length === 0 && (
            <p className="text-gray-600">Não há diretriz pedagógica vigente no momento.</p>
          )}
          {guidelines.map(item => (
            <article key={item.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSession} className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="font-semibold">Registrar encontro</h3>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Turma"
              value={sessionForm.classGroup}
              onChange={event => setSessionForm({ ...sessionForm, classGroup: event.target.value })}
            />
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={sessionForm.sessionDate}
              onChange={event => setSessionForm({ ...sessionForm, sessionDate: event.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Total de alunos na turma"
              type="number"
              min={0}
              value={sessionForm.totalStudents}
              onChange={event => setSessionForm({ ...sessionForm, totalStudents: event.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Presentes no encontro"
              type="number"
              min={0}
              value={sessionForm.presentCount}
              onChange={event => setSessionForm({ ...sessionForm, presentCount: event.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Alunos engajados"
              type="number"
              min={0}
              value={sessionForm.engagedCount}
              onChange={event => setSessionForm({ ...sessionForm, engagedCount: event.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Alunos com baixo engajamento"
              type="number"
              min={0}
              value={sessionForm.lowEngagementCount}
              onChange={event => setSessionForm({ ...sessionForm, lowEngagementCount: event.target.value })}
            />
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Observações (opcional)"
              value={sessionForm.notes}
              onChange={event => setSessionForm({ ...sessionForm, notes: event.target.value })}
            />
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">Salvar encontro</button>
          </form>
          <div className="space-y-3">
            {sessions.map(item => (
              <article key={item.id} className="bg-white rounded-lg shadow p-4">
                <p className="font-medium">{item.classGroup} · {item.sessionDate.toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-gray-600">
                  Frequência {PedagogyEntity.attendanceRate(item)}% · Engajamento {PedagogyEntity.engagementRate(item)}%
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'dificuldades' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleDifficulty} className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="font-semibold">Identificar dificuldade</h3>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
              Registro de acompanhamento pedagógico, não diagnóstico.
            </p>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Aluno"
              value={difficultyForm.studentName}
              onChange={event => setDifficultyForm({ ...difficultyForm, studentName: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              {Object.values(StudentDifficultyType).map(type => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={difficultyForm.difficulties.includes(type)}
                    onChange={() => toggleDifficulty(type)}
                  />
                  {DIFFICULTY_LABELS[type]}
                </label>
              ))}
            </div>
            {difficultyForm.difficulties.includes(StudentDifficultyType.Other) && (
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Outros: descreva"
                value={difficultyForm.otherDifficulty}
                onChange={event => setDifficultyForm({ ...difficultyForm, otherDifficulty: event.target.value })}
              />
            )}
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              placeholder="Descrição breve da situação"
              value={difficultyForm.description}
              onChange={event => setDifficultyForm({ ...difficultyForm, description: event.target.value })}
            />
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">Salvar registro</button>
          </form>
          <div className="space-y-3">
            {difficulties.map(item => (
              <article key={item.id} className="bg-white rounded-lg shadow p-4">
                <p className="font-medium">{item.studentName}</p>
                <p className="text-sm text-gray-600">
                  {item.difficulties.map(type => DIFFICULTY_LABELS[type]).join(', ')}
                </p>
                <p className="text-sm mt-2">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'aplicacao' && (
        <form onSubmit={handleApplication} className="bg-white rounded-lg shadow p-6 space-y-3 max-w-3xl">
          <h3 className="font-semibold">Como a diretriz está sendo aplicada</h3>
          <select
            className="w-full border rounded px-3 py-2"
            value={applicationForm.guidelineId}
            onChange={event => setApplicationForm({ ...applicationForm, guidelineId: event.target.value })}
          >
            <option value="">Selecione a diretriz</option>
            {guidelines.map(item => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={1}
              max={12}
              className="border rounded px-3 py-2"
              value={applicationForm.month}
              onChange={event => setApplicationForm({ ...applicationForm, month: Number(event.target.value) })}
            />
            <input
              type="number"
              className="border rounded px-3 py-2"
              value={applicationForm.year}
              onChange={event => setApplicationForm({ ...applicationForm, year: Number(event.target.value) })}
            />
          </div>
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Quais dificuldades estão sendo encontradas na aplicação da Diretriz Pedagógica?"
            value={applicationForm.applicationDifficulties}
            onChange={event => setApplicationForm({ ...applicationForm, applicationDifficulties: event.target.value })}
          />
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[100px]"
            placeholder="Descreva brevemente como ocorreu a aplicação durante o mês"
            value={applicationForm.applicationNarrative}
            onChange={event => setApplicationForm({ ...applicationForm, applicationNarrative: event.target.value })}
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Quais estratégias foram utilizadas?"
            value={applicationForm.strategies}
            onChange={event => setApplicationForm({ ...applicationForm, strategies: event.target.value })}
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Quais resultados foram observados?"
            value={applicationForm.observedResults}
            onChange={event => setApplicationForm({ ...applicationForm, observedResults: event.target.value })}
          />
          <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">Registrar aplicação</button>
          {applications.length > 0 && (
            <p className="text-sm text-gray-500">{applications.length} relato(s) enviado(s).</p>
          )}
        </form>
      )}

      {!loading && tab === 'feedback' && (
        <div className="space-y-4">
          {feedback.length === 0 && <p className="text-gray-600">Nenhuma orientação recebida ainda.</p>}
          {feedback.map(item => (
            <article key={item.id} className="bg-white rounded-lg shadow p-5">
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
    </PageShell>
  );
};

export default EducatorPedagogyPage;
