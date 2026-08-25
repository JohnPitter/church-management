import React from 'react';
import {
  PEDAGOGY_ORGANIZATION_LABELS,
  PedagogyOrganization
} from '@modules/pedagogy/domain/entities/Pedagogy';

interface PedagogyOrgSwitchProps {
  value: PedagogyOrganization;
  onChange: (value: PedagogyOrganization) => void;
}

const PedagogyOrgSwitch: React.FC<PedagogyOrgSwitchProps> = ({ value, onChange }) => (
  <div
    className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
    role="group"
    aria-label="Contexto pedagógico"
  >
    {Object.values(PedagogyOrganization).map(organization => (
      <button
        key={organization}
        type="button"
        onClick={() => onChange(organization)}
        className={`px-4 py-1.5 text-sm font-medium rounded-md ${
          value === organization
            ? 'bg-white text-sky-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {PEDAGOGY_ORGANIZATION_LABELS[organization]}
      </button>
    ))}
  </div>
);

export default PedagogyOrgSwitch;
