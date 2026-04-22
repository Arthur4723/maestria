// =========================================================================
// MÓDULO 00: CONFIGURACIÓN GLOBAL (MAESTRÍA SPA - GESTOR V1)
// =========================================================================

const CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  
  // Nombres de las hojas activas
  SHEET_CURRICULA: "CURRICULA",
  SHEET_SESIONES: "SESIONES",

  // 🚀 NUEVO: IDs de Carpetas de Google Drive
  CARPETAS: {
    DOCUMENTOS: "1n6vLQO8rFVBZgexa-94_cX2tLEMtl37s",
    PUBLICACIONES: "1NRs7d7XWUdF2fwJGul0hL-G9i2Q2T_cJ"
  },

  // Mapa exacto de columnas base 0 (Según la nueva normalización)
  COLUMNAS: {
    CURRICULA: {
      ID: 0,         // id_curricula
      NOMBRE: 1,     // nombre
      META: 2,       // meta_json (codigo, creditos, hora_inicio, etc.)
      DOCS: 3,       // documentos
      ACTIVO: 4      // activo
    },
    SESIONES: {
      ID: 0,         // id_sesion
      CURR_ID: 1,    // id_curricula
      NOMBRE: 2,     // nombre (Expuesto para UI rápida)
      META: 3,       // meta_json (tipo, fecha, orden, recursos, etc.)
      DOCS: 4,       // documentos
      ESTADO: 5      // estado
    }
  }
};

/**
 * Función de bloqueo para prevenir colisiones en guardados concurrentes.
 */
function ejecutarConLock_(callback) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Espera hasta 10 segundos
    return callback();
  } catch (e) {
    throw new Error("Sistema ocupado guardando otros datos: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Función requerida para inyectar CSS y JS en los archivos HTML.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}