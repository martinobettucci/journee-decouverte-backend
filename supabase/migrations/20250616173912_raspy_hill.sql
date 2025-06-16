/*
  # Ajout du flag bénévole pour les contrats

  1. Nouvelles colonnes
    - `is_volunteer` dans `contract_templates` (booléen, défaut false)
    - `volunteer_attestation_accepted` dans `trainer_registrations` (booléen, défaut false)

  2. Sécurité
    - Pas de changements RLS nécessaires (hérite des politiques existantes)

  3. Notes
    - Quand `is_volunteer` est true, on demande une attestation au lieu de facture/RIB
    - Compatible avec les contrats existants (défaut false)
*/

-- Ajouter le flag bénévole aux modèles de contrat
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS is_volunteer boolean NOT NULL DEFAULT false;

-- Ajouter l'acceptation d'attestation de volontariat aux inscriptions
ALTER TABLE trainer_registrations 
ADD COLUMN IF NOT EXISTS volunteer_attestation_accepted boolean NOT NULL DEFAULT false;

-- Commentaire pour documentation
COMMENT ON COLUMN contract_templates.is_volunteer IS 'Indique si ce contrat est pour un formateur bénévole (attestation requise au lieu de facture/RIB)';
COMMENT ON COLUMN trainer_registrations.volunteer_attestation_accepted IS 'Indique si le formateur a accepté l''attestation de volontariat (pour contrats bénévoles uniquement)';