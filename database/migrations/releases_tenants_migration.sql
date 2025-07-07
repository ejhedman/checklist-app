-- Releases Targets Migration
-- Add targets JSON field to releases table

-- Add targets column to releases table
alter table releases 
add column if not exists targets jsonb default '[]'::jsonb;

-- Add comment to document the field
comment on column releases.targets is 'Array of target short names associated with this release'; 