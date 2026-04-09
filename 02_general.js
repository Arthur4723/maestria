function apiBoot() {
  try {
    ensureSheets_();

    const config = getAllRows_(CONFIG.SHEETS.GENERAL_CONFIG);
    const ciclos = getAllRows_(CONFIG.SHEETS.GENERAL_CICLOS)
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

    const curricula = getAllRows_(CONFIG.SHEETS.GENERAL_CURRICULA)
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

    return ok({
      config,
      ciclos,
      curricula
    });
  } catch (e) {
    return fail(e.message);
  }
}

function apiGuardarGeneral(payload) {
  try {
    const configHeaders = ['clave', 'valor'];
    const ciclosHeaders = ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado', 'meta_json'];
    const curriculaHeaders = ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'dias', 'horario', 'link', 'observaciones', 'creado', 'meta_json'];

    replaceAllRows_(CONFIG.SHEETS.GENERAL_CONFIG, configHeaders, payload.config || []);
    replaceAllRows_(CONFIG.SHEETS.GENERAL_CICLOS, ciclosHeaders, payload.ciclos || []);
    replaceAllRows_(CONFIG.SHEETS.GENERAL_CURRICULA, curriculaHeaders, payload.curricula || []);

    return ok(true);
  } catch (e) {
    return fail(e.message);
  }
}

function apiGenerarDocumentoSesion(carpetaId, nombreDoc) {
  try {
    // Crea el documento en la raíz
    var doc = DocumentApp.create(nombreDoc);
    var file = DriveApp.getFileById(doc.getId());
    
    // Lo mueve a tu carpeta específica
    var folder = DriveApp.getFolderById(carpetaId);
    file.moveTo(folder);
    
    return { ok: true, url: doc.getUrl() };
  } catch (e) {
    return { ok: false, message: e.toString() };
  }
}

function apiGenerarRecursosAvanzados(params) {
  /*
   params = {
     folderId_individual: '1n6vLQO8rFVBZgexa-94_cX2tLEMtl37s',
     folderId_grupal: '1NRs7d7XWUdF2fwJGul0hL-G9i2Q2T_cJ',
     tipo_archivo: 'doc' | 'sheet' | 'slide',
     nombre_archivo: 'Práctica 1...',
     es_grupal: boolean,
     num_grupos: number
   }
  */
  try {
    if (params.es_grupal) {
      // Lógica GRUPAL: Crea subcarpeta y archivos por grupo
      var parentFolder = DriveApp.getFolderById(params.folderId_grupal);
      var subFolder = parentFolder.createFolder(params.nombre_archivo);
      var urls_generadas = [];
      
      for (var i = 1; i <= params.num_grupos; i++) {
        var fname = params.nombre_archivo + " - Grupo " + i;
        var file;
        if (params.tipo_archivo === 'doc') file = DriveApp.getFileById(DocumentApp.create(fname).getId());
        if (params.tipo_archivo === 'sheet') file = DriveApp.getFileById(SpreadsheetApp.create(fname).getId());
        if (params.tipo_archivo === 'slide') file = DriveApp.getFileById(SlidesApp.create(fname).getId());
        
        file.moveTo(subFolder);
        urls_generadas.push({ grupo: i, url: file.getUrl() });
      }
      return { ok: true, tipo: 'grupal', folderUrl: subFolder.getUrl(), archivos: urls_generadas };
      
    } else {
      // Lógica INDIVIDUAL / BORRADORES / PPT
      var fileSolo;
      if (params.tipo_archivo === 'doc') fileSolo = DriveApp.getFileById(DocumentApp.create(params.nombre_archivo).getId());
      if (params.tipo_archivo === 'sheet') fileSolo = DriveApp.getFileById(SpreadsheetApp.create(params.nombre_archivo).getId());
      if (params.tipo_archivo === 'slide') fileSolo = DriveApp.getFileById(SlidesApp.create(params.nombre_archivo).getId());
      
      var targetFolder = DriveApp.getFolderById(params.folderId_individual);
      fileSolo.moveTo(targetFolder);
      
      return { ok: true, tipo: 'individual', url: fileSolo.getUrl() };
    }
  } catch (e) {
    return { ok: false, message: e.toString() };
  }
}