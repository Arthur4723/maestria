// ==========================================
// 01_core.js - NÚCLEO OPERATIVO Y DRIVE v28
// ==========================================
const CONFIG = {
  APP_TITLE: 'Maestría SPA',
  SHEETS: {
    GENERAL_CONFIG: 'GENERAL_CONFIG',
    GENERAL_CICLOS: 'GENERAL_CICLOS',
    GENERAL_CURRICULA: 'GENERAL_CURRICULA',
    GENERAL_SESIONES: 'GENERAL_SESIONES'
  },
  CONFIG_KEYS: { CICLO_ACTUAL: 'ciclo_actual' },
  DRIVE_FOLDER_ID: '1n6vLQO8rFVBZgexa-94_cX2tLEMtl37s' // Carpeta Maestra
};

function doGet(e) {
  ensureSheets_(); 
  return HtmlService.createTemplateFromFile('03_app').evaluate()
    .setTitle(CONFIG.APP_TITLE).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('No existe la hoja: ' + sheetName);
  return sh;
}

function getAllRows_(sheetName) {
  const sh = getSheet_(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sh.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0].map(h => h.toString().trim().toLowerCase());

  return values.slice(1).filter(r => r.join('').trim() !== '').map(row => {
    const obj = {};
    headers.forEach((h, i) => { if(h) obj[h] = row[i]; });
    return obj;
  });
}

function parseJSONSeguro_(str, fallback) {
  if (!str || str.trim() === '') return fallback;
  try { return JSON.parse(str); } catch(e) { return fallback; }
}

function getCoreDataSPA() {
  try {
    const configRows = getAllRows_(CONFIG.SHEETS.GENERAL_CONFIG);
    let configObj = {};
    configRows.forEach(r => { if(r.clave) configObj[r.clave.trim()] = r.valor; });

    const ciclos = getAllRows_(CONFIG.SHEETS.GENERAL_CICLOS).map(c => ({
      ...c, meta_json: parseJSONSeguro_(c.meta_json, {})
    }));

    const curricula = getAllRows_(CONFIG.SHEETS.GENERAL_CURRICULA).map(curso => ({
      ...curso, meta_json: parseJSONSeguro_(curso.meta_json, {})
    }));

    const sesiones = getAllRows_(CONFIG.SHEETS.GENERAL_SESIONES).map(s => ({
      ...s, meta_json: parseJSONSeguro_(s.meta_json, {})
    }));

    const cicloId = configObj[CONFIG.CONFIG_KEYS.CICLO_ACTUAL];
    const cursosActivos = curricula.filter(c => c.ciclo === cicloId);

    return {
      status: "success",
      data: { config: configObj, ciclos: ciclos, curricula: curricula, cursosActivos: cursosActivos, sesiones: sesiones }
    };
  } catch (error) { return { status: "error", message: error.toString() }; }
}

// === INTEGRACIÓN CON GOOGLE DRIVE ===

function crearArchivoDriveSPA(tipo, nombre) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    let file;
    let finalName = nombre || "Sin Título";

    if (tipo === 'DOCUMENTO') {
      const doc = DocumentApp.create(finalName);
      file = DriveApp.getFileById(doc.getId());
    } else if (tipo === 'EXCEL') {
      const sheet = SpreadsheetApp.create(finalName);
      file = DriveApp.getFileById(sheet.getId());
    } else if (tipo === 'DIAPOSITIVAS') {
      const slide = SlidesApp.create(finalName);
      file = DriveApp.getFileById(slide.getId());
    } else {
      return { status: "error", message: "Tipo no autogenerable. Tipo recibido: " + tipo };
    }

    file.moveTo(folder);
    return { status: "success", url: file.getUrl(), id: file.getId() };
  } catch(e) {
    return { status: "error", message: e.toString() };
  }
}

function eliminarArchivoDriveSPA(url) {
  try {
    // Extraer el ID de la URL
    const match = url.match(/[-\w]{25,}/);
    if (!match) return { status: "error", message: "No se pudo extraer el ID de Drive de la URL." };
    
    const fileId = match[0];
    DriveApp.getFileById(fileId).setTrashed(true);
    return { status: "success" };
  } catch(e) {
    return { status: "error", message: e.toString() };
  }
}

