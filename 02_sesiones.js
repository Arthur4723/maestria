function apiListarSesiones() {
  try {
    return ok(getAllRows_(CONFIG.SHEETS.SESIONES));
  } catch (e) {
    return fail(e.message);
  }
}

function apiCrearSesion(payload) {
  try {
    const row = {
      id_sesion: generarId('SES'),
      id_curso: payload.id_curso || '',
      titulo: payload.titulo || '',
      fecha: payload.fecha || '',
      hora: payload.hora || '',
      link: payload.link || '',
      estado: payload.estado || 'PENDIENTE',
      creado: ahoraTexto()
    };
    appendRow_(CONFIG.SHEETS.SESIONES, row);
    return ok(row);
  } catch (e) {
    return fail(e.message);
  }
}

function apiCrearSesion(payload) {
  try {
    const row = {
      id_sesion: generarId('SES'),
      id_curso: payload.id_curso || '',
      titulo: payload.titulo || '',
      fecha: payload.fecha || '',
      hora: payload.hora || '',
      link: payload.link || '',
      estado: payload.estado || 'PENDIENTE',
      creado: ahoraTexto()
    };
    appendRow_(CONFIG.SHEETS.SESIONES, row);
    return ok(row);
  } catch (e) {
    return fail(e.message);
  }
}