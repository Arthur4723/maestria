/********** CONFIGURA TUS IDs **********/
const SHEET_NAME      = 'PLANTILLA';
const FOLDER_ID       = '1EPi5nr7SwN_W008LbVt_Caq4mtuspJEf';
const TEMPLATE_DOC_ID = '15mkCt13qVZN-O6mz5AY9ybvPDW53YgnjkEvZYLrTX0k';

/**
 * Duplica un Google Doc en una carpeta y devuelve el ID de la copia.
 * Se mantiene tu estilo original.
 */
function duplicarGoogleDoc(idCarpeta, idDocumento, nuevoNombre) {
  try {
    Logger.log('[duplicarGoogleDoc] nombre: "%s"', nuevoNombre);
    var carpeta = DriveApp.getFolderById(idCarpeta);
    if (!carpeta) { Logger.log('[duplicarGoogleDoc] Carpeta no encontrada'); return null; }

    var archivoOriginal = DriveApp.getFileById(idDocumento);
    if (!archivoOriginal) { Logger.log('[duplicarGoogleDoc] Documento base no encontrado'); return null; }

    var copia = archivoOriginal.makeCopy(nuevoNombre, carpeta);
    var idCopia = copia.getId();
    Logger.log('[duplicarGoogleDoc] Copia creada con ID: %s', idCopia);
    return idCopia;
  } catch (error) {
    Logger.log('[duplicarGoogleDoc][ERROR] %s', error && error.message ? error.message : error);
    return null;
  }
}

/**
 * Lee la SELECCIÓN REAL (una sola columna, en PLANTILLA, desde la E hacia la derecha),
 * toma los nombres desde la columna B de las MISMAS filas,
 * crea las copias y escribe:
 *  - ESTADO en la columna seleccionada
 *  - ID en la columna C
 *  - ENLACE en la columna D
 */
