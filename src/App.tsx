import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import ProfilePage from './components/auth/ProfilePage';
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

function AppContent() {
  const [activeTab, setActiveTab] = useState('events');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedWorkshopDate, setSelectedWorkshopDate] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [allWorkshopDates, setAllWorkshopDates] = useState<string[]>([]);

  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWorkshopDates();
    }
  }, [user]);

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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user || !profile) {
    return <LoginPage />;
  }

  // Show profile page if requested
  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  // Check if user has backoffice role
  if (profile.role !== 'backoffice') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <User className="text-red-600" size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette interface d'administration.
          </p>
          <button
            onClick={() => setShowProfile(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Voir mon profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administration - Événements & Ateliers
              </h1>
              <p className="mt-2 text-gray-600">
                Gestion centralisée des événements, ateliers, formateurs et inscriptions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Utilisateur'
                  }
                </p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={20} />
                <span className="hidden sm:inline">Profil</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;