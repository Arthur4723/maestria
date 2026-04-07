function apiGetCursosActivos(payload) {
  try {
    const ciclo = String((payload && payload.ciclo) || '').trim();
    const rows = getAllRows_(CONFIG.SHEETS.GENERAL_CURRICULA)
      .filter(r => String(r.ciclo).trim() === ciclo && String(r.activo).toUpperCase() === 'SI')
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

    return ok(rows);
  } catch (e) {
    return fail(e.message);
  }
}