function leerDatosSeleccionadosYCrearArchivo() {
  try {
    var ss  = SpreadsheetApp.getActive();
    var sel = ss.getSelection();
    if (!sel) {
      Logger.log('[MAIN] No hay selección activa en este archivo. Selecciona una columna en PLANTILLA y reintenta.');
      return;
    }

    // Aceptamos solo UN rango contiguo
    var rangeList = sel.getActiveRangeList();
    var ranges = [];
    if (rangeList) {
      ranges = rangeList.getRanges();
    } else if (sel.getActiveRange()) {
      ranges = [sel.getActiveRange()];
    }
    if (!ranges.length) {
      Logger.log('[MAIN] No hay rango activo. Selecciona una sola columna en PLANTILLA.');
      return;
    }
    if (ranges.length > 1) {
      Logger.log('[MAIN] Se detectaron %s rangos. Usa UNA sola selección contigua.', ranges.length);
      ranges.forEach(function(r, idx){ Logger.log(' - Rango %s: %s (%s)', idx+1, r.getA1Notation(), r.getSheet().getName()); });
      return;
    }

    var rng = ranges[0];
    var hoja = rng.getSheet();
    var hojaNombre = hoja.getName();
    Logger.log('[MAIN] Rango seleccionado: %s en hoja: %s', rng.getA1Notation(), hojaNombre);

    if (hojaNombre !== SHEET_NAME) {
      Logger.log('[MAIN] La selección NO está en "%s". Cancelo para no leer otra hoja.', SHEET_NAME);
      return;
    }

    if (rng.getNumColumns() !== 1) {
      Logger.log('[MAIN] La selección debe ser UNA sola columna. Seleccionaste %s columnas.', rng.getNumColumns());
      return;
    }

    var selCol   = rng.getColumn();
    var startRow = rng.getRow();
    var numRows  = rng.getNumRows();

    Logger.log('[MAIN] Fila inicial: %s | Num filas: %s | Col seleccionada: %s', startRow, numRows, selCol);

    if (selCol < 5) {
      Logger.log('[MAIN] La columna seleccionada debe ser E (5) o mayor. Seleccionada: %s', selCol);
      return;
    }

    // Nombres desde columna B (2) alineados a las filas seleccionadas
    var nombresRange = hoja.getRange(startRow, 2, numRows, 1);
    var nombresArchivos = nombresRange.getDisplayValues();
    Logger.log('[MAIN] Leyendo nombres desde: %s', nombresRange.getA1Notation());
    Logger.log('[MAIN] Valores leídos (B): %s', JSON.stringify(nombresArchivos));

    // Arrays de salida
    var estados = []; // para selCol
    var ids     = []; // para C
    var enlaces = []; // para D

    // IDs de carpeta y doc base
    var idCarpeta   = FOLDER_ID;
    var idDocumento = TEMPLATE_DOC_ID;

    for (var i = 0; i < numRows; i++) {
      var filaActual = startRow + i;
      try {
        var nuevoNombre = (nombresArchivos[i][0] || '').trim();
        Logger.log('[LOOP] Fila %s -> nombre en B%s: "%s"', filaActual, filaActual, nuevoNombre);

        if (!nuevoNombre) {
          Logger.log('[LOOP] Fila %s sin nombre. Marcando NO REALIZADO.', filaActual);
          estados.push(['NO REALIZADO']);
          ids.push(['']);
          enlaces.push(['']);
          continue;
        }

        var nuevoArchivoId = duplicarGoogleDoc(idCarpeta, idDocumento, nuevoNombre);
        Logger.log('[LOOP] Fila %s -> duplicarGoogleDoc() => %s', filaActual, nuevoArchivoId);

        if (nuevoArchivoId) {
          estados.push(['REALIZADO']);
          ids.push([nuevoArchivoId]);
          enlaces.push(['=HYPERLINK("https://docs.google.com/document/d/' + nuevoArchivoId + '","Doc")']);
        } else {
          estados.push(['NO REALIZADO']);
          ids.push(['']);
          enlaces.push(['']);
        }

      } catch (errorFila) {
        Logger.log('[ERROR LOOP] Fila %s: %s', filaActual, errorFila && errorFila.message ? errorFila.message : errorFila);
        estados.push(['NO REALIZADO']);
        ids.push(['']);
        enlaces.push(['']);
      }
    }

    // Rangos de escritura
    var estadoRange = hoja.getRange(startRow, selCol, numRows, 1);
    var idRange     = hoja.getRange(startRow, 3,     numRows, 1); // C
    var linkRange   = hoja.getRange(startRow, 4,     numRows, 1); // D

    Logger.log('[WRITE] ESTADO => %s | Valores: %s', estadoRange.getA1Notation(), JSON.stringify(estados));
    Logger.log('[WRITE] ID     => %s | Valores: %s', idRange.getA1Notation(),     JSON.stringify(ids));
    Logger.log('[WRITE] ENLACE => %s | Valores: %s', linkRange.getA1Notation(),   JSON.stringify(enlaces));

    // Escritura
    estadoRange.setValues(estados);
    idRange.setValues(ids);
    linkRange.setValues(enlaces);

    SpreadsheetApp.flush();
    Logger.log('[DONE] Proceso terminado OK.');

  } catch (error) {
    Logger.log('[MAIN][ERROR] %s', error && error.message ? error.message : error);
  }
}
function creadorEvento(nombreEvento, fecha, horaInicio, horaFin, linkZoom) {
  try {
    // ID del calendario (reemplázalo con tu ID real)
    var calendarId = "7e2e0e7b6c8a29ae4e49cca4922e727bf20ee9841125ebf3d1d204f376a19ffe@group.calendar.google.com";
    
    //6229fa9883d8375011722fbcfeed5ff4e305c9a49450130b36e29af36b6017d2@group.calendar.google.com
    // Obtener el calendario
    var calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      Logger.log("Error: No se encontró el calendario con el ID proporcionado.");
      return;
    }

    // Convertir la fecha y horas en objetos Date
    var fechaPartes = fecha.split("/"); // Esperando formato "DD/MM/AAAA"
    var dia = parseInt(fechaPartes[0]);
    var mes = parseInt(fechaPartes[1]) - 1; // Los meses son 0-based en JavaScript
    var anio = parseInt(fechaPartes[2]);

    var horaInicioPartes = horaInicio.split(":");
    var horaFinPartes = horaFin.split(":");

    var startTime = new Date(anio, mes, dia, parseInt(horaInicioPartes[0]), parseInt(horaInicioPartes[1]));
    var endTime = new Date(anio, mes, dia, parseInt(horaFinPartes[0]), parseInt(horaFinPartes[1]));

    // Crear el evento en Google Calendar
    var evento = calendar.createEvent(
      nombreEvento,
      startTime,
      endTime,
      {
        description: "Link Zoom: " + linkZoom
      }
    );

    Logger.log("Evento creado: " + evento.getId());
    return "Evento creado exitosamente con ID: " + evento.getId();
  } catch (error) {
    Logger.log("Error al crear el evento: " + error.message);
    return "Error: " + error.message;
  }
}

