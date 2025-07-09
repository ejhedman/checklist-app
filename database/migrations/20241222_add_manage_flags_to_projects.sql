-- Migration: Add is_manage_members and is_manage_features to projects
ALTER TABLE projects
  ADD COLUMN is_manage_members boolean NOT NULL DEFAULT true,
  ADD COLUMN is_manage_features boolean NOT NULL DEFAULT true; 