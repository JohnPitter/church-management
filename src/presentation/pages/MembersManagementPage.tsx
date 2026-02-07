// Presentation Page - Members Management (English System)
// Simplified member management page using English entities

import React, { useState, useEffect } from 'react';
import { MemberService } from '@modules/church-management/members/application/services/MemberService';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import {
  Member,
  MemberStatus,
  MemberType,
  MemberEntity
} from '../../domain/entities/Member';
import { CreateMemberModal } from '@modules/church-management/members/presentation/components/CreateMemberModal';
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

interface MembersManagementPageProps {}

const MembersManagementPage: React.FC<MembersManagementPageProps> = () => {
  const { currentUser } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { confirm } = useConfirmDialog();

  // Permission checks
  const canView = hasPermission(SystemModule.Members, PermissionAction.View);
  const canCreate = hasPermission(SystemModule.Members, PermissionAction.Create);
  const canUpdate = hasPermission(SystemModule.Members, PermissionAction.Update);
  const canDelete = hasPermission(SystemModule.Members, PermissionAction.Delete);
  const canManage = hasPermission(SystemModule.Members, PermissionAction.Manage);

  const [activeTab, setActiveTab] = useState<'members' | 'birthdays' | 'reports'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all');
  const [filterMemberType, setFilterMemberType] = useState<MemberType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const memberService = new MemberService();

  useEffect(() => {
    loadMembers();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await memberService.getAllMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.includes('permissions') || errorMessage.includes('insufficient')) {
        toast.error('Erro: Voce nao tem permissao para acessar os dados de membros. Contate o administrador.');
      } else {
        toast.error('Erro ao carregar membros: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await memberService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Statistics are optional, don't show alert for them
    }
  };

  const handleStatusChange = async (member: Member, newStatus: MemberStatus) => {
    try {
      await memberService.updateMemberStatus(member.id, newStatus);
      await loadMembers();
      await loadStatistics();
      await loggingService.logDatabase('info', 'Member status changed', `Member: ${member.name}, Status: ${newStatus}`, currentUser as any);
      toast.success(`Status de ${member.name} atualizado com sucesso!`);
    } catch (error) {
      console.error('Error updating member status:', error);
      await loggingService.logDatabase('error', 'Error changing member status', `Member: ${member.name}, Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar status: ' + errorMessage);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    const confirmed = await confirm({
      title: 'Confirmacao',
      message: `Tem certeza que deseja excluir o membro "${member.name}"?\n\nEsta acao NAO pode ser desfeita. Todos os dados do membro serao permanentemente removidos.`,
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await memberService.deleteMember(member.id);
      await loadMembers();
      await loadStatistics();
      await loggingService.logDatabase('warning', 'Member deleted', `Member: ${member.name}, ID: ${member.id}`, currentUser as any);
      toast.success(`Membro ${member.name} excluido com sucesso!`);
    } catch (error) {
      console.error('Error deleting member:', error);
      await loggingService.logDatabase('error', 'Error deleting member', `Member: ${member.name}, ID: ${member.id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao excluir membro: ' + errorMessage);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesMemberType = filterMemberType === 'all' || member.memberType === filterMemberType;
    const matchesSearch = !searchTerm ||
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.phone && member.phone.includes(searchTerm));

    return matchesStatus && matchesMemberType && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMemberType]);

  const getStatusColor = (status: MemberStatus) => {
    const colors = {
      [MemberStatus.Active]: 'bg-green-100 text-green-800',
      [MemberStatus.Inactive]: 'bg-gray-100 text-gray-800',
      [MemberStatus.Transferred]: 'bg-blue-100 text-blue-800',
      [MemberStatus.Disciplined]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: MemberStatus) => {
    const labels = {
      [MemberStatus.Active]: 'Ativo',
      [MemberStatus.Inactive]: 'Inativo',
      [MemberStatus.Transferred]: 'Transferido',
      [MemberStatus.Disciplined]: 'Disciplinado'
    };
    return labels[status] || status;
  };

  // Birthday members for current month
  const currentMonthBirthdays = members.filter(member => {
    const today = new Date();
    const birthDate = new Date(member.birthDate);
    return birthDate.getMonth() === today.getMonth() && member.status === MemberStatus.Active;
  }).sort((a, b) => {
    const dayA = new Date(a.birthDate).getDate();
    const dayB = new Date(b.birthDate).getDate();
    return dayA - dayB;
  });

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Export functions
  const exportToCSV = async () => {
    try {
      // Prepare CSV headers
      const headers = [
        'Nome',
        'Email',
        'Telefone',
        'Data de Nascimento',
        'Idade',
        'Estado Civil',
        'Tipo de Membro',
        'Endereço Completo',
        'Rua',
        'Número',
        'Complemento',
        'Bairro',
        'Cidade',
        'Estado',
        'CEP',
        'Data de Conversão',
        'Data de Batismo',
        'Ministérios',
        'Função',
        'Status',
        'Data de Cadastro'
      ];

      // Prepare CSV rows
      const rows = members.map(member => [
        member.name,
        member.email || '',
        member.phone || '',
        new Date(member.birthDate).toLocaleDateString('pt-BR'),
        calculateAge(member.birthDate).toString(),
        getMaritalStatusLabel(member.maritalStatus),
        getMemberTypeLabel(member.memberType),
        `${member.address.street}, ${member.address.number}${member.address.complement ? ' - ' + member.address.complement : ''}, ${member.address.neighborhood}, ${member.address.city}/${member.address.state} - CEP: ${member.address.zipCode}`,
        member.address.street,
        member.address.number,
        member.address.complement || '',
        member.address.neighborhood,
        member.address.city,
        member.address.state,
        member.address.zipCode,
        member.conversionDate ? new Date(member.conversionDate).toLocaleDateString('pt-BR') : '',
        member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : '',
        member.ministries?.join(', ') || '',
        member.role || '',
        getStatusLabel(member.status),
        new Date(member.createdAt).toLocaleDateString('pt-BR')
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `membros_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await loggingService.logUserAction('Members exported', `Format: CSV, Count: ${members.length}`, currentUser as any);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      await loggingService.logDatabase('error', 'Error exporting members to CSV', `Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      toast.error('Erro ao exportar dados para CSV');
    }
  };

  const exportToExcel = async () => {
    try {
      // Prepare Excel data with headers
      const headers = [
        'Nome',
        'Email',
        'Telefone',
        'Data de Nascimento',
        'Idade',
        'Estado Civil',
        'Tipo de Membro',
        'Rua',
        'Número',
        'Complemento',
        'Bairro',
        'Cidade',
        'Estado',
        'CEP',
        'Data de Conversão',
        'Data de Batismo',
        'Ministérios',
        'Função',
        'Status',
        'Data de Cadastro'
      ];

      const rows = members.map(member => [
        member.name,
        member.email || '',
        member.phone || '',
        new Date(member.birthDate).toLocaleDateString('pt-BR'),
        calculateAge(member.birthDate),
        getMaritalStatusLabel(member.maritalStatus),
        getMemberTypeLabel(member.memberType),
        member.address.street,
        member.address.number,
        member.address.complement || '',
        member.address.neighborhood,
        member.address.city,
        member.address.state,
        member.address.zipCode,
        member.conversionDate ? new Date(member.conversionDate).toLocaleDateString('pt-BR') : '',
        member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : '',
        member.ministries?.join(', ') || '',
        member.role || '',
        getStatusLabel(member.status),
        new Date(member.createdAt).toLocaleDateString('pt-BR')
      ]);

      // Create HTML table for Excel
      const tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="utf-8">
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #4CAF50; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `membros_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await loggingService.logUserAction('Members exported', `Format: Excel, Count: ${members.length}`, currentUser as any);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      await loggingService.logDatabase('error', 'Error exporting members to Excel', `Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      toast.error('Erro ao exportar dados para Excel');
    }
  };

  const exportToPDF = async () => {
    try {
      // Create a printable HTML for PDF
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) {
        toast.error('Por favor, permita popups para exportar para PDF');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Lista de Membros</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                font-size: 10px;
              }
              h1 {
                color: #333;
                text-align: center;
                font-size: 18px;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 6px;
                text-align: left;
                font-size: 9px;
              }
              th {
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f2f2f2;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 8px;
                color: #666;
              }
              @media print {
                body { margin: 10px; }
                h1 { font-size: 16px; }
                table { font-size: 8px; }
                th, td { padding: 4px; }
              }
            </style>
          </head>
          <body>
            <h1>Lista de Membros da Igreja</h1>
            <p style="text-align: center; font-size: 10px;">
              Gerado em: ${new Date().toLocaleString('pt-BR')}
            </p>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Idade</th>
                  <th>Estado Civil</th>
                  <th>Tipo</th>
                  <th>Cidade</th>
                  <th>Ministérios</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${members.map(member => `
                  <tr>
                    <td>${member.name}</td>
                    <td>${member.email || '-'}</td>
                    <td>${member.phone || '-'}</td>
                    <td>${calculateAge(member.birthDate)} anos</td>
                    <td>${getMaritalStatusLabel(member.maritalStatus)}</td>
                    <td>${getMemberTypeLabel(member.memberType)}</td>
                    <td>${member.address.city}</td>
                    <td>${member.ministries?.join(', ') || '-'}</td>
                    <td>${getStatusLabel(member.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Total de membros: ${members.length}</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      await loggingService.logUserAction('Members exported', `Format: PDF, Count: ${members.length}`, currentUser as any);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      await loggingService.logDatabase('error', 'Error exporting members to PDF', `Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      toast.error('Erro ao exportar dados para PDF');
    }
  };

  const exportSignatureListToPDF = () => {
    try {
      // Apenas membros oficiais podem assinar (exclui congregados)
      const membersWhoCanSign = getMembersWhoCanSign();

      if (membersWhoCanSign.length === 0) {
        toast('Nenhum membro disponivel para lista de assinaturas');
        return;
      }

      // Create a printable HTML for PDF with signature format
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) {
        toast.error('Por favor, permita popups para exportar para PDF');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Lista de Assinaturas - Membros</title>
            <style>
              @page {
                size: A4;
                margin: 2cm;
              }
              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                font-size: 11pt;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
              }
              .header h1 {
                margin: 0;
                font-size: 20pt;
                color: #333;
              }
              .header p {
                margin: 5px 0;
                font-size: 10pt;
                color: #666;
              }
              .signature-list {
                margin-top: 20px;
              }
              .signature-item {
                display: flex;
                align-items: center;
                margin-bottom: 25px;
                page-break-inside: avoid;
              }
              .number {
                font-weight: bold;
                width: 35px;
                font-size: 11pt;
                color: #333;
              }
              .member-info {
                flex: 1;
                display: flex;
                flex-direction: column;
              }
              .name {
                font-weight: 500;
                font-size: 11pt;
                margin-bottom: 2px;
                color: #000;
              }
              .contact {
                font-size: 9pt;
                color: #666;
                margin-bottom: 8px;
              }
              .signature-line {
                border-bottom: 1px solid #333;
                width: 100%;
                margin-top: 5px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 9pt;
                color: #666;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Lista de Assinaturas</h1>
              <p><strong>Membros da Igreja</strong></p>
              <p>Gerado em: ${new Date().toLocaleString('pt-BR', {
                dateStyle: 'full',
                timeStyle: 'short'
              })}</p>
            </div>

            <div class="signature-list">
              ${membersWhoCanSign.map((member, index) => `
                <div class="signature-item">
                  <div class="number">${(index + 1).toString().padStart(2, '0')}.</div>
                  <div class="member-info">
                    <div class="name">${member.name}</div>
                    <div class="contact">
                      ${member.phone || ''} ${member.email ? '• ' + member.email : ''}
                    </div>
                    <div class="signature-line"></div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="footer">
              <p><strong>Total de membros (aptos a assinar): ${membersWhoCanSign.length}</strong></p>
              <p>Este documento foi gerado automaticamente pelo sistema de gerenciamento da igreja</p>
              <p style="font-size: 9pt; color: #999;">Nota: Congregados não aparecem nesta lista pois não podem assinar documentos oficiais</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (error) {
      console.error('Error exporting signature list to PDF:', error);
      toast.error('Erro ao exportar lista de assinaturas para PDF');
    }
  };

  const exportSignatureListToWord = async () => {
    try {
      // Apenas membros oficiais podem assinar (exclui congregados)
      const membersWhoCanSign = getMembersWhoCanSign();

      if (membersWhoCanSign.length === 0) {
        toast('Nenhum membro disponivel para lista de assinaturas');
        return;
      }

      // Create Word document with signature format
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: "Lista de Assinaturas",
                  bold: true,
                  size: 32,
                  font: "Arial"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: "Membros da Igreja",
                  size: 24,
                  font: "Arial"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: `Gerado em: ${new Date().toLocaleString('pt-BR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}`,
                  size: 18,
                  font: "Arial",
                  color: "666666"
                })
              ]
            }),

            // Signature items
            ...membersWhoCanSign.flatMap((member, index) => [
              new Paragraph({
                spacing: { before: 200, after: 50 },
                children: [
                  new TextRun({
                    text: `${(index + 1).toString().padStart(2, '0')}. `,
                    bold: true,
                    size: 22,
                    font: "Arial"
                  }),
                  new TextRun({
                    text: member.name,
                    size: 22,
                    font: "Arial"
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({
                    text: `     ${member.phone || ''} ${member.email ? '• ' + member.email : ''}`,
                    size: 18,
                    font: "Arial",
                    color: "666666"
                })
                ]
              }),
              new Paragraph({
                spacing: { after: 200 },
                border: {
                  bottom: {
                    color: "000000",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6
                  }
                },
                children: [
                  new TextRun({
                    text: "     ",
                    size: 20
                  })
                ]
              })
            ]),

            // Footer
            new Paragraph({
              spacing: { before: 400 },
              children: []
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: `Total de membros: ${filteredMembers.length}`,
                  bold: true,
                  size: 20,
                  font: "Arial"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Este documento foi gerado automaticamente pelo sistema de gerenciamento da igreja",
                  size: 16,
                  font: "Arial",
                  color: "666666"
                })
              ]
            })
          ]
        }]
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lista_assinaturas_membros_${new Date().toISOString().split('T')[0]}.docx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Lista de assinaturas exportada com sucesso para Word!');
    } catch (error) {
      console.error('Error exporting signature list to Word:', error);
      toast.error('Erro ao exportar lista de assinaturas para Word');
    }
  };

  const getMaritalStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)'
    };
    return labels[status] || status;
  };

  const getMemberTypeLabel = (type: MemberType) => {
    const labels = {
      [MemberType.Member]: 'Membro',
      [MemberType.Congregant]: 'Congregado'
    };
    return labels[type] || type;
  };

  const getMemberTypeColor = (type: MemberType) => {
    const colors = {
      [MemberType.Member]: 'bg-blue-100 text-blue-800',
      [MemberType.Congregant]: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Função para obter membros que podem assinar documentos
  const getMembersWhoCanSign = () => {
    return members.filter(member => MemberEntity.canSignDocuments(member));
  };

  // Permission loading state
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Verificando permissões...</span>
      </div>
    );
  }

  // Access denied if user cannot view members
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para visualizar membros.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Membros</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre os membros da igreja e suas informações
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ➕ Novo Membro
              </button>
            )}
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">👥</span>
              Membros ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('birthdays')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'birthdays'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">🎂</span>
              Aniversários ({currentMonthBirthdays.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">📊</span>
              Relatórios
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <>
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Membros Ativos</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.active}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total de Membros</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-2xl">🎂</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Aniversários</p>
                      <p className="text-2xl font-semibold text-gray-900">{currentMonthBirthdays.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Novos este Mês</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.monthlyGrowth}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome, email ou telefone..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as MemberStatus | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="all">Todos os Status</option>
                    <option value={MemberStatus.Active}>Ativo</option>
                    <option value={MemberStatus.Inactive}>Inativo</option>
                    <option value={MemberStatus.Transferred}>Transferido</option>
                    <option value={MemberStatus.Disciplined}>Disciplinado</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="memberType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    id="memberType"
                    value={filterMemberType}
                    onChange={(e) => setFilterMemberType(e.target.value as MemberType | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value={MemberType.Member}>Membros</option>
                    <option value={MemberType.Congregant}>Congregados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Membros ({filteredMembers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membro
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Idade
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            {member.email && (
                              <div className="text-sm text-gray-500 truncate max-w-[200px]">{member.email}</div>
                            )}
                            <div className="md:hidden text-xs text-gray-500 mt-1">{member.phone}</div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.phone}</div>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{calculateAge(member.birthDate)} anos</div>
                          <div className="text-sm text-gray-500">
                            {new Date(member.birthDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMemberTypeColor(member.memberType)}`}>
                            {getMemberTypeLabel(member.memberType)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                            {getStatusLabel(member.status)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {/* Edit Button - More touch-friendly on mobile */}
                            {canUpdate && (
                              <button
                                onClick={() => handleEditMember(member)}
                                className="inline-flex items-center justify-center px-3 py-2.5 sm:py-1.5 bg-indigo-600 sm:bg-indigo-50 text-white sm:text-indigo-700 rounded-lg sm:rounded-md hover:bg-indigo-700 sm:hover:bg-indigo-100 transition-colors border-0 sm:border sm:border-indigo-200 sm:hover:border-indigo-300 font-medium text-sm shadow-sm sm:shadow-none"
                                title="Editar membro"
                              >
                                ✏️ <span className="ml-2 sm:ml-0 text-sm font-medium">Editar</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="inline-flex items-center justify-center px-3 py-2.5 sm:py-1.5 bg-red-600 sm:bg-red-50 text-white sm:text-red-700 rounded-lg sm:rounded-md hover:bg-red-700 sm:hover:bg-red-100 transition-colors border-0 sm:border sm:border-red-200 sm:hover:border-red-300 font-medium text-sm shadow-sm sm:shadow-none"
                                title="Excluir membro"
                              >
                                🗑️ <span className="ml-2 sm:ml-0 text-sm font-medium">Excluir</span>
                              </button>
                            )}

                            {/* Status Select - Larger and more touch-friendly on mobile */}
                            {canUpdate && (
                              <select
                                value={member.status}
                                onChange={(e) => handleStatusChange(member, e.target.value as MemberStatus)}
                                className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 border-2 sm:border border-gray-300 rounded-lg sm:rounded-md text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white cursor-pointer appearance-none bg-no-repeat bg-right pr-8 sm:pr-7"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundSize: '1.5em 1.5em'
                                }}
                              >
                                <option value={MemberStatus.Active}>Ativo</option>
                                <option value={MemberStatus.Inactive}>Inativo</option>
                                <option value={MemberStatus.Transferred}>Transferido</option>
                                <option value={MemberStatus.Disciplined}>Disciplinado</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredMembers.length > 0 && (
                <div className="bg-white px-4 py-3 sm:px-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Items per page selector */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                        Mostrar:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700">
                        por página
                      </span>
                    </div>

                    {/* Page info */}
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredMembers.length)}</span> de{' '}
                      <span className="font-medium">{filteredMembers.length}</span> resultados
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title="Primeira página"
                      >
                        <span className="text-lg">⏮️</span>
                      </button>

                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Anterior
                      </button>

                      {/* Page numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Current page indicator for mobile */}
                      <div className="sm:hidden px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {currentPage} / {totalPages}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Próxima
                      </button>

                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title="Última página"
                      >
                        <span className="text-lg">⏭️</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum membro encontrado com os filtros aplicados.
                </div>
              )}
            </div>
          </>
        )}

        {/* Birthdays Tab */}
        {activeTab === 'birthdays' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Aniversários deste Mês ({new Date().toLocaleString('pt-BR', { month: 'long' })})
            </h2>
            
            {currentMonthBirthdays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum aniversário este mês.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentMonthBirthdays.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🎂</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(member.birthDate).getDate()} de {new Date(member.birthDate).toLocaleString('pt-BR', { month: 'long' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {calculateAge(member.birthDate)} anos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* General Statistics */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">📊</span>
                Estatísticas Gerais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Total de Membros</p>
                  <p className="text-3xl font-bold text-gray-900">{members.length}</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Membros Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter(m => m.status === MemberStatus.Active).length}
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="text-sm text-gray-600">Membros Inativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter(m => m.status === MemberStatus.Inactive).length}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-gray-600">Transferidos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter(m => m.status === MemberStatus.Transferred).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Member Type Distribution */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">👤</span>
                Membros e Congregados
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Membros Oficiais</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {members.filter(m => m.memberType === MemberType.Member).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Podem assinar atas e votar em assembleias
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-gray-600">Congregados</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {members.filter(m => m.memberType === MemberType.Congregant).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Não podem assinar documentos oficiais
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Membros Aptos a Assinar</p>
                  <p className="text-3xl font-bold text-green-700">
                    {members.filter(m => MemberEntity.canSignDocuments(m)).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Membros ativos, maiores de idade e oficiais
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-xl text-blue-400">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Nota:</strong> Congregados aparecem em todos os relatórios e estatísticas, mas são excluídos automaticamente das listas de assinatura de atas e votação em assembleias.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Distribuição por Faixa Etária
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">0-17 anos</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {members.filter(m => calculateAge(m.birthDate) < 18).length}
                  </p>
                  <p className="text-xs text-blue-600">
                    {((members.filter(m => calculateAge(m.birthDate) < 18).length / members.length) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900">18-35 anos</p>
                  <p className="text-2xl font-bold text-green-700">
                    {members.filter(m => {
                      const age = calculateAge(m.birthDate);
                      return age >= 18 && age <= 35;
                    }).length}
                  </p>
                  <p className="text-xs text-green-600">
                    {((members.filter(m => {
                      const age = calculateAge(m.birthDate);
                      return age >= 18 && age <= 35;
                    }).length / members.length) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900">36-60 anos</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {members.filter(m => {
                      const age = calculateAge(m.birthDate);
                      return age >= 36 && age <= 60;
                    }).length}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {((members.filter(m => {
                      const age = calculateAge(m.birthDate);
                      return age >= 36 && age <= 60;
                    }).length / members.length) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900">60+ anos</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {members.filter(m => calculateAge(m.birthDate) > 60).length}
                  </p>
                  <p className="text-xs text-purple-600">
                    {((members.filter(m => calculateAge(m.birthDate) > 60).length / members.length) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Marital Status Distribution */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💑</span>
                Estado Civil
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Solteiros</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.maritalStatus === 'single').length}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Casados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.maritalStatus === 'married').length}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Divorciados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.maritalStatus === 'divorced').length}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Viúvos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.maritalStatus === 'widowed').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Member Type by Status Distribution */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Distribuição por Tipo e Status
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Members Official */}
                <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
                  <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center">
                    <span className="mr-2">👥</span>
                    Membros Oficiais
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Ativos</span>
                      <span className="text-lg font-bold text-green-600">
                        {members.filter(m => m.memberType === MemberType.Member && m.status === MemberStatus.Active).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Inativos</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {members.filter(m => m.memberType === MemberType.Member && m.status === MemberStatus.Inactive).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Transferidos</span>
                      <span className="text-lg font-bold text-purple-600">
                        {members.filter(m => m.memberType === MemberType.Member && m.status === MemberStatus.Transferred).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Disciplinados</span>
                      <span className="text-lg font-bold text-red-600">
                        {members.filter(m => m.memberType === MemberType.Member && m.status === MemberStatus.Disciplined).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-100 rounded p-3 border-t-2 border-blue-300">
                      <span className="text-sm font-semibold text-blue-900">Total</span>
                      <span className="text-xl font-bold text-blue-700">
                        {members.filter(m => m.memberType === MemberType.Member).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Congregants */}
                <div className="border-2 border-purple-200 rounded-lg p-5 bg-purple-50">
                  <h4 className="text-md font-semibold text-purple-900 mb-4 flex items-center">
                    <span className="mr-2">👤</span>
                    Congregados
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Ativos</span>
                      <span className="text-lg font-bold text-green-600">
                        {members.filter(m => m.memberType === MemberType.Congregant && m.status === MemberStatus.Active).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Inativos</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {members.filter(m => m.memberType === MemberType.Congregant && m.status === MemberStatus.Inactive).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Transferidos</span>
                      <span className="text-lg font-bold text-purple-600">
                        {members.filter(m => m.memberType === MemberType.Congregant && m.status === MemberStatus.Transferred).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-3">
                      <span className="text-sm text-gray-700">Disciplinados</span>
                      <span className="text-lg font-bold text-red-600">
                        {members.filter(m => m.memberType === MemberType.Congregant && m.status === MemberStatus.Disciplined).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-100 rounded p-3 border-t-2 border-purple-300">
                      <span className="text-sm font-semibold text-purple-900">Total</span>
                      <span className="text-xl font-bold text-purple-700">
                        {members.filter(m => m.memberType === MemberType.Congregant).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Baptism and Conversion Stats */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⛪</span>
                Estatísticas Eclesiásticas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <p className="text-sm text-gray-600">Membros Batizados</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter(m => m.baptismDate).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((members.filter(m => m.baptismDate).length / members.length) * 100).toFixed(1)}% do total
                  </p>
                </div>

                <div className="border-l-4 border-pink-500 pl-4">
                  <p className="text-sm text-gray-600">Com Data de Conversão</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter(m => m.conversionDate).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((members.filter(m => m.conversionDate).length / members.length) * 100).toFixed(1)}% do total
                  </p>
                </div>

                <div className="border-l-4 border-teal-500 pl-4">
                  <p className="text-sm text-gray-600">Em Ministérios</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter(m => m.ministries && m.ministries.length > 0).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((members.filter(m => m.ministries && m.ministries.length > 0).length / members.length) * 100).toFixed(1)}% do total
                  </p>
                </div>
              </div>
            </div>

            {/* Ministries Distribution */}
            {(() => {
              const ministryCounts: { [key: string]: number } = {};
              members.forEach(member => {
                if (member.ministries) {
                  member.ministries.forEach(ministry => {
                    ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
                  });
                }
              });
              const sortedMinistries = Object.entries(ministryCounts).sort((a, b) => b[1] - a[1]);

              return sortedMinistries.length > 0 ? (
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Distribuição por Ministérios
                  </h3>

                  <div className="space-y-3">
                    {sortedMinistries.map(([ministry, count]) => (
                      <div key={ministry} className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{ministry}</span>
                            <span className="text-sm text-gray-600">{count} membros</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${(count / members.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Recent Members */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🆕</span>
                Membros Cadastrados Recentemente
              </h3>

              <div className="space-y-3">
                {members
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                          {getStatusLabel(member.status)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Signature List Export */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">✍️</span>
                Listas de Assinatura
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Gere listas com espaço para assinatura dos membros, ideal para presenças, atas e documentos oficiais
              </p>

              {canManage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={exportSignatureListToPDF}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all"
                  >
                    📄 <span className="font-medium ml-2">Lista de Assinatura em PDF</span>
                  </button>

                  <button
                    onClick={exportSignatureListToWord}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
                  >
                    📝 <span className="font-medium ml-2">Lista de Assinatura em Word</span>
                  </button>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">📥</span>
                Exportar Dados Completos
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Exporte todos os dados dos membros em diferentes formatos para análise e backup
              </p>

              {canManage && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={exportToExcel}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-xl text-green-600 mr-2">📊</span>
                    Exportar Excel
                  </button>

                  <button
                    onClick={exportToPDF}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-xl text-red-600 mr-2">📄</span>
                    Exportar PDF
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-xl text-blue-600 mr-2">📋</span>
                    Exportar CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadMembers();
          loadStatistics();
        }}
      />

      {/* Edit Member Modal */}
      <CreateMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        onSuccess={() => {
          loadMembers();
          loadStatistics();
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />
    </div>
  );
};

export default MembersManagementPage;