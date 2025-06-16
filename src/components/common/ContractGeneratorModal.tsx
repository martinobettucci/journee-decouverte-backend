import React, { useState, useEffect } from 'react';
import { X, Printer, Contact as FileContract, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import MarkdownRenderer from './MarkdownRenderer';
import type { TrainerRegistration, ContractTemplate } from '../../types/database';

interface ContractGeneratorModalProps {
  registration: TrainerRegistration;
  onClose: () => void;
}

const ContractGeneratorModal: React.FC<ContractGeneratorModalProps> = ({
  registration,
  onClose
}) => {
  const [contractTemplate, setContractTemplate] = useState<ContractTemplate | null>(null);
  const [generatedContract, setGeneratedContract] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchContractTemplate();
  }, [registration]);

  const fetchContractTemplate = async () => {
    try {
      setLoading(true);
      setError('');

      // First, find the trainer by trainer_code
      const { data: trainerData, error: trainerError } = await supabase
        .from('workshop_trainers')
        .select('id')
        .eq('trainer_code', registration.trainer_code)
        .single();

      if (trainerError || !trainerData) {
        throw new Error('Formateur non trouvé');
      }

      // Then, find the contract assignment for this trainer
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('contract_assignments')
        .select(`
          contract_templates (
            id,
            name,
            content_markdown,
            workshop_date,
            created_at
          )
        `)
        .eq('trainer_id', trainerData.id)
        .single();

      if (assignmentError || !assignmentData) {
        throw new Error('Aucun contrat assigné à ce formateur');
      }

      const template = assignmentData.contract_templates as ContractTemplate;
      setContractTemplate(template);
      generateContract(template.content_markdown);
    } catch (error: any) {
      console.error('Error fetching contract template:', error);
      setError(error.message || 'Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const generateContract = (templateContent: string) => {
    // Get current date in French format
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Replace placeholders with actual data
    let contract = templateContent;

    // Company information
    if (registration.company_name) {
      contract = contract.replace(/\[NOM_ENTREPRISE\]/g, registration.company_name);
    }
    if (registration.company_legal_form) {
      contract = contract.replace(/\[FORME_JURIDIQUE\]/g, registration.company_legal_form);
    }
    if (registration.company_capital) {
      contract = contract.replace(/\[CAPITAL_SOCIAL\]/g, registration.company_capital);
    }
    if (registration.company_rcs) {
      contract = contract.replace(/\[RCS_VILLE\]/g, registration.company_rcs);
    }
    if (registration.company_rcs_number) {
      contract = contract.replace(/\[NUMERO_RCS\]/g, registration.company_rcs_number);
    }
    if (registration.company_address) {
      contract = contract.replace(/\[ADRESSE_SIEGE\]/g, registration.company_address);
    }
    if (registration.company_short_name) {
      contract = contract.replace(/\[NOM_ABREGE_ENTREPRISE\]/g, registration.company_short_name);
    }

    // Representative information
    if (registration.representative_name) {
      contract = contract.replace(/\[NOM_REPRESENTANT\]/g, registration.representative_name);
    }
    if (registration.representative_function) {
      contract = contract.replace(/\[FONCTION_REPRESENTANT\]/g, registration.representative_function);
    }
    if (registration.representative_email) {
      contract = contract.replace(/\[EMAIL_REPRESENTANT\]/g, registration.representative_email);
    }

    // Current date
    contract = contract.replace(/\[DATE_DU_JOUR\]/g, currentDate);

    setGeneratedContract(contract);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrat - ${registration.first_name} ${registration.last_name}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              margin: 2cm;
              font-size: 12pt;
            }
            h1 {
              text-align: center;
              font-size: 18pt;
              margin-bottom: 2em;
            }
            h2 {
              font-size: 14pt;
              margin-top: 2em;
              margin-bottom: 1em;
            }
            h3 {
              font-size: 13pt;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            p {
              margin-bottom: 1em;
              text-align: justify;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              border: 2px solid #000;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              border-bottom: 2px solid #000;
            }
            ul, ol {
              margin: 1em 0;
              padding-left: 2em;
            }
            li {
              margin-bottom: 0.5em;
            }
            strong {
              font-weight: bold;
            }
            em {
              font-style: italic;
            }
            hr {
              border: none;
              border-top: 2px solid #000;
              margin: 2em 0;
            }
            blockquote {
              margin: 1em 0;
              padding: 0 2em;
              border-left: 3px solid #ddd;
              color: #666;
            }
            code {
              background-color: #f5f5f5;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
            }
            pre {
              background-color: #f5f5f5;
              padding: 1em;
              border-radius: 3px;
              overflow-x: auto;
              font-family: 'Courier New', monospace;
            }
            @media print {
              body {
                margin: 1.5cm;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div id="markdown-content"></div>
          <script type="module">
            import { marked } from 'https://cdn.jsdelivr.net/npm/marked@9.1.0/lib/marked.esm.js';
            import { gfmHeadingId } from 'https://cdn.jsdelivr.net/npm/marked-gfm-heading-id@3.1.0/lib/index.esm.js';
            import { markedHighlight } from 'https://cdn.jsdelivr.net/npm/marked-highlight@2.0.6/lib/index.esm.js';
            
            marked.use({ gfm: true });
            
            const markdownContent = \`${generatedContract.replace(/`/g, '\\`')}\`;
            document.getElementById('markdown-content').innerHTML = marked.parse(markdownContent);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Génération du contrat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileContract className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Contrat généré
              </h2>
              <p className="text-sm text-gray-600">
                {registration.first_name} {registration.last_name} - {registration.trainer_code}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!error && (
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Printer size={16} />
                <span>Imprimer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Impossible de générer le contrat
                </h3>
                <p className="text-gray-600">{error}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vérifiez qu'un contrat a été assigné à ce formateur dans l'onglet "Contrats".
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <MarkdownRenderer content={generatedContract} />
              
              {contractTemplate && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      Basé sur le template: {contractTemplate.name}
                    </span>
                    <span>
                      Généré le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractGeneratorModal;