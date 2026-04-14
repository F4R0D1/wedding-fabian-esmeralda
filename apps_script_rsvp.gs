// ── APPS SCRIPT COMPLETO CON DEDUPLICACIÓN · Fabián & Esmeralda ──

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Fecha y hora','Nombre','Teléfono','Asistencia','Acompañantes','Mensaje','Mesa asignada']);
      var header = sheet.getRange(1, 1, 1, 7);
      header.setBackground('#c9a227');
      header.setFontColor('#ffffff');
      header.setFontWeight('bold');
    }

    var data = JSON.parse(e.postData.contents);
    var accion = data.accion || 'rsvp';

    // ── RSVP desde formulario público ──
    if (accion === 'rsvp') {
      // Verificar duplicado por teléfono primero, luego por nombre
      var duplicado = buscarFilaPorTelefono(sheet, data.telefono) 
                   || buscarFila(sheet, data.nombre);
      if (duplicado > 0) {
        // En vez de duplicar, actualizar sus datos
        actualizarDatos(sheet, duplicado, data);
        return ok('actualizado');
      }
      sheet.appendRow([
        new Date().toLocaleString('es-MX'),
        data.nombre || '',
        data.telefono || '',
        data.asistencia || '',
        data.acompanantes || 0,
        data.mensaje || '',
        'Sin asignar'
      ]);
      colorearAsistencia(sheet, sheet.getLastRow(), data.asistencia);
      return ok('rsvp_guardado');
    }

    // ── Nuevo invitado desde panel de mesas ──
    if (accion === 'nuevo_invitado') {
      var filaPhone = data.telefono ? buscarFilaPorTelefono(sheet, data.telefono) : 0;
      var filaNombre = buscarFila(sheet, data.nombre);

      if (filaPhone > 0) {
        return ok('duplicado_telefono'); // HTML mostrará aviso
      }
      if (filaNombre > 0) {
        return ok('duplicado_nombre');   // HTML mostrará aviso
      }

      sheet.appendRow([
        new Date().toLocaleString('es-MX'),
        data.nombre || '',
        data.telefono || '',
        data.asistencia || 'Pendiente',
        data.acompanantes || 0,
        '',
        data.mesa || 'Sin asignar'
      ]);
      colorearAsistencia(sheet, sheet.getLastRow(), data.asistencia);
      return ok('invitado_agregado');
    }

    // ── Actualizar solo mesa (drag & drop) ──
    if (accion === 'actualizar_mesa') {
      var fila = buscarFila(sheet, data.nombre);
      if (fila > 0) sheet.getRange(fila, 7).setValue(data.mesa || 'Sin asignar');
      return ok('mesa_actualizada');
    }

    // ── Actualizar todos los datos (modal) ──
    if (accion === 'actualizar_invitado') {
      var fila = buscarFila(sheet, data.nombre);
      if (fila > 0) {
        actualizarDatos(sheet, fila, data);
      }
      return ok('invitado_actualizado');
    }

    return ok('accion_desconocida');

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── HELPERS ──

// Busca por nombre exacto en columna B
function buscarFila(sheet, nombre) {
  if (!nombre) return 0;
  var datos = sheet.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][1] && datos[i][1].toString().toLowerCase().trim() === nombre.toLowerCase().trim()) {
      return i + 1;
    }
  }
  return 0;
}

// Busca por teléfono en columna C (ignora vacíos)
function buscarFilaPorTelefono(sheet, telefono) {
  if (!telefono || telefono.trim() === '') return 0;
  // Limpiar: solo dígitos para comparar
  var telLimpio = telefono.replace(/\D/g, '');
  if (telLimpio.length < 7) return 0; // teléfono muy corto, no comparar
  var datos = sheet.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    var celda = datos[i][2] ? datos[i][2].toString().replace(/\D/g, '') : '';
    if (celda.length >= 7 && celda === telLimpio) {
      return i + 1;
    }
  }
  return 0;
}

// Actualiza campos en una fila existente
function actualizarDatos(sheet, fila, data) {
  if (data.nombre     !== undefined) sheet.getRange(fila, 2).setValue(data.nombre);
  if (data.telefono   !== undefined) sheet.getRange(fila, 3).setValue(data.telefono);
  if (data.asistencia !== undefined) {
    sheet.getRange(fila, 4).setValue(data.asistencia);
    colorearAsistencia(sheet, fila, data.asistencia);
  }
  if (data.acompanantes !== undefined) sheet.getRange(fila, 5).setValue(data.acompanantes);
  if (data.mensaje    !== undefined) sheet.getRange(fila, 6).setValue(data.mensaje);
  if (data.mesa       !== undefined) sheet.getRange(fila, 7).setValue(data.mesa);
  // Actualizar fecha de modificación
  sheet.getRange(fila, 1).setValue(new Date().toLocaleString('es-MX') + ' (actualizado)');
}

function colorearAsistencia(sheet, fila, asistencia) {
  var celda = sheet.getRange(fila, 4);
  if (asistencia === 'Confirmado') {
    celda.setBackground('#d4edda').setFontColor('#1a6b3c');
  } else if (asistencia === 'No asiste') {
    celda.setBackground('#f8d7da').setFontColor('#8b1a1a');
  } else {
    celda.setBackground('#fff3cd').setFontColor('#856404');
  }
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', mensaje: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── PRUEBAS MANUALES ──
function testDuplicadoTelefono() {
  // Primero agrega uno
  doPost({ postData: { contents: JSON.stringify({
    accion: 'nuevo_invitado', nombre: 'Ana López', telefono: '3311234567',
    asistencia: 'Confirmado', acompanantes: 0
  })}});
  // Intenta agregar con mismo teléfono — debe retornar duplicado_telefono
  var r = doPost({ postData: { contents: JSON.stringify({
    accion: 'nuevo_invitado', nombre: 'Ana López Duplicada', telefono: '331 123 4567',
    asistencia: 'Pendiente', acompanantes: 1
  })}});
  Logger.log(r.getContent()); // Esperado: duplicado_telefono
}