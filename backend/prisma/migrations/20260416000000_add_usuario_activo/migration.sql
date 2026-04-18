-- This migration adds an active flag to Usuario so operators can be marked inactive.
ALTER TABLE "Usuario"
ADD COLUMN "activo" boolean NOT NULL DEFAULT true;
