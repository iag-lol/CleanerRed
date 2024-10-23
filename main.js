const CLIENT_ID = '739966027132-j4ngpj7la2hpmkhil8l3d74dpbec1eq1.apps.googleusercontent.com';  // Reemplaza con tu CLIENT_ID de Google
const API_KEY = 'AIzaSyAqybdPUUYkIbeGBMxc39hMdaRrOhikD8s';  // Reemplaza con tu API_KEY
const SPREADSHEET_ID = '1ZMAIPcRS2hPV4pojfXWZflPQfIrOBehRvPoreotvlAI';  // Reemplaza con el ID de tu hoja de cálculo

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let userFullName = localStorage.getItem('userFullName') || '';  // Recuperar el nombre del localStorage
let currentEditRow = -1;  // Índice de la fila que está siendo editada

document.addEventListener('DOMContentLoaded', function () {
    gapi.load('client', initializeGapiClient);

    // Comprobar si ya hay un nombre guardado
    if (userFullName) {
        updateUserCard(userFullName);  // Si ya hay nombre, actualizar la tarjeta de usuario
    } else {
        // Si no hay nombre, mostrar el modal de sesión al cargar la página
        document.getElementById('sessionModal').style.display = 'flex';
    }

    // Manejar el envío del formulario de tareas
    const incidentForm = document.getElementById('incident-form');
    incidentForm.addEventListener('submit', function (e) {
        e.preventDefault();  // Evitar el reinicio de la página al enviar el formulario
        addOrUpdateIncident();  // Registrar la tarea
    });

    const saveNameBtn = document.getElementById('saveNameBtn');
    saveNameBtn.addEventListener('click', saveNameAndProceed);
});

// Inicializa Google API Client
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    gapiInited = true;
    initializeGisClient();
}

// Inicializa Google Identity Services
function initializeGisClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleAuthResponse,
    });
    gisInited = true;
}

// Guardar nombre y proceder a la autenticación de Google
function saveNameAndProceed() {
    const nombreCompleto = document.getElementById('nombreCompleto').value;
    
    if (nombreCompleto) {
        // Guardar el nombre en localStorage y actualizar la tarjeta de usuario
        userFullName = nombreCompleto;
        localStorage.setItem('userFullName', userFullName);  // Guardar en localStorage
        updateUserCard(userFullName);
        
        // Cerrar el modal de nombre
        closeModal();

        // Iniciar autenticación con Google
        handleAuthClick();  // Llamar a la autenticación de Google justo después de guardar el nombre
    } else {
        alert('Por favor, ingrese su nombre completo.');
    }
}

// Manejar autenticación con Google
function handleAuthClick() {
    if (gapiInited && gisInited) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error('Google API no está listo.');
    }
}




document.getElementById('registerButton').addEventListener('click', function () {
    document.getElementById('incident-form').submit();
});




document.getElementById('incident-form').addEventListener('submit', function (e) {
    e.preventDefault();  // Prevenir el refresco
    console.log('Formulario enviado en móvil o PC');
    addOrUpdateIncident();
});




async function loadFleetData() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,  // Asegúrate que esta ID sea correcta
            range: 'FLOTA!A1:A',  // El rango debe corresponder a la hoja de la que quieres obtener datos
        });

        const fleetData = response.result.values || [];

        if (fleetData.length === 0) {
            console.error('No se encontraron datos en la columna A de la hoja FLOTA.');
            return;
        }

        // Rellenar el input de PPU con los datos obtenidos
        const dataList = document.getElementById('ppu-options');
        dataList.innerHTML = '';  // Limpiar cualquier opción previa

        fleetData.forEach(row => {
            if (row[0]) {  // Verificar que haya un valor en la celda
                let option = document.createElement('option');
                option.value = row[0].toUpperCase();  // Convertir el valor a mayúsculas
                dataList.appendChild(option);  // Añadir la opción al datalist
            }
        });

        console.log('Datos de la flota cargados correctamente.');
    } catch (error) {
        console.error('Error al cargar los PPUs desde la flota:', error);
    }
}










// Forzar mayúsculas al escribir en el campo PPU y Estado
document.getElementById('ppu').addEventListener('input', function() {
    this.value = this.value.toUpperCase();  // Forzar mayúsculas
});

document.getElementById('estado').addEventListener('input', function() {
    this.value = this.value.toUpperCase();  // Forzar mayúsculas
});

// Validar que el campo "Estado" solo permita "OPERATIVO" o "PANNE"
document.getElementById('incident-form').addEventListener('submit', function(event) {
    const estadoInput = document.getElementById('estado').value;
    if (estadoInput !== 'OPERATIVO' && estadoInput !== 'PANNE') {
        alert('Por favor, ingrese un estado válido: OPERATIVO o PANNE');
        event.preventDefault();  // Evitar envío del formulario si no es válido
    }
});










