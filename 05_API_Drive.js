// =========================================================================
// MÓDULO 05: API DRIVE (FÁBRICA DE ARCHIVOS)
// =========================================================================

function crearArchivoEnDriveSPA(tipoDoc, tipoCarpeta, nombreBase, nombreSesion, nombreCurricula) {
  try {
    // 1. Identificar carpeta raíz
    const rootFolderId = tipoCarpeta === 'PUBLICACIONES' 
                       ? CONFIG.CARPETAS.PUBLICACIONES 
                       : CONFIG.CARPETAS.DOCUMENTOS;
    
    let targetFolder = DriveApp.getFolderById(rootFolderId);

    // 2. Lógica de Subcarpeta y Permisos Públicos
    if (tipoCarpeta === 'PUBLICACIONES') {
      const nombreSub = `${nombreSesion.toUpperCase()} - ${nombreCurricula.toUpperCase()}`;
      const it = targetFolder.getFoldersByName(nombreSub);
      
      if (it.hasNext()) {
        targetFolder = it.next();
      } else {
        // Crear carpeta y hacerla pública
        targetFolder = targetFolder.createFolder(nombreSub);
        targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    }

    // 3. Crear archivo con nombre estructurado
    const nombreFinal = `${nombreBase} - ${nombreSesion.toUpperCase()} - ${nombreCurricula.toUpperCase()}`;
    let file = null;

    if (tipoDoc === 'DOC') file = DriveApp.getFileById(DocumentApp.create(nombreFinal).getId());
    else if (tipoDoc === 'SHEET') file = DriveApp.getFileById(SpreadsheetApp.create(nombreFinal).getId());
    else if (tipoDoc === 'SLIDE') file = DriveApp.getFileById(SlidesApp.create(nombreFinal).getId());

    // 4. Mover al destino y aplicar permisos si es público
    file.moveTo(targetFolder);
    
    if (tipoCarpeta === 'PUBLICACIONES') {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    return {
      status: 'success',
      url: file.getUrl(),
      nombre: nombreBase
    };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

/**
 * Envía a la papelera un archivo de Drive basándose en su URL.
 */
function eliminarArchivoDeDriveSPA(enlace) {
  try {
    if (!enlace || (!enlace.includes('drive.google.com') && !enlace.includes('docs.google.com'))) {
      return { status: 'ignored', message: 'No es un enlace de Drive válido.' };
    }
    
    // Extraer el ID del archivo de la URL (Maneja la mayoría de formatos de Google)
    let idMatch = enlace.match(/[-\w]{25,}/);
    if (idMatch && idMatch[0]) {
      let fileId = idMatch[0];
      DriveApp.getFileById(fileId).setTrashed(true);
      return { status: 'success', message: 'Archivo movido a la papelera.' };
    } else {
       return { status: 'error', message: 'No se pudo extraer el ID del enlace.' };
    }
  } catch (e) {
    Logger.log("Error al eliminar en Drive: " + e.message);
    return { status: 'error', message: e.message };
  }
}

/**
 * Renombra un archivo en Drive basándose en su URL.
 */
function renombrarArchivoEnDriveSPA(enlace, nuevoNombre) {
  try {
    if (!enlace || (!enlace.includes('drive.google.com') && !enlace.includes('docs.google.com'))) {
      return { status: 'ignored', message: 'No es un enlace de Drive válido.' };
    }
    
    // Extraer el ID del archivo de la URL
    let idMatch = enlace.match(/[-\w]{25,}/);
    if (idMatch && idMatch[0]) {
      let fileId = idMatch[0];
      DriveApp.getFileById(fileId).setName(nuevoNombre);
      return { status: 'success', message: 'Archivo renombrado correctamente en Drive.' };
    } else {
       return { status: 'error', message: 'No se pudo extraer el ID del enlace.' };
    }
  } catch (e) {
    Logger.log("Error al renombrar en Drive: " + e.message);
    return { status: 'error', message: e.message };
  }
}