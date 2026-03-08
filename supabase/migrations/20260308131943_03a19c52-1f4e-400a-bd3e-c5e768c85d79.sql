
-- Remove the foreign key constraint since we use both static mock properties and DB properties
ALTER TABLE public.property_transactions DROP CONSTRAINT IF EXISTS property_transactions_property_id_fkey;
-- Change property_id to text to support both mock numeric IDs and UUIDs
ALTER TABLE public.property_transactions ALTER COLUMN property_id TYPE text USING property_id::text;
