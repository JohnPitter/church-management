// Presentation Component - Department Actions Menu
// Dropdown menu for department actions (edit, deactivate, etc.)

import React, { useState, useRef, useEffect } from 'react';
import { Department } from '@modules/church-management/departments/domain/entities/Department';

interface DepartmentActionsMenuProps {
  department: Department;
  onEdit: (department: Department) => void;
  onToggleActive: (department: Department) => void;
}

export const DepartmentActionsMenu: React.FC<DepartmentActionsMenuProps> = ({
  department,
  onEdit,
  onToggleActive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(department);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              role="menuitem"
            >
              <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Departamento
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(
                  department.isActive
                    ? `Deseja desativar o departamento "${department.name}"?\n\nO departamento será ocultado mas seus dados serão preservados.`
                    : `Deseja reativar o departamento "${department.name}"?`
                )) {
                  onToggleActive(department);
                }
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              role="menuitem"
            >
              {department.isActive ? (
                <>
                  <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Desativar Departamento
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reativar Departamento
                </>
              )}
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            <div className="px-4 py-2">
              <p className="text-xs text-gray-500">
                Saldo inicial: {department.initialBalance ? `R$ ${department.initialBalance.toFixed(2)}` : 'R$ 0,00'}
              </p>
              {department.responsibleName && (
                <p className="text-xs text-gray-500 mt-1">
                  Responsável: {department.responsibleName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
