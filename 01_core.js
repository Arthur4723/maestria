function getSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('No existe la hoja: ' + sheetName);
  return sh;
}

function getHeaders_(sheetName) {
  const sh = getSheet_(sheetName);
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

function getAllRows_(sheetName) {
  const sh = getSheet_(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];

  return values
    .slice(1)
    .filter(r => r.join('') !== '')
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
    {
      name: CONFIG.SHEETS.GENERAL_CONFIG,
      headers: ['clave', 'valor']
    },
    {
      name: CONFIG.SHEETS.GENERAL_CICLOS,
      headers: ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado', 'meta_json']
    },
    {
      name: CONFIG.SHEETS.GENERAL_CURRICULA,
      headers: ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'dias', 'horario', 'link', 'observaciones', 'creado', 'meta_json']
    }
  ];

  defs.forEach(def => {
    let sh = ss.getSheetByName(def.name);
    if (!sh) {
      sh = ss.insertSheet(def.name);
      sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      sh.setFrozenRows(1);
    } else {
      const currentHeaders = getHeaders_(def.name);
      if (!currentHeaders.length) {
        sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
        sh.setFrozenRows(1);
      }
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