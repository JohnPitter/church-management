import React, { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { ClassRoster, PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';

interface PedagogyRosterPanelProps {
  organization: PedagogyOrganization;
  rosters: ClassRoster[];
  createdBy: string;
  onSaved: () => Promise<void>;
  fieldClass: string;
}

const PedagogyRosterPanel: React.FC<PedagogyRosterPanelProps> = ({
  organization,
  rosters,
  createdBy,
  onSaved,
  fieldClass
}) => {
  const [classGroup, setClassGroup] = useState('');
  const [studentsText, setStudentsText] = useState('');
  const [newName, setNewName] = useState<Record<string, string>>({});
  const [rename, setRename] = useState<Record<string, string>>({});
  const [moveTo, setMoveTo] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await pedagogyService.createRoster({
        organization,
        classGroup,
        students: studentsText.split('\n'),
        createdBy
      });
      toast.success('Turma cadastrada. O arte-educador já pode puxar a chamada.');
      setClassGroup('');
      setStudentsText('');
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a turma');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (rosterId: string) => {
    try {
      await pedagogyService.addStudentToRoster(rosterId, newName[rosterId] || '');
      setNewName(current => ({ ...current, [rosterId]: '' }));
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível adicionar o aluno');
    }
  };

  const handleRename = async (rosterId: string, currentName: string) => {
    const nextName = rename[`${rosterId}:${currentName}`];
    try {
      await pedagogyService.renameStudentInRoster(rosterId, currentName, nextName ?? currentName);
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar o nome');
    }
  };

  const handleMove = async (originId: string, name: string) => {
    const destinationId = moveTo[`${originId}:${name}`];
    if (!destinationId) {
      toast.error('Escolha a turma de destino');
      return;
    }
    try {
      await pedagogyService.moveStudent(originId, destinationId, name);
      toast.success(`${name} foi movido de turma`);
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível mover o aluno');
    }
  };

  const handleRemove = async (rosterId: string, name: string) => {
    try {
      await pedagogyService.removeStudentFromRoster(rosterId, name);
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover o aluno');
    }
  };

  const primaryButtonClass = 'bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50';

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cadastrar turma</h3>
          <p className="text-sm text-gray-600 mt-1">
            Secretaria e coordenação digitam os nomes uma vez. A lista vale no ano seguinte;
            se o aluno mudar de turma, use Mover. O arte-educador só puxa a chamada e marca presença.
          </p>
        </div>
        <label className="block min-w-0">
          <span className="block text-sm font-medium text-gray-700 mb-1">Turma</span>
          <input
            className={fieldClass}
            placeholder="Ex.: Clube da leitura"
            value={classGroup}
            onChange={event => setClassGroup(event.target.value)}
          />
        </label>
        <label className="block min-w-0">
          <span className="block text-sm font-medium text-gray-700 mb-1">Alunos (um nome por linha)</span>
          <textarea
            className={`${fieldClass} min-h-[140px]`}
            placeholder={'Maria Silva\nJoão Santos'}
            value={studentsText}
            onChange={event => setStudentsText(event.target.value)}
          />
        </label>
        <div className="flex justify-end">
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar turma'}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Turmas cadastradas</h3>
        {rosters.length === 0 ? (
          <p className="text-gray-500">Nenhuma turma cadastrada ainda.</p>
        ) : (
          rosters.map(roster => (
            <article key={roster.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="font-medium text-gray-900">
                {roster.classGroup} · {roster.students.length} aluno(s)
              </p>
              {roster.students.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum aluno nesta turma.</p>
              )}
              {roster.students.map(name => (
                <div key={name} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <input
                    className={fieldClass}
                    value={rename[`${roster.id}:${name}`] ?? name}
                    onChange={event => setRename(current => ({
                      ...current,
                      [`${roster.id}:${name}`]: event.target.value
                    }))}
                  />
                  <button
                    type="button"
                    className="text-sm text-sky-700 underline text-left"
                    onClick={() => void handleRename(roster.id, name)}
                  >
                    Substituir nome
                  </button>
                  <select
                    className={fieldClass}
                    value={moveTo[`${roster.id}:${name}`] || ''}
                    onChange={event => setMoveTo(current => ({
                      ...current,
                      [`${roster.id}:${name}`]: event.target.value
                    }))}
                  >
                    <option value="">Mover para...</option>
                    {rosters.filter(item => item.id !== roster.id).map(item => (
                      <option key={item.id} value={item.id}>{item.classGroup}</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-sm text-sky-700 underline"
                      onClick={() => void handleMove(roster.id, name)}
                    >
                      Mover
                    </button>
                    <button
                      type="button"
                      className="text-sm text-red-600 underline"
                      onClick={() => void handleRemove(roster.id, name)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <input
                  className={`${fieldClass} flex-1 min-w-[180px]`}
                  placeholder="Adicionar aluno"
                  value={newName[roster.id] || ''}
                  onChange={event => setNewName(current => ({ ...current, [roster.id]: event.target.value }))}
                />
                <button type="button" className={primaryButtonClass} onClick={() => void handleAdd(roster.id)}>
                  Adicionar
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default PedagogyRosterPanel;
