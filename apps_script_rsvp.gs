// ── APPS SCRIPT PARA RSVP BODA FABIÁN & ESMERALDA ──
// Pega este código en tu Apps Script y vuelve a implementar

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Fecha y hora',
        'Nombre',
        'Teléfono',
        'Asistencia',
        'Acompañantes',
        'Mensaje',
        'Mesa asignada'
      ]);
      // Formato encabezados
      var header = sheet.getRange(1, 1, 1, 7);
      header.setBackground('#c9a227');
      header.setFontColor('#ffffff');
      header.setFontWeight('bold');
    }

    // Parsear datos recibidos
    var data = JSON.parse(e.postData.contents);

    // Agregar fila con los datos
    sheet.appendRow([
      new Date().toLocaleString('es-MX'),
      data.nombre || '',
      data.telefono || '',
      data.asistencia || '',
      data.acompanantes || 0,
      data.mensaje || '',
      'Sin asignar'
    ]);

    // Colorear según asistencia
    var lastRow = sheet.getLastRow();
    if (data.asistencia === 'Confirmado') {
      sheet.getRange(lastRow, 4).setBackground('#d4edda').setFontColor('#1a6b3c');
    } else {
      sheet.getRange(lastRow, 4).setBackground('#f8d7da').setFontColor('#8b1a1a');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', mensaje: 'Guardado correctamente' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función de prueba — ejecuta esto manualmente para verificar
function testRSVP() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        nombre: 'Juan Pérez (Prueba)',
        telefono: '3461234567',
        asistencia: 'Confirmado',
        acompanantes: 2,
        mensaje: 'Con mucho gusto asistiremos'
      })
    }
  };
  var result = doPost(testData);
  Logger.log(result.getContent());
}
