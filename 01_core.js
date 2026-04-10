// ==========================================
// 1. CONSTANTES GLOBALES
// ==========================================
const CONFIG = {
  APP_TITLE: 'Maestría SPA',
  TITLE: 'Maestría SPA',
  SHEETS: {
    GENERAL_CONFIG: 'GENERAL_CONFIG',
    GENERAL_CICLOS: 'GENERAL_CICLOS',
    GENERAL_CURRICULA: 'GENERAL_CURRICULA'
  },
  CONFIG_KEYS: {
    ANIO_ACTUAL: 'anio_actual',
    NUMERO_CICLOS: 'numero_ciclos',
    CICLO_ACTUAL: 'ciclo_actual'
  }
};

// ==========================================
// 2. INICIALIZACIÓN DE LA SPA
// ==========================================
function doGet(e) {
  ensureSheets_(); 
  return HtmlService.createTemplateFromFile('03_app')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// 3. FUNCIONES CORE DE BASE DE DATOS (BLINDADAS)
// ==========================================
function getSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('No existe la hoja: ' + sheetName);
  return sh;
}

function getHeaders_(sheetName) {
  const sh = getSheet_(sheetName);
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
}

function getAllRows_(sheetName) {
  const sh = getSheet_(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  // SOLUCIÓN AL ERROR 10: getDisplayValues() asegura que no viajen objetos Date incompatibles
  const values = sh.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0];

  return values
    .slice(1)
    .filter(r => r.join('') !== '') // Ignora filas completamente vacías
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
}

function replaceAllRows_(sheetName, headers, rows) {
  const sh = getSheet_(sheetName);
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (rows && rows.length) {
    const values = rows.map(r => headers.map(h => r[h] !== undefined ? r[h] : ''));
    sh.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  sh.setFrozenRows(1);
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = [
    { name: CONFIG.SHEETS.GENERAL_CONFIG, headers: ['clave', 'valor'] },
    { name: CONFIG.SHEETS.GENERAL_CICLOS, headers: ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado', 'meta_json'] },
    { name: CONFIG.SHEETS.GENERAL_CURRICULA, headers: ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'dias', 'horario', 'link', 'observaciones', 'creado', 'meta_json'] }
  ];

  defs.forEach(def => {
    let sh = ss.getSheetByName(def.name);
    if (!sh) {
      sh = ss.insertSheet(def.name);
      sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      sh.setFrozenRows(1);
    }
  });

  seedDefaultConfig_();
}

function seedDefaultConfig_() {
  const rows = getAllRows_(CONFIG.SHEETS.GENERAL_CONFIG);
  const map = {};
  rows.forEach(r => map[r.clave] = r.valor);

  const wanted = [
    { clave: CONFIG.CONFIG_KEYS.ANIO_ACTUAL, valor: '' },
    { clave: CONFIG.CONFIG_KEYS.NUMERO_CICLOS, valor: '' },
    { clave: CONFIG.CONFIG_KEYS.CICLO_ACTUAL, valor: '' }
  ];

  const merged = [...rows];
  wanted.forEach(x => {
    if (map[x.clave] === undefined) merged.push(x);
  });

  replaceAllRows_(CONFIG.SHEETS.GENERAL_CONFIG, ['clave', 'valor'], merged);
}