document.addEventListener('DOMContentLoaded', function () {
    // Botón para abrir el modal
    const revisarPendientesBtn = document.getElementById('revisarPendientesBtnUnique');
    revisarPendientesBtn.addEventListener('click', openPendientesModalUnique);

    // Botón para cerrar el modal
    const closeModalBtn = document.getElementById('closeModalBtnUnique');
    closeModalBtn.addEventListener('click', closePendientesModalUnique);

    // Función para cargar los buses pendientes y mostrar el modal
    async function openPendientesModalUnique() {
        const modal = document.getElementById('pendientesModalUnique');
        modal.style.display = 'flex';  // Mostrar el modal

        try {
            // Llamada a la API de Google Sheets para obtener la columna D de la hoja FLOTA
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: 'FLOTA!D1:D',  // Rango de la columna D en la hoja FLOTA
            });

            const pendingData = response.result.values || [];
            const tableBody = document.querySelector('#pendientesTableUnique tbody');
            tableBody.innerHTML = '';  // Limpiar cualquier contenido previo

            // Rellenar la tabla con los datos obtenidos
            pendingData.forEach(row => {
                if (row[0]) {  // Verificar que haya un valor
                    let tr = document.createElement('tr');
                    let td = document.createElement('td');
                    td.textContent = row[0].toUpperCase();  // Convertir a mayúsculas
                    tr.appendChild(td);
                    tableBody.appendChild(tr);
                }
            });

            if (pendingData.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = '<td>No hay buses pendientes</td>';
                tableBody.appendChild(emptyRow);
            }

        } catch (error) {
            console.error('Error al cargar los buses pendientes:', error);
        }
    }

    // Función para cerrar el modal
    function closePendientesModalUnique() {
        document.getElementById('pendientesModalUnique').style.display = 'none';
    }

    // Cerrar el modal al hacer clic fuera de la ventana modal
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('pendientesModalUnique');
        if (event.target === modal) {
            modal.style.display = 'none';  // Cerrar el modal si se hace clic fuera de él
        }
    });
});
















// Manejar respuesta de autenticación
function handleAuthResponse(response) {
    if (response.error) {
        console.error('Error en autenticación:', response);
        return;
    }
    gapi.client.setToken({ access_token: response.access_token });
    loadIncidents();  // Cargar incidentes después de la autenticación
}

// Cargar incidentes desde Google Sheets y actualizar los contadores
async function loadIncidents() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Incidentes!B4:G',
        });
        const data = response.result.values || [];
        const tbody = document.getElementById('tasksTable').querySelector('tbody');
        tbody.innerHTML = '';

        // Inicializar contadores
        let laborCounts = {
            'Barrido': 0,
            'Trapeado': 0,
            'Full': 0,
            'Full Seco': 0,
            'Preparacion DTPM': 0,
            'Preparacion RTG': 0,
            'Preparacion APPLUS': 0
        };

        // Actualizar la tabla y contar las labores
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });

            const labor = row[2];
            if (labor in laborCounts) {
                laborCounts[labor]++;
            }

            tbody.appendChild(tr);
        });

        // Actualizar los contadores en el dashboard
        document.getElementById('count-barrido').textContent = laborCounts['Barrido'];
        document.getElementById('count-trapeado').textContent = laborCounts['Trapeado'];
        document.getElementById('count-full').textContent = laborCounts['Full'];
        document.getElementById('count-full-seco').textContent = laborCounts['Full Seco'];
        document.getElementById('count-dtpm').textContent = laborCounts['Preparacion DTPM'];
        document.getElementById('count-rtg').textContent = laborCounts['Preparacion RTG'];
        document.getElementById('count-applus').textContent = laborCounts['Preparacion APPLUS'];

    } catch (error) {
        console.error('Error al cargar incidentes:', error);
    }
}

// Actualizar la tarjeta de usuario con el nombre y estado
function updateUserCard(userName) {
    const userNameDisplay = document.getElementById('user-name');
    const userStateDisplay = document.getElementById('user-state');
    const userPositionDisplay = document.getElementById('user-position');

    userNameDisplay.textContent = userName;
    userStateDisplay.textContent = 'Conectado';
    userStateDisplay.classList.remove('status-disconnected');
    userStateDisplay.classList.add('status-connected');
    userPositionDisplay.textContent = 'Usuario Activo';
}








// Función para mostrar alertas personalizadas
function showAlert(type) {
    const alert = document.getElementById(`${type}-alert`);
    alert.style.display = 'flex';  // Mostrar alerta

    // Ocultar la alerta después de 5 segundos
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Función para cerrar alerta manualmente
function closeAlert(alertId) {
    document.getElementById(alertId).style.display = 'none';
}














// Agregar o actualizar un incidente
async function addOrUpdateIncident() {
    const values = [
        [
            document.getElementById('ppu').value,
            document.getElementById('estado').value,
            document.getElementById('labor').value,
            userFullName,
            'Pendiente',
            new Date().toLocaleString('es-ES')
        ]
    ];

    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Incidentes!B4:G',
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        // Limpiar formulario y recargar los datos
        document.getElementById('incident-form').reset();
        loadIncidents();

        // Alerta de éxito
        showAlert('success');

    } catch (error) {
        console.error('Error al registrar incidente:', error);
        showAlert('error');

    }
}