// === FUNCIONES DE GUARDADO RELACIONAL ===
function guardarConfigSPA(configObj) {
  try {
    const sh = getSheet_(CONFIG.SHEETS.GENERAL_CONFIG);
    const headers = ['clave', 'valor'];
    const values = Object.keys(configObj).map(k => [k, configObj[k]]);
    sh.clearContents(); sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if(values.length > 0) sh.getRange(2, 1, values.length, headers.length).setValues(values);
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function guardarCiclosSPA(ciclosArray) {
  try {
    const sh = getSheet_(CONFIG.SHEETS.GENERAL_CICLOS);
    const headers = ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado', 'meta_json'];
    const values = ciclosArray.map(c => headers.map(h => h === 'meta_json' ? (typeof c[h] === 'object' ? JSON.stringify(c[h]) : c[h]) : (c[h]||'')));
    sh.clearContents(); sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if(values.length > 0) sh.getRange(2, 1, values.length, headers.length).setValues(values);
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function guardarCursosSPA(cursosArray) {
  try {
    const sh = getSheet_(CONFIG.SHEETS.GENERAL_CURRICULA);
    const headers = ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'meta_json'];
    const values = cursosArray.map(c => headers.map(h => h === 'meta_json' ? (typeof c[h] === 'object' ? JSON.stringify(c[h]) : c[h]) : (c[h]||'')));
    sh.clearContents(); sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if(values.length > 0) sh.getRange(2, 1, values.length, headers.length).setValues(values);
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function guardarSesionesSPA(sesionesArray) {
  try {
    const sh = getSheet_(CONFIG.SHEETS.GENERAL_SESIONES);
    const headers = ['id_sesion', 'id_curricula', 'tipo', 'nombre', 'fecha', 'orden', 'estado', 'meta_json'];
    const values = sesionesArray.map(s => headers.map(h => h === 'meta_json' ? (typeof s[h] === 'object' ? JSON.stringify(s[h]) : s[h]) : (s[h]||'')));
    sh.clearContents(); sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if(values.length > 0) sh.getRange(2, 1, values.length, headers.length).setValues(values);
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = [
    { name: 'GENERAL_CONFIG', headers: ['clave', 'valor'] },
    { name: 'GENERAL_CICLOS', headers: ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado', 'meta_json'] },
    { name: 'GENERAL_CURRICULA', headers: ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'meta_json'] },
    { name: 'GENERAL_SESIONES', headers: ['id_sesion', 'id_curricula', 'tipo', 'nombre', 'fecha', 'orden', 'estado', 'meta_json'] }
  ];
  defs.forEach(def => {
    if (!ss.getSheetByName(def.name)) {
      const sh = ss.insertSheet(def.name);
      sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      sh.setFrozenRows(1);
    }
  });
}

function auditarEsquemasBD() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const expected = {
      'GENERAL_CONFIG': ['clave', 'valor'],
      'GENERAL_CICLOS': ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado', 'meta_json'],
      'GENERAL_CURRICULA': ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'meta_json'],
      'GENERAL_SESIONES': ['id_sesion', 'id_curricula', 'tipo', 'nombre', 'fecha', 'orden', 'estado', 'meta_json']
    };
    let report = { status: "success", logs: [], errors: 0 };
    for (let sheetName in expected) {
      let sh = ss.getSheetByName(sheetName);
      if (!sh) { report.logs.push(`❌ FALTA HOJA: ${sheetName}`); report.errors++; continue; }
      let headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => h.toString().trim().toLowerCase());
      let exp = expected[sheetName].map(h => h.toLowerCase());
      let missing = exp.filter(h => !headers.includes(h));
      if (missing.length > 0) { report.logs.push(`❌ HOJA ${sheetName} -> Columnas faltantes: ${missing.join(', ')}`); report.errors++; } 
      else { report.logs.push(`✅ HOJA ${sheetName} -> Esquema perfecto.`); }
    }
    return report;
  } catch (e) { return { status: "error", message: e.toString() }; }
}

function limpiarTesterOmniBd(payload) {
  try {
    if(payload.idSesion) {
      let sh = getSheet_(CONFIG.SHEETS.GENERAL_SESIONES);
      let data = sh.getDataRange().getValues();
      let newData = data.filter((r, i) => i === 0 || r[0] !== payload.idSesion);
      sh.clearContents(); if(newData.length > 0) sh.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    }
    if(payload.idCurricula) {
      let sh = getSheet_(CONFIG.SHEETS.GENERAL_CURRICULA);
      let data = sh.getDataRange().getValues();
      let newData = data.filter((r, i) => i === 0 || r[0] !== payload.idCurricula);
      sh.clearContents(); if(newData.length > 0) sh.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    }
    if(payload.idCiclo) {
      let sh = getSheet_(CONFIG.SHEETS.GENERAL_CICLOS);
      let data = sh.getDataRange().getValues();
      let newData = data.filter((r, i) => i === 0 || r[0] !== payload.idCiclo);
      sh.clearContents(); if(newData.length > 0) sh.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    }
    if(payload.idConfig) {
      let sh = getSheet_(CONFIG.SHEETS.GENERAL_CONFIG);
      let data = sh.getDataRange().getValues();
      let newData = data.filter((r, i) => i === 0 || r[0] !== payload.idConfig);
      sh.clearContents(); if(newData.length > 0) sh.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    }
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; }
}