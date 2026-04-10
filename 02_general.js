/**
 * Se encarga de cargar todo el Estado Central en memoria RAM al iniciar la SPA.
 */
function getNucleoData() {
  try {
    // 1. Obtener Configuración
    const rawConfig = getAllRows_(CONFIG.SHEETS.GENERAL_CONFIG);
    const configObj = {};
    rawConfig.forEach(r => {
      if(r.clave) configObj[r.clave] = r.valor;
    });

    // 2. Obtener Ciclos y Currícula
    const ciclos = getAllRows_(CONFIG.SHEETS.GENERAL_CICLOS);
    const curricula = getAllRows_(CONFIG.SHEETS.GENERAL_CURRICULA);

    // 3. Derivación Arquitectónica Segura
    const cicloActualId = configObj[CONFIG.CONFIG_KEYS.CICLO_ACTUAL];
    let cursosActivos = [];
    
    if (cicloActualId) {
      cursosActivos = curricula.filter(c => {
        // Validación segura: si "activo" está vacío, lo considera "NO"
        const estadoActivo = c.activo ? String(c.activo).toUpperCase().trim() : '';
        return c.ciclo === cicloActualId && estadoActivo === 'SI';
      });
    }

    return {
      success: true,
      data: {
        config: configObj,
        ciclos: ciclos,
        curricula: curricula,
        cursosActivos: cursosActivos
      }
    };

  } catch (error) {
    // Esto asegura que si algo falla, viaja el mensaje al frontend en vez de colapsar la red
    return { success: false, message: error.toString(), stack: error.stack };
  }
}