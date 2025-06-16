import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, Type, Users, Building, Eye, EyeOff, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MarkdownRenderer from '../common/MarkdownRenderer';
import type { ContractTemplate } from '../../types/database';

interface ContractFormProps {
  contract?: ContractTemplate | null;
  onClose: () => void;
  onSave: () => void;
}

const ContractForm: React.FC<ContractFormProps> = ({ contract, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    workshop_date: '',
    name: '',
    type: 'trainer' as 'trainer' | 'client',
    is_volunteer: false,
    content_markdown: ''
  });
  const [workshopDates, setWorkshopDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchWorkshopDates();
    if (contract) {
      setFormData({
        workshop_date: contract.workshop_date,
        name: contract.name,
        type: contract.type,
        is_volunteer: contract.is_volunteer || false,
        content_markdown: contract.content_markdown
      });
    }
  }, [contract]);

  const fetchWorkshopDates = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_passwords')
        .select('date')
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkshopDates(data?.map(w => w.date) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dates d\'ateliers:', error);
    }
  };

  const getPreviewContent = (content: string, type: 'trainer' | 'client'): string => {
    let previewContent = content;

    if (type === 'trainer') {
      // Replace trainer placeholders with dummy data
      previewContent = previewContent
        .replace(/\[NOM_ENTREPRISE\]/g, 'TechCorp Solutions')
        .replace(/\[FORME_JURIDIQUE\]/g, 'SARL')
        .replace(/\[CAPITAL_SOCIAL\]/g, '50 000')
        .replace(/\[RCS_VILLE\]/g, 'RCS Paris')
        .replace(/\[NUMERO_RCS\]/g, '123 456 789')
        .replace(/\[ADRESSE_SIEGE\]/g, '123 Avenue des Champs-Élysées, 75008 Paris')
        .replace(/\[NOM_REPRESENTANT\]/g, 'Marie Dubois')
        .replace(/\[FONCTION_REPRESENTANT\]/g, 'Directrice Générale')
        .replace(/\[NOM_ABREGE_ENTREPRISE\]/g, 'TechCorp')
        .replace(/\[EMAIL_REPRESENTANT\]/g, 'marie.dubois@techcorp.fr');
    } else {
      // Replace client placeholders with dummy data
      previewContent = previewContent
        .replace(/\[CLIENT_COMPANY_NAME\]/g, 'Innovation Labs')
        .replace(/\[CLIENT_REPRESENTATIVE_NAME\]/g, 'Jean Martin')
        .replace(/\[CLIENT_ADDRESS\]/g, '456 Rue de la Paix, 75009 Paris')
        .replace(/\[CLIENT_EMAIL\]/g, 'jean.martin@innovationlabs.fr')
        .replace(/\[CLIENT_COMPANY_REGISTRATION\]/g, 'SIRET 12345678901234')
        .replace(/\[SIGNATURE_CODE\]/g, 'CLIENT-ABC12345')
        .replace(/\[WORKSHOP_DATE\]/g, formData.workshop_date ? 
          new Date(formData.workshop_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Date d\'atelier à sélectionner'
        )
        .replace(/\[SIGNATURE_STATUS\]/g, 'En attente de signature');
    }

    // Common placeholders
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    previewContent = previewContent.replace(/\[DATE_DU_JOUR\]/g, currentDate);

    return previewContent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const contractData = {
        workshop_date: formData.workshop_date,
        name: formData.name,
        type: formData.type,
        is_volunteer: formData.is_volunteer,
        content_markdown: formData.content_markdown
      };

      if (contract) {
        const { error } = await supabase
          .from('contract_templates')
          .update(contractData)
          .eq('id', contract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contract_templates')
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

  const insertTrainerTemplate = () => {
    const template = `# CONTRAT DE PRESTATION DE SERVICES

## Animation et Encadrement d'un Hackathon IA

**Entre les soussignés :**

**P2ENJOY SAS**, société par actions simplifiée unipersonnelle au capital social de 5 000 €, immatriculée au RCS de Paris sous le n° 918 234 667, dont le siège social est situé 122 rue Amelot – 75011 Paris, représentée par **Martino BETTUCCI**, Président, dûment habilité (ci‑après « P2ENJOY » ou « le commanditaire »).

**ET**

**[NOM_ENTREPRISE]**, société **[FORME_JURIDIQUE]** au capital social de **[CAPITAL_SOCIAL]** €, immatriculée au **[RCS_VILLE]** sous le n° **[NUMERO_RCS]**, dont le siège social est situé **[ADRESSE_SIEGE]**, représentée par **[NOM_REPRESENTANT]**, **[FONCTION_REPRESENTANT]**, dûment habilité(e) (ci-après « [NOM_ABREGE_ENTREPRISE] » ou « le Prestataire »).

P2ENJOY et [NOM_ENTREPRISE] sont ci‑après désignées individuellement la « Partie » et collectivement les « Parties ».

---

## 1. Objet du Contrat

Le présent contrat a pour objet de définir les conditions dans lesquelles P2ENJOY fournit, pour le compte de son client, **des prestations d'animation et d'encadrement d'un hackathon pédagogique consacré à la créativité augmentée par l'intelligence artificielle (IA)**, ainsi que la mise à disposition temporaire d'outils logiciels et de ressources techniques (plateforme d'IA générative, puissance GPU).

---

## 2. Documents contractuels

La relation contractuelle est régie par les documents suivants, classés par ordre de priorité décroissante :

1. Le présent contrat ;
2. **Annexe 1 – Fiche Mission – Intervention Hackathon IA** ;
3. **Annexe 2 – Conditions financières et calendrier** ;
4. **Annexe 3 – Données à caractère personnel (RGPD)**.

En cas de contradiction, le document de rang supérieur prévaut.

---

## 13. Contacts opérationnels

* **Pour P2ENJOY** : Martino BETTUCCI – Président – martino@p2enjoy.studio
* **Pour [NOM_ENTREPRISE]** : [NOM_REPRESENTANT], [FONCTION_REPRESENTANT] – [EMAIL_REPRESENTANT]

---

## 14. Signatures

Fait à Paris, le [DATE_DU_JOUR] en deux exemplaires originaux.
À imprimer et renvoyer signé via la plateforme des intervenants.

---

**Placeholders disponibles :**
- [NOM_ENTREPRISE] : Nom de l'entreprise
- [FORME_JURIDIQUE] : Forme juridique (SARL, SAS, etc.)
- [CAPITAL_SOCIAL] : Capital social
- [RCS_VILLE] : RCS et ville
- [NUMERO_RCS] : Numéro RCS
- [ADRESSE_SIEGE] : Adresse du siège social
- [NOM_REPRESENTANT] : Nom du représentant légal
- [FONCTION_REPRESENTANT] : Fonction du représentant
- [NOM_ABREGE_ENTREPRISE] : Nom abrégé de l'entreprise
- [EMAIL_REPRESENTANT] : Email du représentant
- [DATE_DU_JOUR] : Date du jour (générée automatiquement)`;

    setFormData(prev => ({ ...prev, content_markdown: template }));
  };

  const insertVolunteerTemplate = () => {
    const template = `# CONVENTION DE VOLONTARIAT

## Animation et Encadrement d'un Hackathon IA

**Entre les soussignés :**

**P2ENJOY SAS**, société par actions simplifiée unipersonnelle au capital social de 5 000 €, immatriculée au RCS de Paris sous le n° 918 234 667, dont le siège social est situé 122 rue Amelot – 75011 Paris, représentée par **Martino BETTUCCI**, Président, dûment habilité (ci‑après « P2ENJOY » ou « l'organisateur »).

**ET**

**[NOM_REPRESENTANT]**, agissant en qualité de bénévole pour l'association ou l'organisation **[NOM_ENTREPRISE]**, domicilié(e) à **[ADRESSE_SIEGE]**, joignable à l'adresse **[EMAIL_REPRESENTANT]** (ci-après « le Volontaire »).

---

## 1. Objet de la Convention

La présente convention a pour objet de définir les conditions dans lesquelles le Volontaire intervient à titre bénévole pour **l'animation et l'encadrement d'un hackathon pédagogique consacré à l'intelligence artificielle**.

**Cette intervention est réalisée à titre gratuit et bénévole, sans contrepartie financière.**

---

## 2. Missions du Volontaire

Le Volontaire s'engage à :

1. **Animer les sessions** du hackathon selon le programme établi
2. **Encadrer les participants** dans leurs projets
3. **Partager son expertise** en intelligence artificielle
4. **Respecter les valeurs** de bienveillance et de partage

---

## 3. Engagements de l'Organisateur

P2ENJOY s'engage à :

1. **Fournir les outils** et ressources nécessaires
2. **Assurer la couverture** en cas d'accident lors de l'intervention
3. **Rembourser les frais** de transport sur justificatifs (si applicable)
4. **Délivrer une attestation** de participation bénévole

---

## 4. Durée et Modalités

- **Date d'intervention** : [DATE_DU_JOUR]
- **Durée** : Selon planning de l'atelier
- **Lieu** : À définir selon l'atelier

---

## 5. Attestation de Volontariat

Le Volontaire atteste par les présentes qu'il intervient de manière totalement bénévole, sans attendre de contrepartie financière, dans un esprit de partage et de transmission des connaissances.

---

## 6. Contacts

* **Pour P2ENJOY** : Martino BETTUCCI – martino@p2enjoy.studio
* **Pour le Volontaire** : [NOM_REPRESENTANT] – [EMAIL_REPRESENTANT]

---

Fait à Paris, le [DATE_DU_JOUR].

**Placeholders disponibles :**
- [NOM_ENTREPRISE] : Nom de l'organisation du volontaire
- [NOM_REPRESENTANT] : Nom du volontaire
- [ADRESSE_SIEGE] : Adresse du volontaire/organisation
- [EMAIL_REPRESENTANT] : Email du volontaire
- [DATE_DU_JOUR] : Date du jour (générée automatiquement)`;

    setFormData(prev => ({ ...prev, content_markdown: template }));
  };

  const insertClientTemplate = () => {
    const template = `# CONTRAT DE SERVICES - HACKATHON IA

## Prestations d'Animation et Formation

**Entre les soussignés :**

**P2ENJOY SAS**, société par actions simplifiée unipersonnelle au capital social de 5 000 €, immatriculée au RCS de Paris sous le n° 918 234 667, dont le siège social est situé 122 rue Amelot – 75011 Paris, représentée par **Martino BETTUCCI**, Président, dûment habilité (ci-après « P2ENJOY » ou « le prestataire »).

**ET**

**[CLIENT_COMPANY_NAME]**, immatriculée sous le **[CLIENT_COMPANY_REGISTRATION]**, représentée par **[CLIENT_REPRESENTATIVE_NAME]**, dont l'adresse est **[CLIENT_ADDRESS]**, joignable à l'adresse **[CLIENT_EMAIL]** (ci-après « le Client »).

---

## 1. Objet du Contrat

Le présent contrat a pour objet la fourniture par P2ENJOY de **prestations d'animation d'un hackathon pédagogique consacré à l'intelligence artificielle**, incluant l'encadrement technique, la mise à disposition d'outils logiciels et l'accompagnement des participants.

L'atelier se déroulera le **[WORKSHOP_DATE]**.

---

## 2. Obligations du Prestataire

P2ENJOY s'engage à :

1. **Fournir l'encadrement technique** nécessaire au bon déroulement de l'atelier
2. **Mettre à disposition les outils logiciels** d'intelligence artificielle générative
3. **Assurer la formation** des participants aux technologies utilisées
4. **Garantir l'accompagnement pédagogique** tout au long de la session

---

## 3. Obligations du Client

Le Client s'engage à :

1. **Fournir les locaux** adaptés et équipés
2. **Assurer la présence** des participants prévus
3. **Respecter les consignes** techniques et pédagogiques
4. **Faciliter l'accès** aux ressources nécessaires

---

## 4. Modalités de Signature

Le présent contrat devient effectif dès signature électronique par le Client à l'aide du code de signature suivant : **[SIGNATURE_CODE]**

**Statut actuel :** [SIGNATURE_STATUS]

---

## 5. Contacts

* **Pour P2ENJOY** : Martino BETTUCCI – martino@p2enjoy.studio
* **Pour le Client** : [CLIENT_REPRESENTATIVE_NAME] – [CLIENT_EMAIL]

---

## 6. Signature

Fait à Paris, le [DATE_DU_JOUR].

**Placeholders disponibles :**
- [CLIENT_COMPANY_NAME] : Nom de l'entreprise cliente
- [CLIENT_REPRESENTATIVE_NAME] : Nom du représentant client
- [CLIENT_ADDRESS] : Adresse du client
- [CLIENT_EMAIL] : Email du client
- [CLIENT_COMPANY_REGISTRATION] : Numéro d'immatriculation (SIRET/NDA)
- [SIGNATURE_CODE] : Code de signature unique
- [WORKSHOP_DATE] : Date de l'atelier
- [DATE_DU_JOUR] : Date du jour (générée automatiquement)
- [SIGNATURE_STATUS] : Statut de signature (automatique)`;

    setFormData(prev => ({ ...prev, content_markdown: template }));
  };

  const handleTypeChange = (newType: 'trainer' | 'client') => {
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      is_volunteer: false // Reset volunteer flag when changing type
    }));
    // Clear content when switching types
    if (formData.content_markdown && !contract) {
      setFormData(prev => ({ ...prev, content_markdown: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {contract ? 'Modifier le contrat' : 'Nouveau contrat'}
          </h2>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                disabled={!!contract}
              >
                <option value="">Sélectionner un atelier</option>
                {workshopDates.map(date => (
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
                <Type size={16} />
                <span>Nom du contrat *</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Contrat Formateur Principal"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Users size={16} />
                <span>Type de contrat *</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as 'trainer' | 'client')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!contract}
              >
                <option value="trainer">Contrat Formateur</option>
                <option value="client">Contrat Client</option>
              </select>
            </div>
          </div>

          {/* Volunteer flag - only for trainer contracts */}
          {formData.type === 'trainer' && (
            <div>
              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_volunteer}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_volunteer: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <div className="flex items-center space-x-2">
                  <Heart size={16} className="text-pink-600" />
                  <span className="text-sm text-gray-700">Contrat bénévole</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                Si activé, une attestation de volontariat sera demandée au lieu d'une facture et d'un RIB lors de l'inscription.
              </p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <FileText size={16} />
              <span>Contenu du contrat (Markdown) *</span>
            </label>
            <div className="flex items-center space-x-2">
              {/* Template Buttons */}
              {formData.type === 'trainer' ? (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={insertTrainerTemplate}
                    className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Users size={12} />
                    <span>Modèle Rémunéré</span>
                  </button>
                  <button
                    type="button"
                    onClick={insertVolunteerTemplate}
                    className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded transition-colors"
                  >
                    <Heart size={12} />
                    <span>Modèle Bénévole</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={insertClientTemplate}
                  className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                >
                  <Building size={12} />
                  <span>Modèle Client</span>
                </button>
              )}
              
              {/* Preview Toggle */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showPreview 
                    ? 'text-white bg-green-600 hover:bg-green-700' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showPreview ? 'Retour à l\'édition' : 'Prévisualiser'}</span>
              </button>
            </div>
          </div>

          {/* Editor or Preview */}
          {showPreview ? (
            /* Preview Mode */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="text-green-600" size={16} />
                  <span className="font-medium text-green-900">Mode Prévisualisation</span>
                </div>
                <p className="text-sm text-green-700">
                  Aperçu du contrat avec données fictives. Les placeholders sont remplacés par des exemples.
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                {formData.content_markdown ? (
                  <MarkdownRenderer 
                    content={getPreviewContent(formData.content_markdown, formData.type)}
                    style={{ fontSize: '14px' }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto mb-4" size={48} />
                    <p className="text-lg font-medium mb-2">Aucun contenu à prévisualiser</p>
                    <p className="text-sm">Retournez en mode édition pour saisir du contenu Markdown</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Editor Mode */
            <div className="space-y-4">
              <textarea
                required
                rows={28}
                value={formData.content_markdown}
                onChange={(e) => setFormData(prev => ({ ...prev, content_markdown: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="Rédigez le contrat en Markdown..."
              />
              <div className="text-xs text-gray-500">
                <p className="mb-1">
                  <strong>Placeholders {formData.type === 'trainer' ? 'Formateur' : 'Client'} :</strong>
                </p>
                {formData.type === 'trainer' ? (
                  <p>
                    [NOM_ENTREPRISE], [FORME_JURIDIQUE], [CAPITAL_SOCIAL], [RCS_VILLE], [NUMERO_RCS], 
                    [ADRESSE_SIEGE], [NOM_REPRESENTANT], [FONCTION_REPRESENTANT], [NOM_ABREGE_ENTREPRISE], 
                    [EMAIL_REPRESENTANT], [DATE_DU_JOUR]
                  </p>
                ) : (
                  <p>
                    [CLIENT_COMPANY_NAME], [CLIENT_REPRESENTATIVE_NAME], [CLIENT_ADDRESS], [CLIENT_EMAIL], 
                    [CLIENT_COMPANY_REGISTRATION], [SIGNATURE_CODE], [WORKSHOP_DATE], [DATE_DU_JOUR], [SIGNATURE_STATUS]
                  </p>
                )}
              </div>
            </div>
          )}

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

export default ContractForm;