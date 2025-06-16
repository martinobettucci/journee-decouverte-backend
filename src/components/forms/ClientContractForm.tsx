import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, Building, User, MapPin, Mail, Key, FileSignature, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ClientContract, ContractTemplate } from '../../types/database';

interface ClientContractFormProps {
  clientContract?: ClientContract | null;
  onClose: () => void;
  onSave: () => void;
}

const ClientContractForm: React.FC<ClientContractFormProps> = ({ clientContract, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    workshop_date: '',
    contract_template_id: '',
    client_company_name: '',
    client_representative_name: '',
    client_address: '',
    client_email: '',
    client_company_registration: '',
    signature_code: '',
    is_signed: false
  });
  const [availableWorkshops, setAvailableWorkshops] = useState<string[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableWorkshops();
    fetchContractTemplates();
    if (clientContract) {
      setFormData({
        workshop_date: clientContract.workshop_date,
        contract_template_id: clientContract.contract_template_id,
        client_company_name: clientContract.client_company_name,
        client_representative_name: clientContract.client_representative_name,
        client_address: clientContract.client_address,
        client_email: clientContract.client_email,
        client_company_registration: clientContract.client_company_registration || '',
        signature_code: clientContract.signature_code,
        is_signed: clientContract.is_signed
      });
    }
  }, [clientContract]);

  const fetchAvailableWorkshops = async () => {
    try {
      // Get all workshop dates
      const { data: workshops, error: workshopsError } = await supabase
        .from('workshop_passwords')
        .select('date')
        .order('date', { ascending: false });

      if (workshopsError) throw workshopsError;

      if (clientContract) {
        // If editing, include the current workshop date
        setAvailableWorkshops(workshops?.map(w => w.date) || []);
      } else {
        // If creating new, only show workshops without existing client contracts
        const { data: existingContracts, error: contractsError } = await supabase
          .from('client_contracts')
          .select('workshop_date');

        if (contractsError) throw contractsError;

        const usedDates = existingContracts?.map(c => c.workshop_date) || [];
        const availableDates = workshops?.filter(w => !usedDates.includes(w.date)).map(w => w.date) || [];
        setAvailableWorkshops(availableDates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ateliers disponibles:', error);
    }
  };

  const fetchContractTemplates = async () => {
    try {
      // Only fetch client contract templates
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('type', 'client')
        .order('workshop_date', { ascending: false });

      if (error) throw error;
      setContractTemplates(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des modèles de contrat client:', error);
    }
  };

  const generateSignatureCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CLIENT-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, signature_code: code }));
  };

  const formatRegistrationInput = (value: string) => {
    // Remove any existing prefix and non-alphanumeric characters except spaces
    let cleanValue = value.replace(/^(SIRET|NDA)\s*/i, '').replace(/[^\w\s]/g, '');
    
    // Check if it looks like a SIRET (14 digits)
    const digitsOnly = cleanValue.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length <= 14 && /^\d+$/.test(digitsOnly)) {
      return `SIRET ${digitsOnly}`;
    }
    
    // Otherwise treat as NDA
    if (cleanValue.trim()) {
      return `NDA ${cleanValue.trim()}`;
    }
    
    return '';
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRegistrationInput(e.target.value);
    setFormData(prev => ({ ...prev, client_company_registration: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const contractData = {
        workshop_date: formData.workshop_date,
        contract_template_id: formData.contract_template_id,
        client_company_name: formData.client_company_name,
        client_representative_name: formData.client_representative_name,
        client_address: formData.client_address,
        client_email: formData.client_email,
        client_company_registration: formData.client_company_registration,
        signature_code: formData.signature_code,
        is_signed: formData.is_signed,
        signed_at: formData.is_signed ? new Date().toISOString() : null
      };

      if (clientContract) {
        const { error } = await supabase
          .from('client_contracts')
          .update(contractData)
          .eq('id', clientContract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_contracts')
          .insert([contractData]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileSignature className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              {clientContract ? 'Modifier le contrat client' : 'Nouveau contrat client'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                <span>Atelier *</span>
              </label>
              <select
                required
                value={formData.workshop_date}
                onChange={(e) => setFormData(prev => ({ ...prev, workshop_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!clientContract}
              >
                <option value="">Sélectionner un atelier</option>
                {availableWorkshops.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} />
                <span>Modèle de contrat client *</span>
              </label>
              <select
                required
                value={formData.contract_template_id}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_template_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un modèle client</option>
                {contractTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} (Client)
                  </option>
                ))}
              </select>
              {contractTemplates.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Aucun modèle de contrat client disponible. Créez-en un dans l'onglet "Contrats".
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Building size={16} />
                <span>Nom de l'entreprise client *</span>
              </label>
              <input
                type="text"
                required
                value={formData.client_company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_company_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Entreprise ABC"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} />
                <span>Représentant client *</span>
              </label>
              <input
                type="text"
                required
                value={formData.client_representative_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_representative_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Jean Dupont"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <CreditCard size={16} />
              <span>Numéro d'immatriculation *</span>
            </label>
            <input
              type="text"
              required
              value={formData.client_company_registration}
              onChange={handleRegistrationChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Ex: 12345678901234 (SIRET) ou ABC123 (NDA)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Saisissez le numéro SIRET (14 chiffres) ou NDA. Le format sera automatiquement appliqué.
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} />
              <span>Adresse client *</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.client_address}
              onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Adresse complète de l'entreprise client"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              <span>Email client *</span>
            </label>
            <input
              type="email"
              required
              value={formData.client_email}
              onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@entreprise.com"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Key size={16} />
              <span>Code de signature *</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.signature_code}
                onChange={(e) => setFormData(prev => ({ ...prev, signature_code: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="Code unique pour signature"
              />
              <button
                type="button"
                onClick={generateSignatureCode}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Générer
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ce code sera envoyé au client pour signer le contrat
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_signed}
                onChange={(e) => setFormData(prev => ({ ...prev, is_signed: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <FileSignature size={16} className="text-gray-600" />
                <span className="text-sm text-gray-700">Contrat signé par le client</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientContractForm;