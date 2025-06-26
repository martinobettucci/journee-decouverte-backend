/*
  # Prevent modifications of accepted contract templates

  1. Function
    - check_contract_modifiable() raises an exception if a trainer has accepted a contract linked to the template
  2. Trigger
    - Before UPDATE or DELETE on contract_templates execute check_contract_modifiable()
*/

CREATE OR REPLACE FUNCTION check_contract_modifiable()
RETURNS TRIGGER AS $$
DECLARE
  accepted_count int;
BEGIN
  SELECT COUNT(*) INTO accepted_count
  FROM contract_assignments ca
  JOIN workshop_trainers wt ON wt.id = ca.trainer_id
  JOIN trainer_registrations tr
    ON tr.workshop_date = wt.workshop_date
   AND tr.trainer_code = wt.trainer_code
  WHERE ca.contract_template_id = OLD.id
    AND tr.contract_accepted = true;

  IF accepted_count > 0 THEN
    RAISE EXCEPTION 'Contract template cannot be modified or deleted because a trainer has accepted it';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_contract_modifiable ON contract_templates;
CREATE TRIGGER trg_check_contract_modifiable
BEFORE UPDATE OR DELETE ON contract_templates
FOR EACH ROW EXECUTE FUNCTION check_contract_modifiable();