function crearEventoCalendario() {
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CALENDARIO");
    if (!hoja) {
      Logger.log("Error: No se encontró la hoja 'CALENDARIO'.");
      return;
    }

    var rangoSeleccionado = hoja.getActiveRange();
    var inicioFila = rangoSeleccionado.getRow();
    var finFila = inicioFila + rangoSeleccionado.getNumRows() - 1;

    // Obtener datos de las columnas necesarias (B, D, E, F, G)
    var datos = hoja.getRange(inicioFila, 2, finFila - inicioFila + 1, 6).getDisplayValues(); // Desde B hasta G

    var resultados = [];

    datos.forEach((fila, index) => {
      try {
        var nombreEvento = fila[0] + " - " + fila[4]; // Columna B + " - " + Columna F
        var fecha = fila[2]; // Columna D (Formato esperado: dd/MM/yyyy)

        // Procesar horas desde Columna E
        var horas = fila[3].split(" - ");
        var horaInicio = horas[0].trim();
        var horaFin = horas[1].trim();

        var linkZoom = fila[5]; // Columna G

        // Llamar a la función para crear el evento
        var resultado = creadorEvento(nombreEvento, fecha, horaInicio, horaFin, linkZoom);

        // Si no hubo error, guardar "REALIZADO", si hubo error, "NO REALIZADO"
        resultados.push(["REALIZADO"]);
      } catch (error) {
        Logger.log("Error al procesar fila " + (inicioFila + index) + ": " + error.message);
        resultados.push(["NO REALIZADO"]);
      }
    });

    // Escribir los resultados en la columna H
    hoja.getRange(inicioFila, 8, resultados.length, 1).setValues(resultados);

  } catch (error) {
    Logger.log("Error al ejecutar la función: " + error.message);
  }
}

function crearEnlaceDocs() {
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PLANTILLA");
    if (!hoja) {
      Logger.log("Error: No se encontró la hoja 'ARCHIVOS'.");
      return;
    }

    var rangoSeleccionado = hoja.getActiveRange();
    var inicioFila = rangoSeleccionado.getRow();
    var numFilas = rangoSeleccionado.getNumRows();

    // Obtener los IDs desde la columna E
    var idsArchivos = hoja.getRange(inicioFila, 3, numFilas, 1).getValues(); // Columna E

    var formulas = [];

    idsArchivos.forEach((fila) => {
      var archivoId = fila[0].trim();

      if (archivoId) {
        try {
          var archivo = DriveApp.getFileById(archivoId);
          var enlace = 'https://docs.google.com/document/d/' + archivoId + '';
          formulas.push(['=HYPERLINK("' + enlace + '", "Doc")']);
        } catch (error) {
          formulas.push(['NO DISPONIBLE']);
        }
      } else {
        formulas.push(['NO DISPONIBLE']);
      }
    });

    // Escribir los enlaces en la columna seleccionada
    hoja.getRange(inicioFila, rangoSeleccionado.getColumn(), formulas.length, 1).setFormulas(formulas);

  } catch (error) {
    Logger.log('Error al crear los enlaces: ' + error.toString());
  }
}

function duplicarGoogleDoc(idCarpeta, idDocumento, nuevoNombre) {
  try {
    // Obtener la carpeta de destino
    var carpeta = DriveApp.getFolderById(idCarpeta);
    if (!carpeta) return null;

    // Obtener el documento de Google Docs original
    var archivoOriginal = DriveApp.getFileById(idDocumento);
    if (!archivoOriginal) return null;

    // Crear una copia del documento en la carpeta especificada con el nuevo nombre
    var copia = archivoOriginal.makeCopy(nuevoNombre, carpeta);

    return copia.getId(); // Devuelve solo el ID del nuevo documento
  } catch (error) {
    return null; // Si hay error, devuelve null
  }
}

function leerDatosSeleccionadosYCrearArchivo2() {
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARCHIVOS");
    if (!hoja) {
      Logger.log("Error: No se encontró la hoja 'ARCHIVOS'.");
      return;
    }

    var rangoSeleccionado = hoja.getActiveRange();
    var inicioFila = rangoSeleccionado.getRow();
    var numFilas = rangoSeleccionado.getNumRows();

    // ID de la carpeta y documento base
    var idCarpeta = "1EPi5nr7SwN_W008LbVt_Caq4mtuspJEf";
    var idDocumento = "15mkCt13qVZN-O6mz5AY9ybvPDW53YgnjkEvZYLrTX0k";

    // Obtener los nombres de archivo desde la columna D de las filas seleccionadas
    var nombresArchivos = hoja.getRange(inicioFila, 4, numFilas, 1).getDisplayValues();
    
    var resultados = [];

    nombresArchivos.forEach((fila) => {
      try {
        var nuevoNombre = fila[0].trim(); // Nombre del archivo desde la columna D

        // Llamar a la función para duplicar el documento
        var nuevoArchivoId = duplicarGoogleDoc(idCarpeta, idDocumento, nuevoNombre);

        // Si se creó correctamente, guardar el ID; si no, "NO REALIZADO"
        resultados.push([nuevoArchivoId ? nuevoArchivoId : "NO REALIZADO"]);
      } catch (error) {
        Logger.log("Error al procesar archivo: " + error.message);
        resultados.push(["NO REALIZADO"]);
      }
    });

    // Escribir los resultados en la misma selección (en la columna donde estaba seleccionado)
    hoja.getRange(inicioFila, rangoSeleccionado.getColumn(), resultados.length, 1).setValues(resultados);

  } catch (error) {
    Logger.log("Error al ejecutar la función: " + error.message);
  }
}

