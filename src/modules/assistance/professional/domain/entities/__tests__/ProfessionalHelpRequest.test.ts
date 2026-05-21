import {
  HelpRequestPriority,
  HelpRequestStatus,
  HelpRequestType,
  ProfessionalHelpRequestEntity,
} from '../ProfessionalHelpRequest';

describe('ProfessionalHelpRequestEntity', () => {
  const request = {
    solicitanteId: 'pro-1',
    destinatarioId: 'pro-2',
    status: HelpRequestStatus.Pendente,
  } as any;

  it('retorna labels e cores corretos', () => {
    expect(ProfessionalHelpRequestEntity.getStatusLabel(HelpRequestStatus.EmAnalise)).toBe('Em Análise');
    expect(ProfessionalHelpRequestEntity.getPriorityLabel(HelpRequestPriority.Urgente)).toBe('Urgente');
    expect(ProfessionalHelpRequestEntity.getTypeLabel(HelpRequestType.SegundaOpiniao)).toBe('Segunda Opinião');
    expect(ProfessionalHelpRequestEntity.getPriorityColor(HelpRequestPriority.Alta)).toContain('bg-orange-100');
    expect(ProfessionalHelpRequestEntity.getStatusColor(HelpRequestStatus.Aceito)).toContain('bg-green-100');
  });

  it('avalia permissoes de responder, editar e cancelar', () => {
    expect(ProfessionalHelpRequestEntity.canRespond(request, 'pro-2')).toBe(true);
    expect(ProfessionalHelpRequestEntity.canRespond(request, 'pro-1')).toBe(false);
    expect(ProfessionalHelpRequestEntity.canEdit(request, 'pro-1')).toBe(true);
    expect(ProfessionalHelpRequestEntity.canCancel(request, 'pro-1')).toBe(true);
    expect(
      ProfessionalHelpRequestEntity.canCancel(
        { ...request, status: HelpRequestStatus.Concluido },
        'pro-1'
      )
    ).toBe(false);
  });
});
