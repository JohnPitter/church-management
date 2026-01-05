import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AgendamentoAssistenciaService, ProfissionalAssistenciaService } from '../../infrastructure/services/AssistenciaService';
import { AgendamentoAssistencia, StatusAgendamento } from '../../domain/entities/Assistencia';

export const ProfessionalDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<AgendamentoAssistencia[]>([]);
  const [isProfessional, setIsProfessional] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const agendamentoService = new AgendamentoAssistenciaService();
  const profissionalService = new ProfissionalAssistenciaService();

  useEffect(() => {
    loadAgendamentos();
  }, [currentUser]);

  const loadAgendamentos = async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      // Find the professional by email directly (more efficient)
      const profissional = await profissionalService.getProfissionalByEmail(currentUser.email);
      
      if (profissional) {
        setIsProfessional(true);
        // Get appointments for this specific professional
        const agendamentosProfissional = await agendamentoService.getAgendamentosByProfissional(profissional.id);
        setAgendamentos(agendamentosProfissional);
      } else {
        setIsProfessional(false);
        setAgendamentos([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: StatusAgendamento): string => {
    switch (status) {
      case StatusAgendamento.Agendado:
        return 'bg-blue-100 text-blue-800';
      case StatusAgendamento.Confirmado:
        return 'bg-green-100 text-green-800';
      case StatusAgendamento.EmAndamento:
        return 'bg-yellow-100 text-yellow-800';
      case StatusAgendamento.Concluido:
        return 'bg-gray-100 text-gray-800';
      case StatusAgendamento.Cancelado:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgendamentosForDate = (date: Date) => {
    return agendamentos.filter(a => {
      const agendamentoDate = new Date(a.dataHoraAgendamento);
      return agendamentoDate.toDateString() === date.toDateString();
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const quickActions = [
    {
      title: 'Minhas Assistências',
      description: 'Ver agendamentos e pacientes',
      href: '/professional/assistencias',
      color: 'bg-blue-500 hover:bg-blue-600',
      icon: '📋'
    },
    {
      title: 'Fichas de Acompanhamento',
      description: 'Gerenciar fichas dos pacientes',
      href: '/professional/fichas',
      color: 'bg-green-500 hover:bg-green-600',
      icon: '📁'
    },
    {
      title: 'Pedidos de Ajuda',
      description: 'Orientações entre profissionais',
      href: '/professional/help-requests',
      color: 'bg-purple-500 hover:bg-purple-600',
      icon: '🤝'
    }
  ];

  // Get today's appointments
  const todayAgendamentos = getAgendamentosForDate(new Date());
  const upcomingAgendamentos = agendamentos
    .filter(a => new Date(a.dataHoraAgendamento) > new Date())
    .sort((a, b) => new Date(a.dataHoraAgendamento).getTime() - new Date(b.dataHoraAgendamento).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (isProfessional === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-yellow-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👩‍⚕️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">
            Esta área é exclusiva para profissionais cadastrados no sistema.
          </p>
          <p className="text-sm text-gray-500">
            Se você é um profissional, entre em contato com o administrador para verificar seu cadastro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Profissional</h1>
              <p className="mt-1 text-sm text-gray-600">
                Bem-vindo, {currentUser?.displayName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xl">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hoje</p>
                <p className="text-2xl font-semibold text-gray-900">{todayAgendamentos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agendamentos.filter(a => a.status === StatusAgendamento.Confirmado).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xl">⏰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agendamentos.filter(a => a.status === StatusAgendamento.Agendado).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Mês</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agendamentos.filter(a => {
                    const date = new Date(a.dataHoraAgendamento);
                    return date.getMonth() === selectedDate.getMonth() && 
                           date.getFullYear() === selectedDate.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Calendário de Atendimentos
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      ←
                    </button>
                    <span className="font-medium">
                      {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(selectedDate).map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-24"></div>;
                    }
                    
                    const dayAgendamentos = getAgendamentosForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`h-24 border rounded-lg p-2 ${
                          isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                        } hover:bg-gray-50 cursor-pointer overflow-hidden`}
                      >
                        <div className="text-xs font-medium text-gray-900 mb-1">
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAgendamentos.slice(0, 2).map((agendamento, idx) => (
                            <div
                              key={agendamento.id}
                              className={`text-xs px-1 py-0.5 rounded ${getStatusColor(agendamento.status)}`}
                              title={`${formatTime(agendamento.dataHoraAgendamento)} - ${agendamento.pacienteNome}`}
                            >
                              <div className="truncate">
                                {formatTime(agendamento.dataHoraAgendamento)}
                              </div>
                            </div>
                          ))}
                          {dayAgendamentos.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayAgendamentos.length - 2} mais
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.title}
                      to={action.href}
                      className={`${action.color} text-white rounded-lg p-4 block hover:shadow-lg transition-all`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{action.icon}</span>
                        <div>
                          <h4 className="font-medium text-sm">{action.title}</h4>
                          <p className="text-xs opacity-90">{action.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Atendimentos de Hoje
                </h3>
              </div>
              <div className="p-6">
                {todayAgendamentos.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum atendimento para hoje</p>
                ) : (
                  <div className="space-y-3">
                    {todayAgendamentos.map(agendamento => (
                      <div key={agendamento.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {agendamento.pacienteNome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(agendamento.dataHoraAgendamento)}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Próximos Atendimentos
                </h3>
              </div>
              <div className="p-6">
                {upcomingAgendamentos.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum atendimento agendado</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAgendamentos.map(agendamento => (
                      <div key={agendamento.id} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {agendamento.pacienteNome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(agendamento.dataHoraAgendamento).toLocaleDateString('pt-BR')} às {formatTime(agendamento.dataHoraAgendamento)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agendamento.status)}`}>
                          {agendamento.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};