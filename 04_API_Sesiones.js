// =========================================================================
// MÓDULO 04: API SESIONES (GESTOR V1)
// =========================================================================

function getSesionesData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SESIONES");
    if (!sheet) throw new Error("No existe la pestaña SESIONES.");
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    data.shift(); // Eliminar cabeceras
    
    return data.map(row => {
      // Lectura defensiva (6 columnas)
      return {
        id_sesion:    row[0] ? String(row[0]) : '',
        id_curricula: row[1] ? String(row[1]) : '',
        nombre:       row[2] ? String(row[2]) : '',
        meta_json:    row[3] ? String(row[3]) : '{}',
        documentos:   row[4] ? String(row[4]) : '[]',
        estado:       row[5] ? String(row[5]) : 'ACTIVO'
      };
    });
  } catch (e) {
    Logger.log("Error en getSesionesData: " + e.toString());
    throw new Error("Error interno leyendo SESIONES: " + e.message);
  }
}

function guardarSesionesSPA(payload) {
  return ejecutarConLock_(function() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SESIONES");
    if (!sheet) throw new Error("No existe la pestaña SESIONES.");

    const rowsToSave = payload.map(item => [
      item.id_sesion,
      item.id_curricula,
      item.nombre,
      typeof item.meta_json === 'object' ? JSON.stringify(item.meta_json) : item.meta_json,
      item.documentos || "[]",
      item.estado || "ACTIVO"
    ]);

    // Limpiar desde la fila 2 hacia abajo (6 columnas)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).clearContent();
    }
    
    if (rowsToSave.length > 0) {
      sheet.getRange(2, 1, rowsToSave.length, 6).setValues(rowsToSave);
    }
    
    return { status: "success", message: "Sesiones sincronizadas en Sheets." };
  });
}