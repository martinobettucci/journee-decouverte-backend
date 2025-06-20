import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import EventsTab from './components/EventsTab';
import EventPhotosTab from './components/EventPhotosTab';
import WorkshopsTab from './components/WorkshopsTab';
import TrainersTab from './components/TrainersTab';
import ContractsTab from './components/ContractsTab';
import RegistrationsTab from './components/RegistrationsTab';
import GuidelinesTab from './components/GuidelinesTab';
import TestimonialsTab from './components/TestimonialsTab';
import InitiativesTab from './components/InitiativesTab';
import FaqsTab from './components/FaqsTab';
import MediaHighlightsTab from './components/MediaHighlightsTab';
import PressArticlesTab from './components/PressArticlesTab';
import PartnersTab from './components/PartnersTab';
import { supabase } from './lib/supabase';

function App() {
  const [activeTab, setActiveTab] = useState('events');
  const [selectedWorkshopDate, setSelectedWorkshopDate] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [allWorkshopDates, setAllWorkshopDates] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkshopDates();
  }, []);

  const fetchWorkshopDates = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_passwords')
        .select('date')
        .order('date', { ascending: false });

      if (error) throw error;
      setAllWorkshopDates(data?.map(w => w.date) || []);
    } catch (error) {
      console.error('Error fetching workshop dates:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear the filter when manually changing tabs
    setSelectedWorkshopDate(null);
    setSelectedEventId(null);
  };

  const handleNavigateWithFilter = (tab: string, workshopDate?: string) => {
    setActiveTab(tab);
    setSelectedWorkshopDate(workshopDate || null);
  };

  const handleNavigateToPhotos = (eventId?: string) => {
    setActiveTab('event-photos');
    setSelectedEventId(eventId || null);
  };

  const handleFilterChange = (date: string | null) => {
    setSelectedWorkshopDate(date);
  };

  const handleEventFilterChange = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'events':
        return <EventsTab onManagePhotos={handleNavigateToPhotos} />;
      case 'event-photos':
        return (
          <EventPhotosTab
            initialFilterEventId={selectedEventId}
            onFilterChange={handleEventFilterChange}
          />
        );
      case 'workshops':
        return (
          <WorkshopsTab
            onNavigateWithFilter={handleNavigateWithFilter}
          />
        );
      case 'trainers':
        return (
          <TrainersTab 
            initialFilterDate={selectedWorkshopDate}
            allWorkshopDates={allWorkshopDates}
            onFilterChange={handleFilterChange}
          />
        );
      case 'contracts':
        return (
          <ContractsTab 
            initialFilterDate={selectedWorkshopDate}
            allWorkshopDates={allWorkshopDates}
            onFilterChange={handleFilterChange}
          />
        );
      case 'registrations':
        return (
          <RegistrationsTab 
            initialFilterDate={selectedWorkshopDate}
            allWorkshopDates={allWorkshopDates}
            onFilterChange={handleFilterChange}
          />
        );
      case 'guidelines':
        return (
          <GuidelinesTab
            initialFilterDate={selectedWorkshopDate}
            allWorkshopDates={allWorkshopDates}
            onFilterChange={handleFilterChange}
          />
        );
      case 'initiatives':
        return <InitiativesTab />;
      case 'faqs':
        return <FaqsTab />;
      case 'testimonials':
        return <TestimonialsTab />;
      case 'press-articles':
        return <PressArticlesTab />;
      case 'partners':
        return <PartnersTab />;
      case 'media-highlights':
        return <MediaHighlightsTab />;
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

      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;