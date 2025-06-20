import React from 'react';
import { Calendar, Users, UserCheck, FileText, Settings, Contact as FileContract, Image, MessageSquare, HelpCircle, Lightbulb, Newspaper } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'event-photos', label: 'Photos', icon: Image },
    { id: 'workshops', label: 'Ateliers', icon: Settings },
    { id: 'trainers', label: 'Formateurs', icon: Users },
    { id: 'contracts', label: 'Contrats', icon: FileContract },
    { id: 'registrations', label: 'Inscriptions', icon: UserCheck },
    { id: 'guidelines', label: 'Directives', icon: FileText },
    { id: 'initiatives', label: 'Initiatives', icon: Lightbulb },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'testimonials', label: 'Témoignages', icon: MessageSquare },
    { id: 'press-articles', label: 'Presse', icon: Newspaper },
    { id: 'media-highlights', label: 'Médias', icon: Newspaper },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
