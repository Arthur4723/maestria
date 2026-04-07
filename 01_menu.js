function onOpen() {
  ensureSheets_();

  SpreadsheetApp.getUi()
    .createMenu('Maestría SPA')
    .addItem('Abrir aplicación', 'openApp')
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

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}