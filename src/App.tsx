import React, { useState } from 'react';
import Navigation from './components/Navigation';
import EventsTab from './components/EventsTab';
import WorkshopsTab from './components/WorkshopsTab';
import TrainersTab from './components/TrainersTab';
import ContractsTab from './components/ContractsTab';
import RegistrationsTab from './components/RegistrationsTab';
import GuidelinesTab from './components/GuidelinesTab';

function App() {
  const [activeTab, setActiveTab] = useState('events');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'events':
        return <EventsTab />;
      case 'workshops':
        return <WorkshopsTab />;
      case 'trainers':
        return <TrainersTab />;
      case 'contracts':
        return <ContractsTab />;
      case 'registrations':
        return <RegistrationsTab />;
      case 'guidelines':
        return <GuidelinesTab />;
      default:
        return <EventsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Administration - Événements & Ateliers
          </h1>
          <p className="mt-2 text-gray-600">
            Gestion centralisée des événements, ateliers, formateurs et inscriptions
          </p>
        </div>
      </header>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;