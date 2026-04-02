-- Make equipo relation in historial optional and preserve historial on equipo deletion
ALTER TABLE "HistorialCambios" DROP CONSTRAINT IF EXISTS "HistorialCambios_equipoId_fkey";

ALTER TABLE "HistorialCambios"
  ALTER COLUMN "equipoId" DROP NOT NULL;

ALTER TABLE "HistorialCambios"
  ADD CONSTRAINT "HistorialCambios_equipoId_fkey"
  FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
