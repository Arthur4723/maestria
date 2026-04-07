function generarId(prefijo) {
  return prefijo + '_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

function ahoraTexto() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function ok(data) {
  return { ok: true, data: data || null };
}

function fail(message) {
  return { ok: false, message: message || 'Error no controlado' };
}

function toUpperSafe(value) {
  return String(value == null ? '' : value).trim().toUpperCase();
}

function toNumberSafe(value, fallback) {
  const n = Number(value);
  return isNaN(n) ? (fallback || 0) : n;
}