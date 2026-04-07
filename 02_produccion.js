function apiListarProduccion() {
  try {
    return ok(getAllRows_(CONFIG.SHEETS.PRODUCCION));
  } catch (e) {
    return fail(e.message);
  }
}

function apiCrearProduccion(payload) {
  try {
    const row = {
      id_doc: generarId('DOC'),
      id_curso: payload.id_curso || '',
      tipo: payload.tipo || 'RESUMEN',
      titulo: payload.titulo || '',
      estado: payload.estado || 'BORRADOR',
      link: payload.link || '',
      creado: ahoraTexto()
    };
    appendRow_(CONFIG.SHEETS.PRODUCCION, row);
    return ok(row);
  } catch (e) {
    return fail(e.message);
  }
}