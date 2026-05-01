-- PostgreSQL requires new enum values to be committed before use in a later migration.
-- This migration only adds the value; geo_slots_shipping uses it next.
ALTER TYPE "DeliverableStatus" ADD VALUE 'PENDING';
