// =========================================================================
// MÓDULO 01: MENÚ INSTITUCIONAL
// =========================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎓 Maestría SPA')
    .addItem('🚀 Abrir Gestor', 'abrirSistemaGestor')
    .addSeparator()
    .addItem('⚙️ Tester del Sistema', 'abrirTesteador')
    .addToUi();
}

/**
 * Levanta la aplicación SPA en una ventana modal de gran tamaño
 * como fue solicitado, evitando el Sidebar restrictivo.
 */
function abrirSistemaGestor() {
  const html = HtmlService.createTemplateFromFile('10_App')
    .evaluate()
    .setTitle('Gestor de Maestría SPA')
    .setWidth(1200)
    .setHeight(850);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestor de Maestría SPA');
}

/**
 * Ventana independiente para el Tester RAM-First
 */
function abrirTesteador() {
  const html = HtmlService.createTemplateFromFile('99_Tester')
    .evaluate()
    .setTitle('Tester del Sistema')
    .setWidth(1000)
    .setHeight(700);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Auditoría RAM-First');
}