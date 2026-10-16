"use strict";
let filtroBusquedaCompra="";

function abrirCarritoCompra(){const overlay=$("#purchase-cart-overlay");if(!overlay)return;overlay.classList.remove("hidden");overlay.setAttribute("aria-hidden","false");$("#purchase-cart-open")?.setAttribute("aria-expanded","true");document.body.classList.add("cart-open");$("#purchase-cart-close").focus();}
function plegarCarritoCompra(enfocar=true){const overlay=$("#purchase-cart-overlay");if(!overlay)return;overlay.classList.add("hidden");overlay.setAttribute("aria-hidden","true");$("#purchase-cart-open")?.setAttribute("aria-expanded","false");document.body.classList.remove("cart-open");if(enfocar)$("#purchase-cart-open")?.focus();}

function renderReportes() {
  const area=$("#reports-area");area.replaceChildren();
  const periodo=document.createElement("select");periodo.className="reports-period-select";periodo.setAttribute("aria-label","Período del reporte");
  [["30","Últimos 30 días"],["7","Últimos 7 días"],["todo","Todo el historial"]].forEach(([valor,texto])=>{const op=document.createElement("option");op.value=valor;op.textContent=texto;periodo.append(op);});
  const panel=document.createElement("section");panel.className="panel reports-summary-panel";const filtro=document.createElement("label");filtro.className="reports-period-filter";const filtroTexto=document.createElement("span");filtroTexto.textContent="Período del reporte";filtro.append(filtroTexto,periodo);panel.append(filtro);
  const resumen=document.createElement("div");panel.append(resumen);
  const ventasBox=document.createElement("section");ventasBox.className="panel reports-detail-panel";const ventasTitulo=document.createElement("h3");ventasTitulo.className="reports-panel-heading";ventasTitulo.textContent="Productos más vendidos";ventasBox.append(ventasTitulo);
  const comprasBox=document.createElement("section");comprasBox.className="panel reports-detail-panel";const comprasTitulo=document.createElement("h3");comprasTitulo.className="reports-panel-heading";comprasTitulo.textContent="Compras por proveedor";comprasBox.append(comprasTitulo);
  const actualizar=()=>{
    const desde=periodo.value==="todo"?0:Date.now()-Number(periodo.value)*86400000;
    const ventasPeriodo=ventas.filter(v=>new Date(v.fecha).getTime()>=desde);const ids=new Set(ventasPeriodo.map(v=>v.id));
    const totalVentas=ventasPeriodo.reduce((s,v)=>s+v.total,0);const cobrado=pagos.filter(p=>new Date(p.fecha).getTime()>=desde).reduce((s,p)=>{if(p.cuentaPorCobrarId)return s+p.importe;if(p.ventaId&&p.medio!=="cuenta_corriente"){const venta=ventas.find(v=>v.id===p.ventaId);return s+(venta?venta.total:0);}return s;},0);const ventasConCosto=ventasPeriodo.map(venta=>{const lineas=detallesVenta.filter(detalle=>detalle.ventaId===venta.id);if(!lineas.length||!lineas.every(detalle=>Number.isFinite(detalle.costoUnitario)&&detalle.costoUnitario>0))return null;const costo=lineas.reduce((suma,detalle)=>suma+Math.round(detalle.cantidad*detalle.costoUnitario),0);return{venta,costo,ganancia:venta.total-costo};}).filter(Boolean);const costoProductosPeriodo=ventasConCosto.reduce((suma,item)=>suma+item.costo,0);const gananciaBrutaPeriodo=ventasConCosto.reduce((suma,item)=>suma+item.ganancia,0);
    const pendiente=cuentasPorCobrar.reduce((s,c)=>s+c.saldo,0);
    resumen.replaceChildren();resumen.className="reports-kpis";
    [["Ventas",String(ventasPeriodo.length)],["Total vendido",pesos(totalVentas)],["Cobrado en el período",pesos(cobrado)],["Cuentas pendientes",pesos(pendiente)],["Ventas con costo registrado",String(ventasConCosto.length)],["Costo de productos",pesos(costoProductosPeriodo)],["Ganancia bruta estimada",pesos(gananciaBrutaPeriodo)]].forEach(([label,value])=>{const fila=document.createElement("div");fila.className="reports-kpi";const l=document.createElement("span");l.className="reports-kpi-label";l.textContent=label;const v=document.createElement("strong");v.className="reports-kpi-value";v.textContent=value;fila.append(l,v);resumen.append(fila);});
    const top=new Map();detallesVenta.filter(d=>ids.has(d.ventaId)).forEach(d=>{const actual=top.get(d.productId)||{nombre:d.nombre,cantidad:0,importe:0};actual.cantidad+=d.cantidad;actual.importe+=Math.round(d.cantidad*d.precio);top.set(d.productId,actual);});
    ventasBox.querySelectorAll(".report-row,.history-empty").forEach(el=>el.remove());
    const topRows=[...top.values()].sort((a,b)=>b.cantidad-a.cantidad).slice(0,8);if(!topRows.length){const vacio=document.createElement("div");vacio.className="history-empty";vacio.textContent="Todavía no hay ventas en este período.";ventasBox.append(vacio);}topRows.forEach(x=>{const row=document.createElement("div");row.className="report-row reports-data-row";const nombre=document.createElement("strong");nombre.className="reports-data-name";nombre.textContent=x.nombre;const meta=document.createElement("span");meta.className="reports-data-meta";meta.textContent="Cantidad vendida: "+mostrarCantidad(productos.find(p=>p.nombre===x.nombre)||{unidad:"u"},x.cantidad);const importe=document.createElement("strong");importe.className="reports-data-value";importe.textContent=pesos(x.importe);const info=document.createElement("div");info.className="reports-data-info";info.append(nombre,meta);row.append(info,importe);ventasBox.append(row);});
    const comprasPeriodo=compras.filter(c=>new Date(c.fecha).getTime()>=desde);const porProveedor=new Map();comprasPeriodo.forEach(c=>porProveedor.set(c.proveedor,(porProveedor.get(c.proveedor)||0)+c.total));
    comprasBox.querySelectorAll(".report-row,.history-empty").forEach(el=>el.remove());if(!porProveedor.size){const vacio=document.createElement("div");vacio.className="history-empty";vacio.textContent="Todavía no hay compras en este período.";comprasBox.append(vacio);}porProveedor.forEach((total,nombre)=>{const row=document.createElement("div");row.className="receipt-line report-row reports-data-row";const proveedor=document.createElement("strong");proveedor.className="reports-data-name";proveedor.textContent=nombre;const importe=document.createElement("strong");importe.className="reports-data-value";importe.textContent=pesos(total);row.append(proveedor,importe);comprasBox.append(row);});
  };
  periodo.addEventListener("change",actualizar);actualizar();area.append(panel,ventasBox,comprasBox);
  const backup=document.createElement("section");backup.className="panel reports-backup-panel";const title=document.createElement("h3");title.className="reports-panel-heading";title.textContent="Respaldo de datos";const note=document.createElement("p");note.className="muted";note.textContent="Los cambios se guardan automáticamente en IndexedDB de este navegador. Exportá una copia para conservarla o importala para restaurar los datos.";const status=document.createElement("div");status.id="backup-status";status.className="notice";status.textContent=mensajePersistencia;
  const actions=document.createElement("div");actions.className="reports-backup-actions";const exportar=document.createElement("button");exportar.type="button";exportar.className="secondary";exportar.textContent="↓ Exportar copia";exportar.addEventListener("click",exportarRespaldo);
  const importarLabel=document.createElement("label");importarLabel.className="secondary reports-import-button";importarLabel.append(document.createTextNode("↑ Importar copia"));const importar=document.createElement("input");importar.type="file";importar.accept=".json,application/json";importar.setAttribute("aria-label","Importar respaldo JSON");importar.addEventListener("change",async evento=>{const archivo=evento.target.files&&evento.target.files[0];if(!archivo)return;try{const datos=JSON.parse(await archivo.text());if(!aplicarRespaldo(datos))throw new Error("Formato inválido");await guardarEstado();renderTodo();const nuevoStatus=$("#backup-status");if(nuevoStatus)nuevoStatus.textContent="Respaldo importado correctamente.";}catch(error){const nuevoStatus=$("#backup-status");if(nuevoStatus)nuevoStatus.textContent="No se pudo importar: revisá que sea un respaldo válido.";}});
  importarLabel.append(importar);actions.append(exportar,importarLabel);backup.append(title,note,status,actions);area.append(backup);
}
function renderClientes() {
  const area = $("#clients-area"); area.replaceChildren();
  const panel = document.createElement("section"); panel.className = "panel";
  const titulo = document.createElement("h3"); titulo.textContent = "Clientes registrados"; panel.append(titulo);
  const lista = document.createElement("div"); lista.className = "history-items";
  if (!clientes.length) { const vacio = document.createElement("div"); vacio.className = "history-empty"; vacio.textContent = "Todavía no hay clientes registrados."; lista.append(vacio); }
  clientes.forEach(cliente => { const fila = document.createElement("article"); fila.className = "stock-item"; const nombre = document.createElement("strong"); nombre.textContent = cliente.nombre; fila.append(nombre); if (cliente.contacto) { const contacto = document.createElement("span"); contacto.className = "muted"; contacto.textContent = cliente.contacto; fila.append(contacto); } lista.append(fila); });
  const form = document.createElement("form"); form.className = "stock-product-row";
  const nombre = document.createElement("input"); nombre.type = "text"; nombre.placeholder = "Nombre del cliente"; nombre.required = true;
  const contacto = document.createElement("input"); contacto.type = "text"; contacto.placeholder = "Teléfono o contacto (opcional)";
  const guardar = document.createElement("button"); guardar.type = "submit"; guardar.className = "secondary"; guardar.textContent = "Agregar cliente";
  form.append(nombre, contacto, guardar);
  form.addEventListener("submit", evento => { evento.preventDefault(); const valor = nombre.value.trim(); if (!valor) return; clientes.push({ id:Date.now(), nombre:valor, contacto:contacto.value.trim() }); renderClientes(); });
  panel.append(lista, form); area.append(panel);
}
function renderProveedores() {
  const area = $("#providers-area"); area.replaceChildren();
  const panel = document.createElement("section"); panel.className = "panel";
  const lista = document.createElement("div"); lista.className = "history-items";
  if (!proveedores.length) { const vacio = document.createElement("p"); vacio.className = "muted"; vacio.textContent = "Todavía no hay proveedores registrados."; lista.append(vacio); }
  proveedores.forEach(proveedor => { const fila = document.createElement("div"); fila.className = "stock-item"; fila.textContent = proveedor.nombre + (proveedor.contacto ? " · " + proveedor.contacto : ""); lista.append(fila); });
  const form = document.createElement("form"); form.className = "stock-product-row";
  const nombre = document.createElement("input"); nombre.type = "text"; nombre.placeholder = "Nombre del proveedor"; nombre.required = true;
  const contacto = document.createElement("input"); contacto.type = "text"; contacto.placeholder = "Contacto (opcional)";
  const guardar = document.createElement("button"); guardar.type = "submit"; guardar.className = "secondary"; guardar.textContent = "Agregar proveedor";
  form.append(nombre, contacto, guardar);
  form.addEventListener("submit", evento => { evento.preventDefault(); const valor = nombre.value.trim(); if (!valor) return; proveedores.push({ id:Date.now(), nombre:valor, contacto:contacto.value.trim() }); renderProveedores(); });
  panel.append(lista, form); area.append(panel);
}
function renderTicketCompra(){
  if(!ticketCompraActual)return;
  const {compra,items}=ticketCompraActual;const area=$("#purchases-area");
  const ticket=document.createElement("section");ticket.id="purchase-ticket";ticket.className="receipt";
  const titulo=document.createElement("h2");titulo.textContent="Ticket · Compra "+compra.id;
  const estado=document.createElement("div");estado.className="muted";estado.textContent=compra.medioPago==="fiado"?"Compra registrada · saldo pendiente":"Compra registrada";
  const datos=document.createElement("div");datos.className="history-meta";datos.textContent=(compra.proveedor||"Sin proveedor")+" · "+new Date(compra.fecha).toLocaleString("es-AR");
  const lista=document.createElement("ul");lista.className="receipt-list";
  items.forEach(item=>{const fila=document.createElement("li");fila.className="receipt-line";const descripcion=document.createElement("div");const nombre=document.createElement("strong");nombre.textContent=item.nombre;const meta=document.createElement("small");const cantidad=item.cantidad%1===0?String(item.cantidad):new Intl.NumberFormat("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(item.cantidad);meta.textContent=pesos(item.costo)+" c/u · "+cantidad;descripcion.append(nombre,document.createElement("br"),meta);const subtotal=document.createElement("strong");subtotal.textContent=pesos(Math.round(item.costo*item.cantidad));fila.append(descripcion,subtotal);lista.append(fila);});
  const total=document.createElement("div");total.className="receipt-total";total.innerHTML="<span>Total</span><strong>"+pesos(compra.total)+"</strong>";
  const valores=document.createElement("div");valores.className="receipt-values";
  const medio=compra.medioPago==="mercado_pago"?"Mercado Pago":compra.medioPago==="transferencia"?"Transferencia":compra.medioPago==="fiado"?"Fiado":"Efectivo";
  const filas=compra.medioPago==="efectivo"?[["Medio de pago",medio],["Dinero entregado",compra.efectivoEntregado||0],["Vuelto recibido",compra.vueltoRecibido||0]]:[["Medio de pago",medio],[compra.medioPago==="fiado"?"Saldo pendiente":"Importe",compra.total]];
  filas.forEach(([etiqueta,importe])=>{const fila=document.createElement("div");fila.className="receipt-line";const texto=document.createElement("span");texto.textContent=etiqueta;const numero=document.createElement("strong");numero.textContent=pesos(importe);fila.append(texto,numero);valores.append(fila);});
  const nueva=document.createElement("button");nueva.type="button";nueva.className="primary wide";nueva.textContent="Nueva compra";nueva.addEventListener("click",()=>{ticketCompraActual=null;renderComprasProveedores();});
  ticket.append(titulo,estado,datos,lista,total,valores,nueva);area.append(ticket);
}

function renderComprasProveedores() {
  const area = $("#purchases-area"); area.replaceChildren();
  if(ticketCompraActual){renderTicketCompra();return;}
  if(!sesionActual){const aviso=document.createElement("div");aviso.className="notice";aviso.textContent="Abrí un turno de caja para habilitar las compras.";area.append(aviso);}

  if (avisoCompra) { const notice = document.createElement("div"); notice.className = "notice"; notice.textContent = avisoCompra; area.append(notice); }
  if (pagoCompraActivo) {
    const pagoPanel=document.createElement("section");pagoPanel.className="panel";
    const tituloPago=document.createElement("h3");tituloPago.textContent="Pago de la compra";
    const proveedor=proveedores.find(item=>String(item.id)===String(proveedorCompraSeleccionado));const nombreProveedor=proveedor?proveedor.nombre:proveedorCompraSeleccionado==="__sin_proveedor__"?"Sin proveedor":"Proveedor";const nombreMedio=medioPagoCompra==="mercado_pago"?"Mercado Pago":medioPagoCompra==="transferencia"?"Transferencia":medioPagoCompra==="fiado"?"Fiado":"Efectivo";const info=document.createElement("div");info.className="summary";info.innerHTML="<span>"+nombreProveedor+" · "+nombreMedio+" · Total de compra</span><strong>"+pesos(totalBorradorCompra())+"</strong>";
    const digital=medioPagoCompra!=="efectivo";const sumaEntregada=sumar(billetesPagoCompra);const cambioPendiente=Math.max(0,sumaEntregada-totalBorradorCompra());
    const tituloEtapa=document.createElement("h3");tituloEtapa.textContent=etapaBilletesCompra==="entrega"?"Billetes que entregás":"Billetes de vuelto que recibiste";
    const opciones=document.createElement("div");opciones.className="change-actions bill-selector-row";
    const contenedorBilletes=document.createElement("div");contenedorBilletes.className="purchase-bill-container";contenedorBilletes.setAttribute("aria-label",etapaBilletesCompra==="entrega"?"Billetes seleccionados para entregar":"Billetes de vuelto seleccionados");
    const listaActiva=etapaBilletesCompra==="entrega"?billetesPagoCompra:billetesVueltoCompra;const claseActiva=etapaBilletesCompra==="entrega"?"egreso":"ingreso";
    listaActiva.forEach(valor=>{const ficha=document.createElement("div");ficha.className="chosen "+claseActiva;ficha.style.backgroundImage="url(./img/billetes/"+valor+".png)";ficha.setAttribute("role","img");ficha.setAttribute("aria-label","Billete de "+pesos(valor));ficha.title="Billete de "+pesos(valor);contenedorBilletes.append(ficha);});
    const totalSeleccion=document.createElement("div");totalSeleccion.className="notice";
    const volver=document.createElement("button");volver.type="button";volver.className="secondary wide";volver.textContent="Volver al carrito";volver.addEventListener("click",()=>{pagoCompraActivo=false;billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";renderComprasProveedores();});
    let acciones=[];
    if(!digital){
      if(etapaBilletesCompra==="entrega"){
        denominaciones.forEach(valor=>{const boton=document.createElement("button");boton.type="button";boton.className="bill egreso";boton.style.backgroundImage="url(./img/billetes/"+valor+".png)";boton.textContent="";boton.title="Billete de "+pesos(valor);const usados=billetesPagoCompra.filter(item=>item===valor).length;boton.disabled=caja.billetes[valor]-usados<=0;boton.setAttribute("aria-label","Agregar billete de "+pesos(valor)+" a los billetes entregados");boton.addEventListener("click",()=>{if(!boton.disabled){billetesPagoCompra.push(valor);billetesVueltoCompra=[];avisoCompra="";renderComprasProveedores();}});opciones.append(boton);});
        totalSeleccion.textContent="Total entregado: "+pesos(sumaEntregada)+(sumaEntregada<totalBorradorCompra()?" · Falta: "+pesos(totalBorradorCompra()-sumaEntregada):" · Vuelto a recibir: "+pesos(cambioPendiente));
      }else{
        denominaciones.forEach(valor=>{const boton=document.createElement("button");boton.type="button";boton.className="bill ingreso";boton.style.backgroundImage="url(./img/billetes/"+valor+".png)";boton.textContent="";boton.disabled=sumar(billetesVueltoCompra)+valor>cambioPendiente;boton.setAttribute("aria-label","Agregar billete de vuelto de "+pesos(valor));boton.addEventListener("click",()=>{if(!boton.disabled){billetesVueltoCompra.push(valor);avisoCompra="";renderComprasProveedores();}});opciones.append(boton);});
        totalSeleccion.textContent="El proveedor debe devolverte: "+pesos(cambioPendiente)+" · Registrado: "+pesos(sumar(billetesVueltoCompra))+(sumar(billetesVueltoCompra)<cambioPendiente?" · Falta: "+pesos(cambioPendiente-sumar(billetesVueltoCompra)):" · Vuelto completo");
      }
      const deshacer=document.createElement("button");deshacer.type="button";deshacer.className="secondary icon-button";deshacer.textContent="↩️";deshacer.title="Deshacer último";deshacer.setAttribute("aria-label","Deshacer último billete");deshacer.disabled=!listaActiva.length;deshacer.addEventListener("click",()=>{listaActiva.pop();if(etapaBilletesCompra==="entrega")billetesVueltoCompra=[];avisoCompra="";renderComprasProveedores();});
      const limpiar=document.createElement("button");limpiar.type="button";limpiar.className="danger icon-button";limpiar.textContent="🗑️";limpiar.title="Vaciar selección";limpiar.setAttribute("aria-label","Vaciar selección de billetes");limpiar.disabled=!listaActiva.length;limpiar.addEventListener("click",()=>{if(etapaBilletesCompra==="entrega"){billetesPagoCompra=[];billetesVueltoCompra=[];}else billetesVueltoCompra=[];avisoCompra="";renderComprasProveedores();});acciones=[deshacer,limpiar];
    }
    const confirmarPago=document.createElement("button");confirmarPago.type="button";confirmarPago.className="primary wide";confirmarPago.textContent=medioPagoCompra==="fiado"?"Registrar compra fiada":digital?"Confirmar pago y recibir productos":(etapaBilletesCompra==="entrega"?"Continuar a seleccionar el vuelto":"Confirmar compra y actualizar caja");
    if(digital)confirmarPago.disabled=!sesionActual;
    else if(etapaBilletesCompra==="entrega")confirmarPago.disabled=sumaEntregada<totalBorradorCompra();
    else confirmarPago.disabled=sumar(billetesVueltoCompra)!==cambioPendiente;
    confirmarPago.addEventListener("click",()=>{if(digital){finalizarCompra();return;}if(etapaBilletesCompra==="entrega"){if(sumaEntregada<totalBorradorCompra())return;billetesVueltoCompra=[];etapaBilletesCompra="vuelto";avisoCompra="";renderComprasProveedores();return;}finalizarCompra();});
    const filaTotal=document.createElement("div");filaTotal.className="total-row";const grupoAcciones=document.createElement("div");grupoAcciones.className="actions";acciones.forEach(boton=>grupoAcciones.append(boton));filaTotal.append(totalSeleccion,grupoAcciones);
    const botonVolverPaso=document.createElement("button");botonVolverPaso.type="button";botonVolverPaso.className="secondary wide";botonVolverPaso.textContent="Volver a los billetes entregados";botonVolverPaso.classList.toggle("hidden",digital||etapaBilletesCompra!=="vuelto");botonVolverPaso.addEventListener("click",()=>{etapaBilletesCompra="entrega";billetesVueltoCompra=[];renderComprasProveedores();});
    [opciones,contenedorBilletes,filaTotal,tituloEtapa,...acciones].forEach(el=>el.classList.toggle("hidden",digital));
    pagoPanel.append(tituloPago,info,tituloEtapa,opciones,contenedorBilletes,filaTotal,confirmarPago,botonVolverPaso,volver);area.append(pagoPanel);
  } else {
    const panel = document.createElement("section"); panel.className = "panel procurement-panel";
    const proveedorSelect = document.createElement("select"); proveedorSelect.setAttribute("aria-label", "Proveedor de la compra"); const opcionInicial = document.createElement("option"); opcionInicial.value = ""; opcionInicial.textContent = "Elegí un proveedor"; proveedorSelect.append(opcionInicial);
    proveedores.forEach(proveedor => { const opcion = document.createElement("option"); opcion.value = String(proveedor.id); opcion.textContent = proveedor.nombre; proveedorSelect.append(opcion); });
    const opcionSinProveedor=document.createElement("option");opcionSinProveedor.value="__sin_proveedor__";opcionSinProveedor.textContent="Sin proveedor";proveedorSelect.append(opcionSinProveedor);
    if (proveedorCompraSeleccionado) proveedorSelect.value = String(proveedorCompraSeleccionado);
    proveedorSelect.addEventListener("change", () => { proveedorCompraSeleccionado = proveedorSelect.value === "__sin_proveedor__" ? "__sin_proveedor__" : proveedorSelect.value ? Number(proveedorSelect.value) : null; actualizarResumen(); });
    const grupoMedios=document.createElement("fieldset");grupoMedios.className="sale-payment-fieldset";const leyendaMedios=document.createElement("legend");leyendaMedios.textContent="Medio de pago";const opcionesMedio=document.createElement("div");opcionesMedio.className="sale-payment-radios";opcionesMedio.setAttribute("role","radiogroup");opcionesMedio.setAttribute("aria-label","Medio de pago de la compra");[["efectivo","Efectivo"],["transferencia","Transferencia"],["mercado_pago","Mercado Pago"],["fiado","Fiado"]].forEach(([valor,texto])=>{const etiqueta=document.createElement("label");etiqueta.className="sale-payment-radio";const radio=document.createElement("input");radio.type="radio";radio.name="purchase-payment-method";radio.value=valor;radio.checked=medioPagoCompra===valor;const textoMedio=document.createElement("span");textoMedio.textContent=texto;radio.addEventListener("change",()=>{if(!radio.checked||medioPagoCompra===valor)return;medioPagoCompra=valor;billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";avisoCompra="";renderComprasProveedores();});etiqueta.append(radio,textoMedio);opcionesMedio.append(etiqueta);});grupoMedios.append(leyendaMedios,opcionesMedio);
    const escaneoCompra=document.createElement("div");escaneoCompra.className="barcode-entry";escaneoCompra.setAttribute("aria-label","Buscar productos o escanear");const buscarCompra=document.createElement("input");buscarCompra.type="search";buscarCompra.autocomplete="off";buscarCompra.placeholder="Buscar producto por nombre";buscarCompra.setAttribute("aria-label","Buscar producto por nombre");buscarCompra.id="purchase-product-search";buscarCompra.value=filtroBusquedaCompra;const botonCamaraCompra=document.createElement("button");botonCamaraCompra.type="button";botonCamaraCompra.className="secondary";botonCamaraCompra.textContent="📷 Escanear";botonCamaraCompra.addEventListener("click",()=>iniciarEscanerCodigo(agregarProductoCompraPorCodigo));const estadoCodigoCompra=document.createElement("div");estadoCodigoCompra.id="purchase-barcode-status";estadoCodigoCompra.className="barcode-status";estadoCodigoCompra.setAttribute("role","status");escaneoCompra.append(buscarCompra,botonCamaraCompra);
const catalogo = document.createElement("div"); catalogo.className = "catalog"; catalogo.style.margin = "12px 0";
    productos.forEach(producto => { const tarjeta = document.createElement("button"); tarjeta.type = "button"; tarjeta.className = "product"; tarjeta.dataset.productName=producto.nombre.toLocaleLowerCase("es-AR");tarjeta.hidden=Boolean(filtroBusquedaCompra&&!tarjeta.dataset.productName.includes(filtroBusquedaCompra)); tarjeta.disabled=!sesionActual; tarjeta.setAttribute("aria-label",sesionActual?"Agregar "+producto.nombre+" a la compra":"Compra deshabilitada: abrí un turno de caja"); tarjeta.style.color = "var(--text)"; tarjeta.style.textAlign = "left"; const nombre = document.createElement("strong"); nombre.textContent = producto.nombre; const stock = document.createElement("small"); stock.textContent = "Stock actual: " + mostrarCantidad(producto, producto.stock); tarjeta.append(nombre, stock); tarjeta.addEventListener("click", () => { if(!sesionActual)return; const item = borradorCompra.find(linea => linea.productId === producto.id); if (item) item.cantidad = redondearCantidad(item.cantidad + producto.paso); else borradorCompra.push({ productId:producto.id, nombre:producto.nombre, cantidad:producto.paso, costo:Number.isFinite(producto.costo)&&producto.costo>0?producto.costo:null }); renderComprasProveedores(); }); catalogo.append(tarjeta); });
    const carrito=$("#purchase-cart-items");carrito.replaceChildren();
    $("#clear-purchase-cart").disabled=borradorCompra.length===0;
    const totalEl=$("#purchase-cart-total");const continuar=document.createElement("button");continuar.type="button";continuar.id="purchase-cart-checkout";continuar.textContent="Pagar compra";continuar.className="primary wide purchase-checkout-action";const ayudaPago=document.createElement("p");ayudaPago.className="muted purchase-checkout-hint hidden";
    const resumenCarrito=document.createElement("section");resumenCarrito.className="panel purchase-cart-summary";
    
    const abrir=document.createElement("button");abrir.type="button";abrir.className="secondary wide";abrir.id="purchase-cart-open";abrir.setAttribute("aria-expanded",String(!$("#purchase-cart-overlay").classList.contains("hidden")));abrir.addEventListener("click",abrirCarritoCompra);
    const cantidadCarrito=()=>borradorCompra.reduce((suma,item)=>suma+item.cantidad,0);
    const actualizarResumen=()=>{const total=totalBorradorCompra();const etiqueta=document.createElement("span");etiqueta.textContent="Total";const importe=document.createElement("strong");importe.textContent=pesos(total);totalEl.replaceChildren(etiqueta.cloneNode(true),importe.cloneNode(true),continuar,ayudaPago);abrir.textContent="Ver carrito ("+mostrarUnidadesCompra()+")";abrir.setAttribute("aria-expanded",String(!$("#purchase-cart-overlay").classList.contains("hidden")));const motivo=!sesionActual?"Abrí un turno de caja para poder pagar.":!proveedorSelect.value?"Elegí un proveedor.":!borradorCompra.length?"Agregá productos al carrito.":borradorCompra.some(item=>item.costo===null||item.costo<0)?"Ingresá el costo unitario de cada producto.":total<=0?"El total de la compra debe ser mayor a cero.":"";continuar.disabled=Boolean(motivo);ayudaPago.textContent=motivo;ayudaPago.classList.toggle("hidden",!motivo);};
    function mostrarUnidadesCompra(){return new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(cantidadCarrito());}
    borradorCompra.forEach((item,index)=>{const producto=productos.find(p=>p.id===item.productId);if(!producto)return;const fila=document.createElement("div");fila.className="cart-line";const desc=document.createElement("div");const nombre=document.createElement("div");nombre.className="line-name";nombre.textContent=item.nombre;const costo=document.createElement("input");costo.type="text";costo.inputMode="decimal";costo.className="purchase-unit-cost";costo.placeholder=producto.costo>0?pesos(producto.costo):"Sin costo en catálogo";costo.value=item.costo===null?"":String(item.costo);costo.setAttribute("aria-label","Costo de compra por unidad de "+item.nombre);costo.addEventListener("input",()=>{const valor=costo.value.trim().replace(",",".");item.costo=valor===""?null:Number(valor);actualizarResumen();});desc.append(nombre,costo);const controles=document.createElement("div");controles.className="quantity";const menos=document.createElement("button");menos.type="button";menos.textContent="−";menos.disabled=item.cantidad<=producto.paso;menos.setAttribute("aria-label","Quitar una cantidad de "+producto.nombre);menos.addEventListener("click",()=>{item.cantidad=redondearCantidad(item.cantidad-producto.paso);renderComprasProveedores();});const numero=document.createElement("strong");numero.textContent=mostrarCantidad(producto,item.cantidad);const mas=document.createElement("button");mas.type="button";mas.textContent="+";mas.setAttribute("aria-label","Agregar una cantidad de "+producto.nombre);mas.addEventListener("click",()=>{item.cantidad=redondearCantidad(item.cantidad+producto.paso);renderComprasProveedores();});const quitar=document.createElement("button");quitar.type="button";quitar.textContent="🗑️";quitar.setAttribute("aria-label","Quitar "+producto.nombre+" de la compra");quitar.addEventListener("click",()=>{borradorCompra.splice(index,1);renderComprasProveedores();});controles.append(menos,numero,mas,quitar);fila.append(desc,controles);carrito.append(fila);});
    continuar.onclick=()=>{if(!sesionActual){avisoCompra="Abrí un turno de caja antes de pagar la compra.";renderComprasProveedores();return;}if(!continuar.disabled){avisoCompra="";pagoCompraActivo=true;billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";plegarCarritoCompra(false);renderComprasProveedores();}};
    const resumenAcciones=document.createElement("div");resumenAcciones.className="purchase-cart-summary-row";resumenAcciones.append(abrir);
    resumenCarrito.append(resumenAcciones);
    continuar.textContent="Pagar compra";continuar.className="primary wide purchase-checkout-action";buscarCompra.addEventListener("input",()=>{filtroBusquedaCompra=buscarCompra.value.trim().toLocaleLowerCase("es-AR");catalogo.querySelectorAll("[data-product-name]").forEach(tarjeta=>{tarjeta.hidden=Boolean(filtroBusquedaCompra&&!tarjeta.dataset.productName.includes(filtroBusquedaCompra));});});panel.append(proveedorSelect,grupoMedios,escaneoCompra,estadoCodigoCompra,catalogo,resumenCarrito);area.append(panel);actualizarResumen();
  }
  const historial=document.createElement("details");historial.className="purchase-history panel";
  const historialTitulo=document.createElement("summary");historialTitulo.textContent="Historial de compras ("+compras.length+")";historial.append(historialTitulo);
  const historialContenido=document.createElement("div");historialContenido.className="purchase-history-content";
  if(!compras.length){const empty=document.createElement("div");empty.className="history-empty";empty.textContent="Todavía no hay compras registradas.";historialContenido.append(empty);}
  [...compras].slice(-10).reverse().forEach(compra=>{
    const pagoCompra = pagos.find(pago => pago.compraId === compra.id);
    const registro=document.createElement("details");
    registro.className="history-card history-record";
    registro.dataset.compraId=String(compra.id);
    registro.dataset.total=String(compra.total);
    registro.dataset.fecha=compra.fecha||"";
    registro.dataset.formaPago=compra.medioPago||"";
    const resumen=document.createElement("summary");
    resumen.className="history-record-summary purchase-record-summary";
    const idResumen=document.createElement("strong");
    idResumen.className="history-record-id";
    idResumen.textContent="Compra "+compra.id;
    const fechaResumen=document.createElement("span");
    fechaResumen.className="history-record-date";
    fechaResumen.textContent=compra.fecha?new Date(compra.fecha).toLocaleString("es-AR"):"Compra registrada";
    const medioResumen=document.createElement("span");
    medioResumen.className="history-record-method";
    const medio=compra.medioPago||(pagoCompra&&pagoCompra.medio)||"—";
    medioResumen.textContent=medio==="mercado_pago"?"Mercado Pago":medio==="transferencia"?"Transferencia":medio==="efectivo"?"Efectivo":medio;
    resumen.append(idResumen,fechaResumen,medioResumen);

    const detalle=document.createElement("div");
    detalle.className="history-record-details";
    const proveedorMeta=document.createElement("div");
    proveedorMeta.className="history-detail-row";
    const proveedorEtiqueta=document.createElement("span");
    proveedorEtiqueta.className="history-detail-label";
    proveedorEtiqueta.textContent="Proveedor";
    const proveedorValor=document.createElement("span");
    proveedorValor.className="history-detail-value";
    proveedorValor.textContent=compra.proveedor||"Sin proveedor";
    proveedorMeta.append(proveedorEtiqueta,proveedorValor);
    detalle.append(proveedorMeta);

    const items=document.createElement("ul");
    items.className="history-items";
    obtenerDetallesCompra(compra.id).forEach(item=>{
      const li=document.createElement("li");
      li.className="history-sale-item";
      const subtotal=Math.round(item.cantidad*item.costo);
      li.dataset.producto=String(item.nombre);
      li.dataset.productoId=String(item.productId||"");
      li.dataset.cantidad=String(item.cantidad);
      li.dataset.subtotal=String(subtotal);
      const info=document.createElement("div");
      info.className="history-sale-item-info";
      const nombre=document.createElement("span");
      nombre.className="history-sale-item-name";
      nombre.textContent=item.nombre;
      const meta=document.createElement("div");
      meta.className="history-sale-item-meta";
      const costo=document.createElement("span");
      costo.className="history-sale-item-price";
      costo.textContent=pesos(item.costo);
      costo.setAttribute("aria-label","Costo unitario: "+pesos(item.costo));
      const producto=productos.find(p=>p.id===item.productId);
      const cantidad=mostrarCantidad(producto,item.cantidad);
      const unidades=document.createElement("span");
      unidades.className="history-sale-item-quantity";
      unidades.textContent=cantidad;
      unidades.setAttribute("aria-label","Cantidad: "+cantidad);
      meta.append(costo,unidades);
      info.append(nombre,meta);
      const importeItem=document.createElement("strong");
      importeItem.className="history-sale-item-subtotal";
      importeItem.textContent=pesos(subtotal);
      importeItem.setAttribute("aria-label","Subtotal: "+pesos(subtotal));
      li.append(info,importeItem);
      items.append(li);
    });
    detalle.append(items);
    const totalFila=document.createElement("div");
    totalFila.className="history-sale-total";
    const totalEtiqueta=document.createElement("span");
    totalEtiqueta.textContent="Total";
    const totalImporte=document.createElement("strong");
    totalImporte.textContent=pesos(compra.total);
    totalFila.append(totalEtiqueta,totalImporte);
    detalle.append(totalFila);
    registro.append(resumen,detalle);
    historialContenido.append(registro);
  });
  historial.append(historialContenido);area.append(historial);

}

function renderDashboard(){
  const area=$("#dashboard-area");if(!area)return;area.replaceChildren();
  const hoy=new Date();const fechaLarga=new Intl.DateTimeFormat("es-AR",{weekday:"long",day:"numeric",month:"long"}).format(hoy);
  const actuales=sesionActual?ventas.filter(v=>String(v.sesionId)===String(sesionActual.id)):[];
  const ids=new Set(actuales.map(v=>v.id));const total=actuales.reduce((s,v)=>s+(Number(v.total)||0),0);const promedio=actuales.length?Math.round(total/actuales.length):0;
  const cabecera=document.createElement("section");cabecera.className="dashboard-hero";
  const intro=document.createElement("div");intro.className="dashboard-hero-copy";const saludo=document.createElement("span");saludo.className="dashboard-eyebrow";saludo.textContent="PANEL DE CONTROL";const fecha=document.createElement("p");fecha.textContent=fechaLarga;intro.append(saludo,fecha);
  const estado=document.createElement("div");estado.className="dashboard-status "+(sesionActual?"is-open":"is-closed");const punto=document.createElement("span");punto.className="dashboard-status-dot";const estadoTexto=document.createElement("span");estadoTexto.textContent=sesionActual?"Turno "+sesionActual.id+" · Abierto":"Turno cerrado";estado.append(punto,estadoTexto);cabecera.append(intro,estado);area.append(cabecera);
  const metricas=document.createElement("section");metricas.className="dashboard-kpis";const crearKpi=(icono,label,valor,detalle,clase)=>{const card=document.createElement("article");card.className="dashboard-kpi "+(clase||"");const icon=document.createElement("span");icon.className="dashboard-kpi-icon";icon.textContent=icono;const name=document.createElement("span");name.className="dashboard-kpi-label";name.textContent=label;const val=document.createElement("strong");val.className="dashboard-kpi-value";val.textContent=valor;const hint=document.createElement("small");hint.textContent=detalle;card.append(icon,name,val,hint);metricas.append(card);};
  crearKpi("↗","Vendido en el turno",pesos(total),actuales.length+ (actuales.length===1?" venta":" ventas"),"accent-blue");crearKpi("▤","Operaciones",String(actuales.length),actuales.length?"Ventas registradas":"Sin ventas todavía","accent-violet");crearKpi("◉","Ticket promedio",pesos(promedio),actuales.length?"Por venta":"Se calcula con la primera venta","accent-teal");crearKpi("$","Efectivo en caja",pesos(totalCaja()),sesionActual?"Saldo esperado actual":"Último saldo registrado","accent-green");area.append(metricas);
  const columnas=document.createElement("div");columnas.className="dashboard-columns";
  const mediosPanel=document.createElement("section");mediosPanel.className="panel dashboard-panel";const mediosTitulo=document.createElement("div");mediosTitulo.className="dashboard-section-heading";const mt=document.createElement("h3");mt.textContent="Medios de pago";const mtSmall=document.createElement("span");mtSmall.textContent="Turno actual";mediosTitulo.append(mt,mtSmall);mediosPanel.append(mediosTitulo);
  const medios=new Map();actuales.forEach(v=>{const pago=pagos.find(p=>p.id===v.pagoId)||{};const key=pago.medio||"sin registro";medios.set(key,(medios.get(key)||0)+(Number(v.total)||0));});
  const etiquetasMedio={efectivo:"Efectivo",transferencia:"Transferencia",mercado_pago:"Mercado Pago",cuenta_corriente:"Fiado"};if(!medios.size){const vacio=document.createElement("div");vacio.className="dashboard-empty";vacio.textContent="Los pagos aparecerán acá a medida que registres ventas.";mediosPanel.append(vacio);}else{const maximo=Math.max(...medios.values(),1);medios.forEach((importe,medio)=>{const fila=document.createElement("div");fila.className="dashboard-method-row";const datos=document.createElement("div");datos.className="dashboard-method-info";const nombre=document.createElement("span");nombre.textContent=etiquetasMedio[medio]||medio;const valor=document.createElement("strong");valor.textContent=pesos(importe);datos.append(nombre,valor);const track=document.createElement("div");track.className="dashboard-bar-track";const barra=document.createElement("span");barra.style.width=Math.max(5,Math.round(importe/maximo*100))+"%";track.append(barra);fila.append(datos,track);mediosPanel.append(fila);});}
  const topPanel=document.createElement("section");topPanel.className="panel dashboard-panel";const topHead=document.createElement("div");topHead.className="dashboard-section-heading";const th=document.createElement("h3");th.textContent="Productos más vendidos";const thSmall=document.createElement("span");thSmall.textContent="Turno actual";topHead.append(th,thSmall);topPanel.append(topHead);
  const top=new Map();detallesVenta.filter(d=>ids.has(d.ventaId)).forEach(d=>{const item=top.get(d.productId)||{nombre:d.nombre,cantidad:0};item.cantidad+=Number(d.cantidad)||0;top.set(d.productId,item);});const listaTop=[...top.values()].sort((a,b)=>b.cantidad-a.cantidad).slice(0,5);if(!listaTop.length){const vacio=document.createElement("div");vacio.className="dashboard-empty";vacio.textContent="Todavía no hay productos vendidos en este turno.";topPanel.append(vacio);}listaTop.forEach((item,index)=>{const fila=document.createElement("div");fila.className="dashboard-ranking-row";const rank=document.createElement("span");rank.className="dashboard-rank";rank.textContent=String(index+1).padStart(2,"0");const nombre=document.createElement("strong");nombre.textContent=item.nombre;const cantidad=document.createElement("span");cantidad.textContent=mostrarCantidad(productos.find(p=>p.nombre===item.nombre)||{unidad:"u"},item.cantidad);fila.append(rank,nombre,cantidad);topPanel.append(fila);});
  const alertasPanel=document.createElement("section");alertasPanel.className="panel dashboard-panel";const alertasHead=document.createElement("div");alertasHead.className="dashboard-section-heading";const ah=document.createElement("h3");ah.textContent="Stock para revisar";const ahSmall=document.createElement("span");ahSmall.textContent="Alertas";alertasHead.append(ah,ahSmall);alertasPanel.append(alertasHead);
  const alertas=productos.filter(p=>Number(p.stockMinimo)>0&&Number(p.stock)<=Number(p.stockMinimo)).sort((a,b)=>(a.stock-a.stockMinimo)-(b.stock-b.stockMinimo)).slice(0,6);if(!alertas.length){const ok=document.createElement("div");ok.className="dashboard-empty dashboard-ok";ok.textContent="Todo en orden: no hay productos en el mínimo de stock.";alertasPanel.append(ok);}alertas.forEach(p=>{const fila=document.createElement("div");fila.className="dashboard-alert-row";const nombre=document.createElement("strong");nombre.textContent=p.nombre;const valor=document.createElement("span");valor.textContent=mostrarCantidad(p,p.stock)+" / mín. "+mostrarCantidad(p,p.stockMinimo);fila.append(nombre,valor);alertasPanel.append(fila);});
  const recientePanel=document.createElement("section");recientePanel.className="panel dashboard-panel";const recienteHead=document.createElement("div");recienteHead.className="dashboard-section-heading";const rh=document.createElement("h3");rh.textContent="Últimas ventas";const rhSmall=document.createElement("span");rhSmall.textContent="Turno actual";recienteHead.append(rh,rhSmall);recientePanel.append(recienteHead);const recientes=actuales.slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,5);if(!recientes.length){const empty=document.createElement("div");empty.className="dashboard-empty";empty.textContent="Las ventas recientes aparecerán en este espacio.";recientePanel.append(empty);}recientes.forEach(v=>{const fila=document.createElement("div");fila.className="dashboard-recent-row";const info=document.createElement("div");const id=document.createElement("strong");id.textContent="Venta "+v.id;const f=document.createElement("span");f.textContent=new Date(v.fecha).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});info.append(id,f);const amount=document.createElement("strong");amount.textContent=pesos(v.total);fila.append(info,amount);recientePanel.append(fila);});
  columnas.append(mediosPanel,topPanel,alertasPanel,recientePanel);area.append(columnas);
  const accesos=document.createElement("nav");accesos.className="dashboard-quick-links";accesos.setAttribute("aria-label","Accesos rápidos");[["Nueva venta","sales"],["Turno de caja","shift"],["Movimientos","movements"],["Stock de productos","product-stock"]].forEach(([texto,seccion])=>{const boton=document.createElement("button");boton.type="button";boton.className="secondary";boton.textContent=texto;boton.addEventListener("click",()=>mostrarSeccion(seccion));accesos.append(boton);});area.append(accesos);
}


function agregarProductoCompraPorCodigo(valor){const codigo=normalizarCodigoBarras(valor);const producto=productos.find(item=>normalizarCodigoBarras(item.codigoBarras)===codigo);const estado=$("#purchase-barcode-status");if(!codigo)return;if(!producto){if(estado)estado.textContent="No encontré un producto con ese código.";return;}if(!sesionActual){if(estado)estado.textContent="Abrí un turno de caja para habilitar las compras.";return;}const item=borradorCompra.find(linea=>linea.productId===producto.id);if(item)item.cantidad=redondearCantidad(item.cantidad+producto.paso);else borradorCompra.push({productId:producto.id,nombre:producto.nombre,cantidad:producto.paso,costo:Number.isFinite(producto.costo)&&producto.costo>0?producto.costo:null});avisoCompra="";renderComprasProveedores();const nuevoEstado=$("#purchase-barcode-status");if(nuevoEstado)nuevoEstado.textContent=producto.nombre+" agregado a la compra.";}
