import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import MarkdownRenderer from './MarkdownRenderer';
import type { ClientContract, ContractTemplate } from '../../types/database';

interface ClientContractViewerModalProps {
  clientContract: ClientContract;
  onClose: () => void;
}

const ClientContractViewerModal: React.FC<ClientContractViewerModalProps> = ({
  clientContract,
  onClose
}) => {
  const [contractTemplate, setContractTemplate] = useState<ContractTemplate | null>(null);
  const [generatedContract, setGeneratedContract] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchContractTemplate();
  }, [clientContract]);

  const fetchContractTemplate = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: templateData, error: templateError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', clientContract.contract_template_id)
        .single();

      if (templateError || !templateData) {
        throw new Error('Modèle de contrat non trouvé');
      }

      setContractTemplate(templateData);
      generateContract(templateData.content_markdown);
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

    // Replace placeholders with actual client data
    let contract = templateContent;

    // Client information placeholders
    contract = contract.replace(/\[CLIENT_COMPANY_NAME\]/g, clientContract.client_company_name);
    contract = contract.replace(/\[CLIENT_REPRESENTATIVE_NAME\]/g, clientContract.client_representative_name);
    contract = contract.replace(/\[CLIENT_ADDRESS\]/g, clientContract.client_address);
    contract = contract.replace(/\[CLIENT_EMAIL\]/g, clientContract.client_email);
    contract = contract.replace(/\[CLIENT_COMPANY_REGISTRATION\]/g, clientContract.client_company_registration || '');
    contract = contract.replace(/\[SIGNATURE_CODE\]/g, clientContract.signature_code);

    // Workshop date
    const workshopDate = new Date(clientContract.workshop_date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    contract = contract.replace(/\[WORKSHOP_DATE\]/g, workshopDate);

    // Current date
    contract = contract.replace(/\[DATE_DU_JOUR\]/g, currentDate);

    // Contract status
    if (clientContract.is_signed && clientContract.signed_at) {
      const signedDate = new Date(clientContract.signed_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      contract = contract.replace(/\[SIGNATURE_STATUS\]/g, `Signé le ${signedDate}`);
    } else {
      contract = contract.replace(/\[SIGNATURE_STATUS\]/g, 'En attente de signature');
    }

    setGeneratedContract(contract);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrat Client - ${clientContract.client_company_name}</title>
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
            .status-box {
              background-color: ${clientContract.is_signed ? '#f0f9ff' : '#fef3c7'};
              border: 1px solid ${clientContract.is_signed ? '#0284c7' : '#f59e0b'};
              padding: 1em;
              margin: 2em 0;
              border-radius: 0.5em;
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
          <div class="status-box">
            <strong>Statut:</strong> ${clientContract.is_signed ? 'Contrat signé' : 'En attente de signature'}<br>
            <strong>Code de signature:</strong> ${clientContract.signature_code}
          </div>
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
            <span>Génération du contrat client...</span>
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
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Contrat Client
              </h2>
              <p className="text-sm text-gray-600">
                {clientContract.client_company_name} - {clientContract.signature_code}
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
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className={`p-4 rounded-lg mb-6 border ${
                clientContract.is_signed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Statut: {clientContract.is_signed ? 'Contrat signé' : 'En attente de signature'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Code de signature: <code className="bg-white px-2 py-1 rounded">{clientContract.signature_code}</code>
                    </p>
                    {clientContract.client_company_registration && (
                      <p className="text-sm text-gray-600">
                        Immatriculation: <code className="bg-white px-2 py-1 rounded">{clientContract.client_company_registration}</code>
                      </p>
                    )}
                  </div>
                  {clientContract.is_signed && clientContract.signed_at && (
                    <div className="text-sm text-gray-600">
                      Signé le {format(new Date(clientContract.signed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  )}
                </div>
              </div>

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

export default ClientContractViewerModal;