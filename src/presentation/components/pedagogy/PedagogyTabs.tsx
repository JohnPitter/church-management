import React, { KeyboardEvent } from 'react';
import './PedagogyTabs.css';

interface Props<T extends string> {
  tabs: Array<{ id: T; label: string }>;
  activeTab: T;
  onChange: (tab: T) => void;
  panelId: string;
}

export default function PedagogyTabs<T extends string>({ tabs, activeTab, onChange, panelId }: Props<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const positions: Record<string, number> = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0, End: tabs.length - 1
    };
    const next = positions[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(tabs[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
  return <div className="overflow-x-auto border-b border-gray-200">
    <div role="tablist" aria-label="Seções pedagógicas" className="pedagogy-tabs">
      {tabs.map((item, index) => <button key={item.id} type="button" role="tab"
        id={`${panelId}-tab-${item.id}`} aria-controls={panelId} aria-selected={activeTab === item.id}
        tabIndex={activeTab === item.id ? 0 : -1} className="pedagogy-tab"
        onClick={() => onChange(item.id)} onKeyDown={event => handleKeyDown(event, index)}>
        {item.label}
      </button>)}
    </div>
  </div>;
}