// Función para cerrar sesión
function handleSignoutClick() {
    gapi.client.setToken(null);
    localStorage.removeItem('userFullName');  // Borrar el nombre del localStorage al cerrar sesión
    document.getElementById('signin-button').classList.remove('hidden');
    document.getElementById('signout-button').classList.add('hidden');
    document.getElementById('tasksTable').querySelector('tbody').innerHTML = '';  // Limpiar la tabla
    console.log('Sesión cerrada');
}

// Función para cerrar el modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}


// Función para asignar el color basado en el valor
function getColorBasedOnValue(value, maxValue = 155) {
    const ratio = value / maxValue;
    if (ratio <= 0.5) {
        // Color rojo (más cercano a 0)
        return `rgb(255, ${Math.floor(255 * ratio * 2)}, 0)`; // De rojo a amarillo
    } else {
        // Color verde (más cercano a 155)
        return `rgb(${Math.floor(255 * (1 - ratio) * 2)}, 255, 0)`; // De amarillo a verde
    }
}

// Cargar incidentes desde Google Sheets y actualizar los contadores con colores
async function loadIncidents() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Incidentes!B4:G',
        });
        const data = response.result.values || [];
        const tbody = document.getElementById('tasksTable').querySelector('tbody');
        tbody.innerHTML = '';

        // Inicializar contadores
        let laborCounts = {
            'Barrido': 0,
            'Trapeado': 0,
            'Full': 0,
            'Full Seco': 0,
            'Preparacion DTPM': 0,
            'Preparacion RTG': 0,
            'Preparacion APPLUS': 0
        };

        // Actualizar la tabla y contar las labores
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });

            const labor = row[2];
            if (labor in laborCounts) {
                laborCounts[labor]++;
            }

            tbody.appendChild(tr);
        });

        // Actualizar los contadores en el dashboard con colores
        updateDashboardCount('count-barrido', laborCounts['Barrido']);
        updateDashboardCount('count-trapeado', laborCounts['Trapeado']);
        updateDashboardCount('count-full', laborCounts['Full']);
        updateDashboardCount('count-full-seco', laborCounts['Full Seco']);
        updateDashboardCount('count-dtpm', laborCounts['Preparacion DTPM']);
        updateDashboardCount('count-rtg', laborCounts['Preparacion RTG']);
        updateDashboardCount('count-applus', laborCounts['Preparacion APPLUS']);

    } catch (error) {
        console.error('Error al cargar incidentes:', error);
    }
}

// Función para actualizar el conteo en el dashboard con el color correspondiente
function updateDashboardCount(elementId, count) {
    const element = document.getElementById(elementId);
    element.textContent = count;
    element.style.color = getColorBasedOnValue(count);  // Aplica el color al número
}

// Llamar a loadIncidents cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    loadIncidents();
});












function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título del documento
    doc.setFontSize(18);
    doc.text('Registros de Aseos', 14, 22);

    // Obtener las cabeceras de la tabla
    const table = document.getElementById('tasksTable');
    const headers = [];
    for (let headerCell of table.querySelectorAll('thead th')) {
        headers.push(headerCell.innerText);
    }

    // Obtener los datos de la tabla
    const data = [];
    for (let row of table.querySelectorAll('tbody tr')) {
        const rowData = [];
        for (let cell of row.cells) {
            rowData.push(cell.innerText);
        }
        data.push(rowData);
    }

    // Generar la tabla en el PDF usando autoTable
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 30,  // Posición donde empieza la tabla
        theme: 'grid',  // Puedes cambiar el tema a 'striped', 'grid', o 'plain'
        styles: {
            fontSize: 10,  // Tamaño de la fuente en la tabla
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [33, 78, 157],  // Color de fondo de las cabeceras
            textColor: [255, 255, 255],  // Color de texto de las cabeceras
        },
        bodyStyles: {
            fillColor: [245, 245, 245],  // Color de fondo de las celdas
            textColor: [0, 0, 0],  // Color de texto de las celdas
        }
    });

    // Descargar el PDF
    doc.save('Registros_de_Aseos.pdf');
}







function showAlert(type) {
    const alert = document.getElementById(`${type}-alert`);
    alert.style.display = 'block';

    // Ocultar la alerta después de 5 segundos
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

function closeAlert(alertId) {
    document.getElementById(alertId).style.display = 'none';
}


// Mostrar alerta de éxito
showAlert('success');

// Mostrar alerta de error
showAlert('error');











