"use strict";

function pesos(valor) {
  return valor.toLocaleString("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 });
}
function sumar(billetes) {
  return billetes.reduce((total, valor) => total + valor, 0);
}
function cantidadEnCarrito(id) {
  return carrito.get(id) || 0;
}
function cantidadCarrito(id) {
  return cantidadEnCarrito(id);
}
function totalCarrito() {
  return productos.reduce((total, producto) => total + importeProducto(producto, cantidadEnCarrito(producto.id)), 0);
}
function unidadesCarrito() {
  return Array.from(carrito.values()).reduce((suma, cantidad) => suma + cantidad, 0);
}
function contarBilletes(lista, valor) {
  return lista.filter(item => item === valor).length;
}
function stockDisponible(valor, lista = billetesVuelto) {
  return caja.billetes[valor] - contarBilletes(lista, valor);
}
function puedeAgregarBilleteVuelto(valor) {
  return etapa === "vuelto" &&
    denominaciones.includes(valor) &&
    stockDisponible(valor) > 0 &&
    sumar(billetesVuelto) + valor <= vueltoEsperado;
}
function resumirBilletes(lista) {
  return denominaciones.map(denominacion => ({ denominacion, cantidad:contarBilletes(lista, denominacion) })).filter(item => item.cantidad > 0);
}
function textoBilletes(lista) {
  const detalle = resumirBilletes(lista);
  return detalle.length ? detalle.map(item => pesos(item.denominacion) + " × " + item.cantidad).join(", ") : "Sin billetes";
}
function registrarMovimientoStock(tipo, producto, cantidad, referencia) {
  movimientosStock.push({ fecha:new Date().toISOString(), tipo, productId:producto.id, producto:producto.nombre, cantidad, referencia:referencia || "" });
}
function registrarMovimiento(tipo, billetes, motivo, pagoId, importe) {
  registrarMovimientoDetalle(tipo, resumirBilletes(billetes), motivo, pagoId, importe);
}
function registrarMovimientoDetalle(tipo, detalles, motivo, pagoId, importe) {
  movimientosCaja.push({ fecha:new Date().toISOString(), tipo, detalles, motivo, pagoId:pagoId || null, sesionId:sesionActual ? sesionActual.id : null, importe });
}
function totalCaja() {
  return denominaciones.reduce((total, valor) => total + valor * caja.billetes[valor], 0);
}
function redondearCantidad(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
function mostrarCantidad(producto, cantidad) {
  if (producto.unidad === "kg") {
    return new Intl.NumberFormat("es-AR", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(cantidad) + " kg";
  }
  return String(cantidad) + " u.";
}
function importeProducto(producto, cantidad) {
  return Math.round(producto.precio * cantidad);
}

let flujoEscanerCodigo=null;
let streamEscanerCodigo=null;
let generacionEscanerCodigo=0;
let temporizadorEscanerCodigo=null;
function cerrarEscanerCodigo(){generacionEscanerCodigo++;if(temporizadorEscanerCodigo){clearTimeout(temporizadorEscanerCodigo);temporizadorEscanerCodigo=null;}if(streamEscanerCodigo){streamEscanerCodigo.getTracks().forEach(track=>track.stop());streamEscanerCodigo=null;}const video=$("#barcode-video");if(video)video.srcObject=null;const modal=$("#barcode-scanner");if(modal){modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");}document.body.classList.remove("scanner-open");flujoEscanerCodigo=null;}
async function iniciarEscanerCodigo(alRecibir){const generacion=++generacionEscanerCodigo;flujoEscanerCodigo=alRecibir;const modal=$("#barcode-scanner");modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");document.body.classList.add("scanner-open");$("#barcode-status").textContent="Apuntá la cámara al código de barras.";const video=$("#barcode-video");if(!window.isSecureContext){$("#barcode-status").textContent="La cámara requiere abrir la app desde HTTPS o localhost. ";return;}if(!navigator.mediaDevices?.getUserMedia){$("#barcode-status").textContent="Este navegador no permite acceder a la cámara. Probá con un navegador compatible.";return;}if(!("BarcodeDetector" in window)){ $("#barcode-status").textContent="Este navegador no admite lectura de códigos por cámara. Probá con un navegador compatible.";return;}try{let formatos=["ean_13","ean_8","upc_a","upc_e","code_128","code_39","itf","qr_code"];if(BarcodeDetector.getSupportedFormats){const soportados=await BarcodeDetector.getSupportedFormats();formatos=formatos.filter(formato=>soportados.includes(formato));}if(!formatos.length)throw new Error("No hay formatos de código compatibles.");const detector=new BarcodeDetector({formats:formatos});const nuevoStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});if(generacion!==generacionEscanerCodigo){nuevoStream.getTracks().forEach(track=>track.stop());return;}streamEscanerCodigo=nuevoStream;video.srcObject=streamEscanerCodigo;await video.play();$("#barcode-status").textContent="Cámara activa. Centrá el código dentro del cuadro.";const leer=async()=>{if(!streamEscanerCodigo||modal.classList.contains("hidden"))return;try{const resultados=await detector.detect(video);if(resultados.length){const codigo=resultados[0].rawValue;if(codigo){const callback=flujoEscanerCodigo;cerrarEscanerCodigo();callback?.(codigo);return;}}}catch(error){}temporizadorEscanerCodigo=setTimeout(leer,180);};leer();}catch(error){if(streamEscanerCodigo){streamEscanerCodigo.getTracks().forEach(track=>track.stop());streamEscanerCodigo=null;}$("#barcode-status").textContent="No se pudo iniciar la cámara. Revisá el permiso de cámara del navegador.";}}
