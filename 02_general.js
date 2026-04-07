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
    const ciclosHeaders = ['id_ciclo', 'anio', 'nombre_ciclo', 'orden', 'activo', 'creado'];
    const curriculaHeaders = ['id_curricula', 'ciclo', 'codigo', 'nombre', 'creditos', 'activo', 'orden', 'dias', 'horario', 'link', 'observaciones', 'creado'];

    replaceAllRows_(CONFIG.SHEETS.GENERAL_CONFIG, configHeaders, payload.config || []);
    replaceAllRows_(CONFIG.SHEETS.GENERAL_CICLOS, ciclosHeaders, payload.ciclos || []);
    replaceAllRows_(CONFIG.SHEETS.GENERAL_CURRICULA, curriculaHeaders, payload.curricula || []);

    return ok(true);
  } catch (e) {
    return fail(e.message);
  }
}