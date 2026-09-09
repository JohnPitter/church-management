import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AttendanceStudent,
  ClassAttendanceRoll,
  PedagogyEntity,
  PedagogyOrganization,
  StudentDifficultyRecord
} from '@modules/pedagogy/domain/entities/Pedagogy';
import { pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';
import { generateAttendanceReportPDF, generateAttendanceRollPDF } from '../utils/attendanceReportExport';

type EducatorOption = { id: string; name: string };

interface PedagogyAttendancePanelProps {
  organization: PedagogyOrganization;
  rolls: ClassAttendanceRoll[];
  difficulties: StudentDifficultyRecord[];
  educatorOptions: EducatorOption[];
  defaultEducatorId?: string;
  defaultEducatorName?: string;
  canPickEducator: boolean;
  onSaved: () => Promise<void>;
  fieldClass: string;
}

const emptyStudents = (): AttendanceStudent[] => (
  Array.from({ length: 6 }, () => ({ name: '', present: true }))
);

const todayInputValue = (): string => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const PedagogyAttendancePanel: React.FC<PedagogyAttendancePanelProps> = ({
  organization,
  rolls,
  difficulties,
  educatorOptions,
  defaultEducatorId,
  defaultEducatorName,
  canPickEducator,
  onSaved,
  fieldClass
}) => {
  const [classGroup, setClassGroup] = useState('');
  const [sessionDate, setSessionDate] = useState(todayInputValue);
  const [educatorId, setEducatorId] = useState(defaultEducatorId || '');
  const [students, setStudents] = useState<AttendanceStudent[]>(emptyStudents);
  const [saving, setSaving] = useState(false);
  const safeRolls = rolls || [];
  const safeDifficulties = difficulties || [];

  useEffect(() => {
    if (defaultEducatorId) {
      setEducatorId(defaultEducatorId);
    }
  }, [defaultEducatorId]);

  const selectedEducator = educatorOptions.find(item => item.id === educatorId);
  const absences = useMemo(() => PedagogyEntity.absenceReport(safeRolls), [safeRolls]);

  const applySuggestedNames = () => {
    const names = PedagogyEntity.suggestStudentNames(classGroup, safeDifficulties, safeRolls);
    if (names.length === 0) {
      toast.error('Nenhum aluno conhecido nesta turma ainda. Digite os nomes na lista.');
      return;
    }
    setStudents([
      ...names.map(name => ({ name, present: true })),
      { name: '', present: true }
    ]);
  };

  const updateStudent = (index: number, updates: Partial<AttendanceStudent>) => {
    setStudents(current => current.map((student, studentIndex) => (
      studentIndex === index ? { ...student, ...updates } : student
    )));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const educatorName = selectedEducator?.name || defaultEducatorName || '';
    if (!educatorId || !educatorName) {
      toast.error('Selecione o arte-educador responsável pela chamada');
      return;
    }
    setSaving(true);
    try {
      await pedagogyService.createAttendanceRoll({
        organization,
        educatorId,
        educatorName,
        classGroup,
        sessionDate: new Date(`${sessionDate}T12:00:00`),
        students
      });
      toast.success('Chamada registrada');
      setClassGroup('');
      setSessionDate(todayInputValue());
      setStudents(emptyStudents());
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar a chamada');
    } finally {
      setSaving(false);
    }
  };

  const handleExportReport = () => {
    try {
      generateAttendanceReportPDF(safeRolls, organization);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível exportar o relatório');
    }
  };

  const handleExportRoll = (roll: ClassAttendanceRoll) => {
    generateAttendanceRollPDF(roll, organization);
  };

  const primaryButtonClass = 'bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50';
  const secondaryButtonClass = 'border border-sky-600 text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-md text-sm font-medium';

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Caderneta de chamada</h3>
          <p className="text-sm text-gray-600 mt-1">
            Marque presença e ausência por aluno. Não substitui o registro de frequência/engajamento do encontro.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canPickEducator && (
            <label className="block min-w-0">
              <span className="block text-sm font-medium text-gray-700 mb-1">Arte-educador</span>
              <select
                className={fieldClass}
                value={educatorId}
                onChange={event => setEducatorId(event.target.value)}
              >
                <option value="">Selecione</option>
                {educatorOptions.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block min-w-0">
            <span className="block text-sm font-medium text-gray-700 mb-1">Turma</span>
            <input
              className={fieldClass}
              placeholder="Ex.: Turma A"
              value={classGroup}
              onChange={event => setClassGroup(event.target.value)}
            />
          </label>
          <label className="block min-w-0">
            <span className="block text-sm font-medium text-gray-700 mb-1">Data</span>
            <input
              type="date"
              className={fieldClass}
              value={sessionDate}
              onChange={event => setSessionDate(event.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="text-sm text-sky-700 underline" onClick={applySuggestedNames}>
            Carregar alunos da turma
          </button>
          <button
            type="button"
            className="text-sm text-sky-700 underline"
            onClick={() => setStudents(current => [...current, { name: '', present: true }])}
          >
            Adicionar aluno
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg divide-y">
          {students.map((student, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2">
              <input
                className={`${fieldClass} flex-1`}
                placeholder={`Aluno ${index + 1}`}
                value={student.name}
                onChange={event => updateStudent(index, { name: event.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={student.present}
                  onChange={event => updateStudent(index, { present: event.target.checked })}
                />
                Presente
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar chamada'}
          </button>
        </div>
      </form>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Chamadas registradas</h3>
          {safeRolls.length > 0 && (
            <button type="button" className={secondaryButtonClass} onClick={handleExportReport}>
              Exportar relatório PDF
            </button>
          )}
        </div>
        {safeRolls.length === 0 ? (
          <p className="text-gray-500">Nenhuma chamada registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {safeRolls.map(roll => {
              const absent = PedagogyEntity.absentStudents(roll);
              return (
                <article key={roll.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {roll.classGroup} · {roll.sessionDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {roll.educatorName} · {PedagogyEntity.presentCount(roll)} presente(s) · {absent.length} falta(s)
                      </p>
                      {absent.length > 0 && (
                        <p className="text-sm text-amber-800 mt-2">
                          Ausentes: {absent.map(item => item.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => handleExportRoll(roll)}
                    >
                      Exportar PDF
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Relatório de faltas</h3>
        {absences.length === 0 ? (
          <p className="text-gray-500">Nenhuma falta registrada.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-700">Aluno</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Turma</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Data</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Arte-educador</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((item, index) => (
                  <tr key={`${item.studentName}-${item.sessionDate.toISOString()}-${index}`} className="border-t">
                    <td className="px-4 py-3">{item.studentName}</td>
                    <td className="px-4 py-3">{item.classGroup}</td>
                    <td className="px-4 py-3">{item.sessionDate.toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">{item.educatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PedagogyAttendancePanel;
