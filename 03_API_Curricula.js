// =========================================================================
// MÓDULO 03: API CURRICULA (GESTOR V1)
// =========================================================================

function getCurriculaData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CURRICULA");
    if (!sheet) throw new Error("No existe la pestaña CURRICULA en el Google Sheet.");
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Retorna vacío si solo hay cabeceras
    
    data.shift(); // Eliminar cabeceras
    
    return data.map(row => {
      // Lectura defensiva: si la celda está vacía, asigna valor por defecto
      return {
        id_curricula: row[0] ? String(row[0]) : '',
        nombre:       row[1] ? String(row[1]) : '',
        meta_json:    row[2] ? String(row[2]) : '{}',
        documentos:   row[3] ? String(row[3]) : '[]',
        activo:       row[4] ? String(row[4]) : 'ACTIVO'
      };
    });
  } catch (e) {
    Logger.log("Error en getCurriculaData: " + e.toString());
    throw new Error("Error interno leyendo CURRICULA: " + e.message);
  }
}

function guardarCurriculaSPA(payload) {
  return ejecutarConLock_(function() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CURRICULA");
    if (!sheet) throw new Error("No existe la pestaña CURRICULA.");

    const rowsToSave = payload.map(item => [
      item.id_curricula,
      item.nombre,
      typeof item.meta_json === 'object' ? JSON.stringify(item.meta_json) : item.meta_json,
      item.documentos || "[]",
      item.activo || "ACTIVO"
    ]);

    // Limpiar desde la fila 2 hacia abajo (5 columnas)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
    }
    
    // Inyectar nueva data
    if (rowsToSave.length > 0) {
      sheet.getRange(2, 1, rowsToSave.length, 5).setValues(rowsToSave);
    }
    
    return { status: "success", message: "Curricula sincronizada en Sheets." };
  });
}