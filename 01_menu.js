/**
 * ARCHIVO: 01_menu.js
 */

function onOpen() {
  ensureSheets_();

  SpreadsheetApp.getUi()
    .createMenu('Maestría SPA')
    .addItem('Abrir aplicación', 'openApp')
    .addSeparator()
    .addItem('🧪 Abrir Master Tester E2E', 'abrirMasterTester')
    .addSeparator()
    .addItem('Inicializar hojas', 'ensureSheets_')
    .addToUi();
}

function openApp() {
  const html = HtmlService
    .createTemplateFromFile('03_app')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .setWidth(1350)
    .setHeight(850);

  SpreadsheetApp.getUi().showModalDialog(html, CONFIG.APP_TITLE);
}

function abrirMasterTester() {
  const html = HtmlService
    .createTemplateFromFile('99_tester')
    .evaluate()
    .setTitle('Master Tester E2E')
    .setWidth(850)
    .setHeight(650);

  SpreadsheetApp.getUi().showModalDialog(html, 'Master Tester E2E - Maestría SPA');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}