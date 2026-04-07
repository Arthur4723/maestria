function apiListarNotas() {
  try {
    return ok(getAllRows_(CONFIG.SHEETS.NOTAS));
  } catch (e) {
    return fail(e.message);
  }
}

function apiCrearNota(payload) {
  try {
    const row = {
      id_nota: generarId('NOT'),
      id_curso: payload.id_curso || '',
      id_sesion: payload.id_sesion || '',
      titulo: payload.titulo || '',
      contenido: payload.contenido || '',
      creado: ahoraTexto()
    };
    appendRow_(CONFIG.SHEETS.NOTAS, row);
    return ok(row);
  } catch (e) {
    return fail(e.message);
  }
}