# Motor Canal Medular IRM Lumbar

Incluye backend Node/Express para Render y frontend HTML para integrar en el HTML maestro.

## Endpoint
POST `/generar-canal`

## Hallazgos incluidos
- Canal normal, estrecho, amplio y estenosis leve/moderada/severa.
- Quiste de Tarlov único o múltiple.
- Cono medular bajo, engrosado, lesión del cono y médula anclada.
- Siringohidromielia.
- Disrafia oculta, meningocele y lipoma del filum.
- Tumores: intramedular, extramedular intradural, extradural, ependimoma, astrocitoma, hemangioblastoma, schwannoma, meningioma, metástasis epidural, lipoma intradural y lesión tumoral indeterminada.

## Campos tumorales
Nivel/localización, localización tumoral, medidas, realce, edema, efecto de masa y siringomielia asociada.

## Integración rápida
1. Subir `server.js` a Render como servicio Node.js.
2. Instalar dependencias: `express` y `cors`.
3. En `frontend_modulo_canal_medular.html`, cambiar:
   `https://TU-SERVICIO-RENDER.onrender.com/generar-canal`
   por tu URL real de Render.
4. Pegar el HTML dentro del módulo Canal Medular o sustituir el grupo actual.
5. Verificar que `riActualizarReporte()` incluya `txt_canal` y `dx_canal` en el reporte global.
