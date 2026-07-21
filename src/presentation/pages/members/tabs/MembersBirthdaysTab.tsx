import React from 'react';
import { Member } from '@/domain/entities/Member';

interface MembersBirthdaysTabProps {
  birthdays: Member[];
  calculateAge: (birthDate: Date) => number;
}

export const MembersBirthdaysTab: React.FC<MembersBirthdaysTabProps> = ({
  birthdays,
  calculateAge,
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Aniversários deste Mês ({new Date().toLocaleString('pt-BR', { month: 'long' })})
      </h2>

      {birthdays.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum aniversário este mês.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {birthdays.map((member) => (
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
                    {new Date(member.birthDate).getDate()} de{' '}
                    {new Date(member.birthDate).toLocaleString('pt-BR', { month: 'long' })}
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
  );
};
