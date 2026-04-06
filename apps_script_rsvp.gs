// ── APPS SCRIPT BODA FABIÁN & ESMERALDA ──
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    if (sheet.getLastRow() === 0) {
      var h = sheet.getRange(1,1,1,7);
      h.setValues([['Fecha y hora','Nombre','Teléfono','Asistencia','Acompañantes','Mensaje','Mesa asignada']]);
      h.setBackground('#c9a227').setFontColor('#ffffff').setFontWeight('bold');
    }
    if (data.accion === 'actualizar_mesa') {
      var lastRow = sheet.getLastRow();
      if(lastRow > 1){
        var nombres = sheet.getRange(2, 2, lastRow-1, 1).getValues();
        for (var i=0; i<nombres.length; i++) {
          if(nombres[i][0].toString().toLowerCase()===data.nombre.toLowerCase()){
            sheet.getRange(i+2,7).setValue(data.mesa||'Sin asignar');
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
    }
    sheet.appendRow([new Date().toLocaleString('es-MX'),data.nombre||'',data.telefono||'',data.asistencia||'',data.acompanantes||0,data.mensaje||'','Sin asignar']);
    var lr = sheet.getLastRow();
    if(data.asistencia==='Confirmado') sheet.getRange(lr,4).setBackground('#d4edda').setFontColor('#1a6b3c');
    else if(data.asistencia==='No asiste') sheet.getRange(lr,4).setBackground('#f8d7da').setFontColor('#8b1a1a');
    return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error',mensaje:err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
