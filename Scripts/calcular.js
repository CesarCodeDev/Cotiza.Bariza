// Al inicio del archivo: Cargar datos previos si existen
document.addEventListener("DOMContentLoaded", () => {
    const datosGuardados = localStorage.getItem("cotizacion_actual");
    if (datosGuardados) {
        const productos = JSON.parse(datosGuardados);
        productos.forEach(p => agregarFilaATabla(p.material, p.area, p.valorUnitario, p.total));
    }
});

document.getElementById("Btn_calcular").addEventListener("click", function () {
    const material = document.getElementById("Lbl_Material").value;
    const area = document.getElementById("Lbl_Area").value;
    const valorUnitario = document.getElementById("Lbl_ValorUnitario").value;
    const total = area * valorUnitario;

    agregarFilaATabla(material, area, valorUnitario, total);
    guardarEnLocalStorage(); // Función de persistencia
});

function agregarFilaATabla(material, area, valorUnitario, total) {
    const tabla = document.getElementById("Tabla_Productos");
    const fila = tabla.insertRow(-1);
    
    fila.insertCell(0).textContent = tabla.rows.length - 1;
    fila.insertCell(1).textContent = material;
    fila.insertCell(2).textContent = area;
    fila.insertCell(3).textContent = Number(valorUnitario).toLocaleString();
    fila.insertCell(4).textContent = Number(total).toLocaleString();
    fila.insertCell(5).innerHTML = '<button class="btn btn-danger btn-sm" onclick="eliminarFila(this)">Eliminar</button>';
}

function guardarEnLocalStorage() {
    const tabla = document.getElementById("Tabla_Productos");
    const productos = [];
    
    for (let i = 1; i < tabla.rows.length; i++) {
        const fila = tabla.rows[i];
        // Extraemos los números eliminando el formato visual ($ y .)
        const valorUnitarioLimpio = fila.cells[3].textContent.replace(/\$|\./g, '').trim();
        const totalLimpio = fila.cells[4].textContent.replace(/\$|\./g, '').trim();

        productos.push({
            item: fila.cells[0].textContent,
            material: fila.cells[1].textContent,
            area: fila.cells[2].textContent,
            valorUnitario: valorUnitarioLimpio, // Guardamos "13500"
            total: totalLimpio // Guardamos "540000"
        });
    }
    localStorage.setItem("cotizacion_actual", JSON.stringify(productos));
}

function eliminarFila(boton) {
    const fila = boton.parentNode.parentNode;
    const tabla = document.getElementById("Tabla_Productos");
    
    // 1. Eliminar la fila físicamente
    fila.parentNode.removeChild(fila);

    // 2. Reindexar: Como Ingeniero de QA, aseguramos que el orden sea consistente
    reindexarTabla();

    // 3. Persistir los cambios actualizados
    guardarEnLocalStorage();
}

function reindexarTabla() {
    const tabla = document.getElementById("Tabla_Productos");
    // Empezamos desde 1 para saltar el encabezado (thead)
    for (let i = 1; i < tabla.rows.length; i++) {
        // Actualizamos la celda 0 (el Item) con el índice actual
        tabla.rows[i].cells[0].textContent = i;
    }
}

