import React from 'react';
import { Calendar, Users, UserCheck, FileText, Settings, Contact as FileContract, Image, MessageSquare, HelpCircle, Lightbulb, Newspaper, Handshake, Globe, GraduationCap } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const p2enjoyTabs = [
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'event-photos', label: 'Photos', icon: Image },
    { id: 'initiatives', label: 'Initiatives', icon: Lightbulb },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'testimonials', label: 'Témoignages', icon: MessageSquare },
    { id: 'press-articles', label: 'Presse', icon: Newspaper },
    { id: 'partners', label: 'Partenaires', icon: Handshake },
    { id: 'media-highlights', label: 'Médias', icon: Newspaper },
  ];

  const journeesDecouverteTabs = [
    { id: 'workshops', label: 'Ateliers', icon: Settings },
    { id: 'trainers', label: 'Formateurs', icon: Users },
    { id: 'contracts', label: 'Contrats', icon: FileContract },
    { id: 'registrations', label: 'Inscriptions', icon: UserCheck },
    { id: 'guidelines', label: 'Directives', icon: FileText },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Navigation</h2>
        
        {/* P2Enjoy Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="text-blue-600" size={20} />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Site P2Enjoy
            </h3>
          </div>
          <nav className="space-y-1">
            {p2enjoyTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Journées Découverte Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className="text-green-600" size={20} />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Journées Découverte
            </h3>
          </div>
          <nav className="space-y-1">
            {journeesDecouverteTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;