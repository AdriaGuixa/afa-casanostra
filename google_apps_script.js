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


/**
 * Trigger automàtic de Google Sheets:
 * - Assigna el codi de soci (AFA-2026-XXX) a la columna A quan s'introdueix informació a les columnes B..G.
 * - Esborra el codi de la columna A si es buiden totes les columnes (B, C, D, E, F i G).
 */
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  
  var filaInici = range.getRow();
  var filaFinal = range.getLastRow();
  var colInici = range.getColumn();
  var colFinal = range.getLastColumn();
  
  // Només actuar si l'edició afecta files de dades (fila >= 2)
  // i toca alguna de les columnes B a G (columnes 2 a 7)
  if (filaFinal >= 2 && colInici <= 7 && colFinal >= 2) {
    var filaMinima = Math.max(filaInici, 2);
    
    for (var f = filaMinima; f <= filaFinal; f++) {
      var celdaSoci = sheet.getRange(f, 1);
      
      // Llegim les columnes B a G d'aquesta fila (6 columnes: B, C, D, E, F, G)
      var valorsFila = sheet.getRange(f, 2, 1, 6).getValues()[0];
      
      // Comprovem si totes les columnes B, C, D, E, F i G estan completament buides
      var totaBuida = valorsFila.every(function(val) {
        return val === "" || val === null || val === undefined || String(val).trim() === "";
      });
      
      if (totaBuida) {
        // Si no hi ha cap dada a B, C, D, E, F i G -> esborrem el codi de la columna A
        celdaSoci.clearContent();
      } else {
        // Si hi ha com a mínim alguna dada i la columna A està buida -> generem el codi automàtic
        if (celdaSoci.getValue() === "") {
          var numSeq = String(f - 1).padStart(3, "0");
          celdaSoci.setValue("AFA-2026-" + numSeq);
        }
      }
    }
  }
}
