function doPost(e) {
  // Inicialitzar
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var payload = JSON.parse(e.postData.contents);
  var formName = payload.formName || "Formulari General";
  var dades = payload.dades || {};
  var totalPagat = payload.totalPagat || "0";
  
  // Buscar la pestanya (tab) pel nom del formulari. Si no existeix, la creem.
  var currentSheet = sheet.getSheetByName(formName);
  if (!currentSheet) {
    currentSheet = sheet.insertSheet(formName);
  }
  
  // Si la pestanya està buida, hem de crear la fila 1 amb els títols de les columnes
  if (currentSheet.getLastRow() === 0) {
    var headers = Object.keys(dades);
    headers.push("Total Pagat", "Data Inscripció");
    currentSheet.appendRow(headers);
    // Donar estil de "negreta" a la fila dels títols
    currentSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    currentSheet.setFrozenRows(1); // Bloquejar la primera fila a dalt
  }
  
  // Inserir la nova fila amb les respostes de l'usuari
  var headersActuals = currentSheet.getRange(1, 1, 1, currentSheet.getLastColumn()).getValues()[0];
  var valorsFila = [];
  
  for (var i = 0; i < headersActuals.length; i++) {
    var header = headersActuals[i];
    if (header === "Total Pagat") {
      valorsFila.push(totalPagat + " €");
    } else if (header === "Data Inscripció") {
      valorsFila.push(new Date());
    } else {
      // Posar la dada corresponent. Si falta algun camp, deixar-ho en blanc.
      valorsFila.push(dades[header] || "");
    }
  }
  
  currentSheet.appendRow(valorsFila);
  
  // Retornar missatge d'èxit cap a la web
  return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