function generarPDF() {

    const filasTabla = document.querySelectorAll("#Tabla_Productos tr");
    let itemsHTML = "";
    let subtotalCalculado = 0;

    // Iteramos las filas de la tabla (saltando el encabezado i=1)
    for (let i = 1; i < filasTabla.length; i++) {
        const c = filasTabla[i].cells;
        
        // REGLA DE INGENIERÍA: Limpiar el formato visual para obtener el número real
        // Quitamos el "$", los puntos de miles "." y espacios
        const valorLimpio = c[4].textContent.replace(/\$|\./g, '').trim();
        const totalFila = parseFloat(valorLimpio) || 0;
        
        subtotalCalculado += totalFila;

        // Construcción de las filas para el diseño del PDF
        itemsHTML += `
            <tr>
                <td class="col-item">${c[0].textContent}</td>
                <td class="description"><strong>${c[1].textContent}</strong></td>
                <td class="col-unit amount">${c[2].textContent}</td>
                <td class="col-price amount">$${c[3].textContent}</td>
                <td class="col-total amount">$${c[4].textContent}</td>
            </tr>`;
    }

    // Cálculos finales basados en el subtotal limpio
    const iva = subtotalCalculado * 0.19;
    const totalGeneral = subtotalCalculado + iva;

    // Formateo de moneda para el diseño (Estilo: $1.300.000)
    const f = (num) => num.toLocaleString('es-CO', { minimumFractionDigits: 0 });

    const notaAdicional = document.getElementById("Lbl_NotaAd")?.value || "Sin notas adicionales.";
    const fechaActual = new Date().toLocaleDateString();

    const contenidoPDF = `
    <html>
    <head>
        <title>Cotización - BARIZA S.A.S</title>
        <style>
            :root {
                --primary: #1a1a1a;
                --accent: #3b82f6;
                --text-main: #374151;
                --text-light: #6b7280;
                --border: #e5e7eb;
                --bg-light: #f9fafb;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', sans-serif;
                background-color: #f3f4f6;
                color: var(--text-main);
                line-height: 1.6;
                padding: 40px 20px;
                -webkit-print-color-adjust: exact;
            }

            /* Invoice Container */
            .invoice-container {
                max-width: 850px;
                margin: 0 auto;
                background: #ffffff;
                padding: 60px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                border-radius: 4px;
                position: relative;
            }

            /* Header */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 60px;
            }

            .brand-logo {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.05em;
                color: var(--primary);
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .brand-logo svg {
                width: 32px;
                height: 32px;
                color: var(--accent);
            }

            .invoice-title {
                text-align: right;
            }

            .invoice-title h1 {
                font-size: 32px;
                font-weight: 300;
                text-transform: uppercase;
                letter-spacing: 0.2em;
                color: var(--text-light);
                margin-bottom: 5px;
            }

            .meta-info {
                font-size: 14px;
                color: var(--text-light);
            }

            /* Details Grid */
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 50px;
            }

            .detail-block h3 {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--accent);
                margin-bottom: 12px;
                border-bottom: 1px solid var(--border);
                padding-bottom: 4px;
            }

            .detail-block p {
                font-size: 14px;
                margin-bottom: 2px;
            }

            .detail-block .name {
                font-weight: 600;
                color: var(--primary);
                font-size: 15px;
            }

            /* Items Table */
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
            }

            .items-table th {
                text-align: left;
                padding: 12px 0;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-light);
                border-bottom: 2px solid var(--primary);
            }

            .items-table td {
                padding: 15px 0;
                border-bottom: 1px solid var(--border);
                vertical-align: top;
                font-size: 14px;
            }

            .items-table .col-item { width: 50px; }
            .items-table .col-desc { width: auto; }
            .items-table .col-unit { width: 100px; text-align: right; }
            .items-table .col-price { width: 120px; text-align: right; }
            .items-table .col-total { width: 120px; text-align: right; }

            .items-table .description strong {
                display: block;
                color: var(--primary);
                margin-bottom: 2px;
            }

            .items-table .description span {
                font-size: 12px;
                color: var(--text-light);
            }

            .items-table .amount {
                font-variant-numeric: tabular-nums;
            }

            /* Totals Summary */
            .summary {
                display: flex;
                justify-content: flex-end;
            }

            .summary-table {
                width: 250px;
            }

            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
            }

            .summary-row.total {
                margin-top: 10px;
                padding-top: 15px;
                border-top: 2px solid var(--primary);
                font-weight: 700;
                font-size: 18px;
                color: var(--primary);
            }

            /* Footer */
            .footer {
                margin-top: 80px;
                font-size: 12px;
                color: var(--text-light);
                border-top: 1px solid var(--border);
                padding-top: 20px;
            }

            .notes {
                margin-bottom: 20px;
            }

            .notes h4 {
                font-size: 11px;
                text-transform: uppercase;
                color: var(--primary);
                margin-bottom: 5px;
            }

            /* UI Actions */
            .actions {
                max-width: 850px;
                margin: 30px auto 0;
                display: flex;
                justify-content: center;
                gap: 15px;
            }

            .btn-print {
                background: var(--primary);
                color: white;
                border: none;
                padding: 14px 40px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-print:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                background: #000;
            }

            /* Print Rules */
            @media print {
                @page {
                    size: A4;
                    margin: 15mm;
                }
                body {
                    background: white;
                    padding: 0;
                }
                .invoice-container {
                    box-shadow: none;
                    max-width: 100%;
                    width: 100%;
                    padding: 0;
                }
                .actions {
                    display: none;
                }
                .detail-block h3 {
                    border-bottom: 1px solid #e5e7eb !important;
                    -webkit-print-color-adjust: exact;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <header class="header">
                <div>
                    <div class="brand-logo">BARITZA S.A.S</div>
                    <p style="font-size: 13px; color: #6b7280;">Préstamos de Servicios por Suministros</p>
                    <p style="font-size: 13px; color: #6b7280;">NIT: 900.661.511 - 2</p>
                </div>
                <div class="invoice-title">
                    <h1>Cotización</h1>
                    <div class="meta-info"><p>Fecha: ${fechaActual}</p></div>
                </div>
            </header>

            <section class="details-grid">
                <div class="detail-block">
                    <h3>Proveedor</h3>
                    <p class="name">BARITZA S.A.S</p>
                    <p>BaritzaSAS@gmail.com</p>
                    <p>300 379 6387 - 302 255 6805</p>
                    <p>Malambo - Atlántico Calle 15a # 5a Sur - 87</p>
                </div>
                <div class="detail-block">
                    <h3>Cliente</h3>
                    <p class="name">${document.getElementById("Lbl_cliente")?.value || 'Cliente General'}</p>
                    <p>NIT: ${document.getElementById("Lbl_nit")?.value || 'N/A'}</p>
                    <p>Celular: ${document.getElementById("Lbl_Telefono")?.value || 'N/A'}</p>
                </div>
            </section>

            <table class="items-table">
                <thead>
                    <tr>
                        <th class="col-item">Item</th>
                        <th class="col-desc">Descripción</th>
                        <th class="col-unit">Área (m²)</th>
                        <th class="col-price">Precio Unitario</th>
                        <th class="col-total">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <div class="summary">
                <div class="summary-table">
                    <div class="summary-row"><span>Subtotal</span><span>$${f(subtotalCalculado)}</span></div>
                    <div class="summary-row"><span>IVA (19%)</span><span>$${f(iva)}</span></div>
                    <div class="summary-row total"><span>Total General</span><span>$${f(totalGeneral)}</span></div>
                </div>
            </div>

            <footer class="footer">
                <div class="notes">
                    <h4>Condiciones y Notas</h4>
                    <p>${notaAdicional}</p>
                </div>
            </footer>
        </div>
        <div class="actions">
            <button class="btn-print" onclick="window.print()">Imprimir o Guardar PDF</button>
        </div>
    </body>
    </html>`;

    const ventana = window.open('', '_blank');
    ventana.document.write(contenidoPDF);
    ventana.document.close();
}