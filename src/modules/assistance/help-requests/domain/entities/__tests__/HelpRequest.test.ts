import {
  HelpRequestManager,
  HelpRequestPriority,
  HelpRequestStatus,
} from '../HelpRequest';

describe('HelpRequestManager', () => {
  it('retorna labels corretos para status e prioridade', () => {
    expect(HelpRequestManager.getStatusLabel(HelpRequestStatus.Pending)).toBe('Aguardando');
    expect(HelpRequestManager.getStatusLabel(HelpRequestStatus.Accepted)).toBe('Aceito');
    expect(HelpRequestManager.getPriorityLabel(HelpRequestPriority.Low)).toBe('Baixa');
    expect(HelpRequestManager.getPriorityLabel(HelpRequestPriority.Urgent)).toBe('Urgente');
  });

  it('retorna cores corretas para status e prioridade', () => {
    expect(HelpRequestManager.getStatusColor(HelpRequestStatus.Resolved)).toContain('bg-green-100');
    expect(HelpRequestManager.getStatusColor(HelpRequestStatus.Cancelled)).toContain('bg-gray-100');
    expect(HelpRequestManager.getPriorityColor(HelpRequestPriority.High)).toContain('bg-orange-100');
    expect(HelpRequestManager.getPriorityColor(HelpRequestPriority.Normal)).toContain('bg-blue-100');
  });
});
