// Component - Events and Birthdays Calendar
// Interactive calendar showing church events and member birthdays

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { FirebaseEventRepository } from '@modules/church-management/events/infrastructure/repositories/FirebaseEventRepository';
import { FirebaseMemberRepository } from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository';
import { FirebaseONGRepository } from '@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository';
import { Event } from 'domain/entities/Event';
import { Member } from 'domain/entities/Member';
import { Voluntario } from '@modules/ong-management/settings/domain/entities/ONG';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'birthday' | 'volunteer-birthday';
  event?: Event;
  member?: Member;
  volunteer?: Voluntario;
}

interface EventsCalendarProps {
  className?: string;
}

export const EventsCalendar: React.FC<EventsCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [volunteers, setVolunteers] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const eventRepository = useMemo(() => new FirebaseEventRepository(), []);
  const memberRepository = useMemo(() => new FirebaseMemberRepository(), []);
  const ongRepository = useMemo(() => new FirebaseONGRepository(), []);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const currentMonth = currentDate.getMonth() + 1;

      const [eventsData, birthdayMembers, volunteerData] = await Promise.allSettled([
        eventRepository.findAll(),
        memberRepository.findBirthdays(currentMonth),
        ongRepository.getAllVoluntarios()
      ]);

      // Handle events result
      if (eventsData.status === 'fulfilled') {
        setEvents(eventsData.value);
      } else {
        console.warn('Could not load events:', eventsData.reason);
        setEvents([]);
      }

      // Handle birthdays result
      if (birthdayMembers.status === 'fulfilled') {
        setMembers(birthdayMembers.value);
      } else {
        console.warn('Could not load birthdays:', birthdayMembers.reason);
        setMembers([]);
      }

      // Handle volunteers result - silently fail if no permission
      if (volunteerData.status === 'fulfilled') {
        setVolunteers(volunteerData.value);
      } else {
        // Silently ignore permission errors for volunteers
        // Only log if it's not a permission error
        const error = volunteerData.reason;
        if (!error?.message?.includes('permiss') && !error?.message?.includes('Acesso negado')) {
          console.warn('Could not load volunteers:', volunteerData.reason);
        }
        setVolunteers([]);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setEvents([]);
      setMembers([]);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Add church events
    events.forEach(event => {
      if (isSameMonth(new Date(event.date), currentDate)) {
        allEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          date: new Date(event.date),
          type: 'event',
          event
        });
      }
    });

    // Add birthdays (members)
    members.forEach(member => {
      const birthDate = new Date(member.birthDate);
      const birthdayThisYear = new Date(currentDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());

      if (isSameMonth(birthdayThisYear, currentDate)) {
        allEvents.push({
          id: `birthday-${member.id}`,
          title: member.name,
          date: birthdayThisYear,
          type: 'birthday',
          member
        });
      }
    });

    // Add birthdays (volunteers)
    volunteers.forEach(volunteer => {
      const birthDate = new Date(volunteer.dataNascimento);
      const birthdayThisYear = new Date(currentDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());

      if (isSameMonth(birthdayThisYear, currentDate)) {
        allEvents.push({
          id: `volunteer-birthday-${volunteer.id}`,
          title: `${volunteer.nome} (Vol.)`,
          date: birthdayThisYear,
          type: 'volunteer-birthday',
          volunteer
        });
      }
    });

    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, members, volunteers, currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = addDays(monthStart, -getDay(monthStart));
  const endDate = addDays(monthEnd, 6 - getDay(monthEnd));
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, day));
  };

  const formatWhatsAppMessage = (member: Member) => {
    const age = calculateAge(member.birthDate);
    return encodeURIComponent(
      `🎉 Feliz Aniversário, ${member.name}! 🎂\n\n` +
      `Que Deus abençoe seus ${age} anos de vida com muita paz, alegria e realizações!\n\n` +
      `Com carinho da Igreja ❤️`
    );
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatEmailMessage = (member: Member) => {
    const age = calculateAge(member.birthDate);
    return {
      subject: encodeURIComponent(`🎉 Feliz Aniversário, ${member.name}!`),
      body: encodeURIComponent(
        `Querido(a) ${member.name},\n\n` +
        `É com grande alegria que celebramos seus ${age} anos de vida!\n\n` +
        `Que Deus continue abençoando sua caminhada com muita saúde, paz e felicidade. ` +
        `Você é uma pessoa especial em nossa comunidade de fé.\n\n` +
        `Desejamos que este novo ano de vida seja repleto de conquistas e ` +
        `que o Senhor realize todos os seus sonhos.\n\n` +
        `Parabéns e muitas felicidades!\n\n` +
        `Com carinho e orações,\n` +
        `Igreja`
      )
    };
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };


  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            📅 Eventos e Aniversários
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h4 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h4>
            <button
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        {/* Empty state for no data */}
        {!loading && events.length === 0 && members.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📅</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento ou aniversário</h4>
            <p className="text-sm text-gray-600">
              Não há eventos ou aniversários cadastrados para este mês ({format(currentDate, 'MMMM yyyy', { locale: ptBR })}).
            </p>
          </div>
        )}

        {/* Show calendar only if we have data or are still loading */}
        {(loading || events.length > 0 || members.length > 0) && (
          <>
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">📅</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Eventos</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">🎂</span>
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">Aniversários</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">🎂</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Voluntários</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {dateRange.map(day => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-1 border rounded-lg ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'text-indigo-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`text-xs px-1 py-0.5 rounded cursor-pointer ${
                            event.type === 'event'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : event.type === 'volunteer-birthday'
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
                          }`}
                          title={event.type === 'event' && event.event ? `${event.title} - ${event.event.time}` : event.title}
                        >
                          <div className="truncate">
                            {event.type === 'event' ? '📅' : '🎂'} {event.title.length > 10 ? event.title.substring(0, 10) + '...' : event.title}
                          </div>
                          {event.type === 'event' && event.event && (
                            <div className="text-[10px] font-semibold">⏰ {event.event.time}</div>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEvent.type === 'event' ? '📅 Evento' : selectedEvent.type === 'volunteer-birthday' ? '🎂 Aniversário (Voluntário)' : '🎂 Aniversário'}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-600">
                  {format(selectedEvent.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {selectedEvent.type === 'event' && selectedEvent.event && (
                <div className="space-y-3">
                  {selectedEvent.event.time && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">⏰ Horário:</span> {selectedEvent.event.time}
                    </p>
                  )}
                  {selectedEvent.event.description && (
                    <p className="text-sm text-gray-700">{selectedEvent.event.description}</p>
                  )}
                  {selectedEvent.event.location && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">📍 Local:</span> {selectedEvent.event.location}
                    </p>
                  )}
                  <div className="flex justify-center">
                    <Link
                      to="/events"
                      onClick={() => setSelectedEvent(null)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Ver Todos os Eventos
                    </Link>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'birthday' && selectedEvent.member && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Idade:</span> {calculateAge(selectedEvent.member.birthDate)} anos
                  </p>
                  {selectedEvent.member.email && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Email:</span> {selectedEvent.member.email}
                    </p>
                  )}
                  {selectedEvent.member.phone && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Telefone:</span> {selectedEvent.member.phone}
                    </p>
                  )}
                  
                  <div className="flex space-x-2">
                    {selectedEvent.member.phone && (
                      <a
                        href={`https://wa.me/55${selectedEvent.member.phone.replace(/\D/g, '')}?text=${formatWhatsAppMessage(selectedEvent.member)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-center text-sm"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {selectedEvent.member.email && (
                      <a
                        href={`mailto:${selectedEvent.member.email}?subject=${formatEmailMessage(selectedEvent.member).subject}&body=${formatEmailMessage(selectedEvent.member).body}`}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-center text-sm"
                      >
                        📧 Email
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedEvent.type === 'volunteer-birthday' && selectedEvent.volunteer && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Idade:</span> {calculateAge(selectedEvent.volunteer.dataNascimento)} anos
                  </p>
                  {selectedEvent.volunteer.email && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Email:</span> {selectedEvent.volunteer.email}
                    </p>
                  )}
                  {selectedEvent.volunteer.telefone && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Telefone:</span> {selectedEvent.volunteer.telefone}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    {selectedEvent.volunteer.telefone && (
                      <a
                        href={`https://wa.me/55${selectedEvent.volunteer.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`🎉 Feliz Aniversário, ${selectedEvent.volunteer.nome}! 🎂\n\nQue Deus abençoe seus ${calculateAge(selectedEvent.volunteer.dataNascimento)} anos de vida com muita paz, alegria e realizações!\n\nCom carinho da Igreja ❤️`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-center text-sm"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {selectedEvent.volunteer.email && (
                      <a
                        href={`mailto:${selectedEvent.volunteer.email}?subject=${encodeURIComponent(`🎉 Feliz Aniversário, ${selectedEvent.volunteer.nome}!`)}&body=${encodeURIComponent(`Querido(a) ${selectedEvent.volunteer.nome},\n\nÉ com grande alegria que celebramos seus ${calculateAge(selectedEvent.volunteer.dataNascimento)} anos de vida!\n\nQue Deus continue abençoando sua caminhada com muita saúde, paz e felicidade. Você é uma pessoa especial em nossa comunidade de fé.\n\nDesejamos que este novo ano de vida seja repleto de conquistas e que o Senhor realize todos os seus sonhos.\n\nParabéns e muitas felicidades!\n\nCom carinho e orações,\nIgreja`)}`}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-center text-sm"
                      >
                        📧 Email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EventsCalendar;