function crearEnlacePDF() {
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rangoSeleccionado = hoja.getActiveRange();
    var inicioFila = rangoSeleccionado.getRow();
    var finFila = inicioFila + rangoSeleccionado.getNumRows() - 1;
    var idsArchivos = hoja.getRange("B" + inicioFila + ":B" + finFila).getValues();

    // Crear un array para almacenar las fórmulas
    var formulas = [];

    idsArchivos.forEach(function(fila) {
      var archivoId = fila[0];
      var archivo = DriveApp.getFileById(archivoId);

      if (archivo.getMimeType() === MimeType.PDF) {
        var enlace = 'https://drive.google.com/file/d/' + archivoId + '/view';
        formulas.push(['=HYPERLINK("' + enlace + '", "Link")']);
      } else {
        formulas.push(['No es un PDF']);
      }
    });

    // Establecer las fórmulas en el rango seleccionado
    rangoSeleccionado.setFormulas(formulas);

  } catch (error) {
    Logger.log('Error al crear los enlaces: ' + error.toString());
  }
}


function cargarIdsEnColumnaB() {
  // ID de la carpeta de Google Drive que deseas explorar
  var carpetaId = "1UeUuDfrWfwnOieKT3MYOYbjzwhkHW2Tw";  // Reemplaza con el ID de tu carpeta

  // Obtener la carpeta de Google Drive
  var carpeta = DriveApp.getFolderById(carpetaId);

  // Obtener todos los archivos dentro de la carpeta
  var archivos = carpeta.getFiles();

  // Crear un array para almacenar los IDs de los archivos
  var idsArchivos = [];

  // Recorrer todos los archivos en la carpeta
  while (archivos.hasNext()) {
    var archivo = archivos.next();
    idsArchivos.push([archivo.getId()]);  // Agregar el ID como un array de un solo elemento para cada fila
  }

  // Obtener la hoja de cálculo activa y poner los IDs en la columna B comenzando desde la fila 2
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  hoja.getRange(2, 2, idsArchivos.length, 1).setValues(idsArchivos);  // (fila 2, columna 2 = columna B)
}

function cargarNombres() {
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rangoSeleccionado = hoja.getActiveRange();
    var inicioFila = rangoSeleccionado.getRow();
    var finFila = inicioFila + rangoSeleccionado.getNumRows() - 1;
    var ids = hoja.getRange("B" + inicioFila + ":B" + finFila).getValues();

    // Obtener nombres de archivos sin extensión
    var nombresSinExtension = ids.map(function (fila) {
      var nombreCompleto = DriveApp.getFileById(fila[0]).getName();
      return [nombreCompleto.replace(/\.[^/.]+$/, "")];  // Elimina la extensión del archivo
    });

    // Pegar los nombres en el rango seleccionado
    rangoSeleccionado.setValues(nombresSinExtension);

  } catch (error) {
    Logger.log('Error al cargar los nombres: ' + error.toString());
  }
}
function renombrarArchivos() {
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rangoSeleccionado = hoja.getActiveRange();
    var inicioFila = rangoSeleccionado.getRow();
    var finFila = inicioFila + rangoSeleccionado.getNumRows() - 1;
    var ids = hoja.getRange("B" + inicioFila + ":B" + finFila).getValues();
    var nuevosNombres = hoja.getRange("D" + inicioFila + ":D" + finFila).getValues();

    // Crear un array para almacenar los resultados de renombrado
    var resultados = [];

    ids.forEach(function(fila, index) {
      var archivoId = fila[0];
      var nuevoNombre = nuevosNombres[index][0];
      
      try {
        // Obtener el archivo por su ID
        var archivo = DriveApp.getFileById(archivoId);

        // Obtener la extensión del archivo
        var extension = archivo.getName().match(/\.[^/.]+$/);
        extension = extension ? extension[0] : ""; // Manejar archivos sin extensión

        // Renombrar el archivo manteniendo la extensión
        archivo.setName(nuevoNombre + extension);

        // Agregar "Renombrado" al array de resultados
        resultados.push(['Renombrado']);
      } catch (error) {
        Logger.log('Error al renombrar archivo ID ' + archivoId + ': ' + error.toString());
        resultados.push(['No renombrado']);
      }
    });

    // Pegar los resultados en el rango seleccionado
    rangoSeleccionado.setValues(resultados);

  } catch (error) {
    Logger.log('Error en la función renombrarArchivos: ' + error.toString());
  }
}











