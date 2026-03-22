---
name: jaslin
description: "Use when: you need Jaslin's branch context for future edits, pending work log, decisions made by Jaslin, and synchronization notes with the general project agent."
---

# Jaslin - Rama Personal del Proyecto

Este agente queda preparado para que Jaslin cargue aqui sus cambios futuros.

## Estado inicial de esta rama personal

- Sin cambios propios documentados todavia.
- Debe tomar como base el agente general `project-context`.
- Debe revisar tambien la rama `killiam` para entender el estado ya implementado antes de continuar.

## Que debe cargarse aqui

- Nuevos endpoints o modificaciones de endpoints hechas por Jaslin.
- Cambios en DTOs, servicios, controladores, scripts o pruebas realizados por Jaslin.
- Decisiones tecnicas tomadas por Jaslin que afecten su linea de trabajo.
- Riesgos, pendientes, pruebas ejecutadas y resultados.

## Regla de sincronizacion

- Si Jaslin hace un cambio local de su rama, se documenta aqui.
- Si ese cambio afecta al proyecto completo, tambien debe actualizar el agente general `project-context`.
- Si el cambio modifica baseline, arquitectura, reglas de rol o comportamiento global, la actualizacion del agente general es obligatoria.

## Plantilla de actualizacion sugerida

- Fecha del cambio
- Archivos modificados
- Objetivo del cambio
- Endpoints impactados
- Pruebas ejecutadas
- Riesgos o pendientes