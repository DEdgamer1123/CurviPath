// JavaScript principal de la aplicación

// Inicializa la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa el selector de tipo de ejercicio y las entradas de variables
    updateVariablesAndSolveOptions();
    
    // Asigna los eventos a los botones y elementos interactivos
    document.getElementById('exerciseType').addEventListener('change', updateVariablesAndSolveOptions);
    document.getElementById('plotBtn').addEventListener('click', fetchDataAndUpdate);
    document.getElementById('solveBtn').addEventListener('click', solveExercise);
    document.getElementById('visualization3d').addEventListener('change', toggleVisualizationType);

    // Agrega la primera fila de función vectorial
    addVectorFunction();

    // Inicializa el tipo de visualización (2D o 3D)
    toggleVisualizationType();
});

// Función para agregar una nueva fila de entrada de función vectorial
function addVectorFunction() {
    const vectorFunctionsContainer = document.getElementById('vectorFunctionsContainer'); // Contenedor de funciones vectoriales
    const currentId = window.vectorFunctionIdCounter++; // Incrementa el contador global de funciones vectoriales
    
    const div = document.createElement('div'); // Crea un nuevo contenedor para la función vectorial
    div.className = 'vector-function-input flex gap-2 mb-2 items-center'; // Asigna clases CSS
    div.setAttribute('data-original-index', currentId); // Asigna un índice único
    
    // Inicializa la visibilidad de la función como verdadera
    window.vectorFunctionVisibility[currentId] = true;
    
    // Define el contenido HTML de la fila
    div.innerHTML = `
        <button type="button" class="toggle-visibility text-gray-500 hover:text-gray-900" title="Mostrar/Ocultar función">
            <i class="fas fa-eye"></i>
        </button>
        <input type="text" class="vector-x border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="x(t)" />
        <input type="text" class="vector-y border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="y(t)" />
        <input type="text" class="vector-z border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="z(t)" />
        <button type="button" class="remove-vector-function text-red-600 font-bold" title="Eliminar función">-</button>
    `;
    
    vectorFunctionsContainer.appendChild(div); // Agrega la nueva fila al contenedor
    updateRemoveVectorButtons(); // Actualiza el estado de los botones de eliminación
}

// Actualiza el estado de los botones de eliminación de funciones vectoriales
function updateRemoveVectorButtons() {
    const removeButtons = document.querySelectorAll('.remove-vector-function'); // Selecciona todos los botones de eliminación
    const isDisabled = document.querySelectorAll('.vector-function-input').length <= 1; // Deshabilita si solo hay una fila
    
    removeButtons.forEach(btn => {
        btn.disabled = isDisabled; // Deshabilita o habilita el botón
        if (isDisabled) {
            btn.classList.add('opacity-50', 'cursor-not-allowed'); // Aplica estilos de deshabilitado
        } else {
            btn.classList.remove('opacity-50', 'cursor-not-allowed'); // Elimina estilos de deshabilitado
        }
    });
}

// Alterna entre visualización 2D y 3D
function toggleVisualizationType() {
    const is3D = document.getElementById('visualization3d').checked; // Verifica si la visualización es en 3D
    const charts2d = document.getElementById('charts2d'); // Contenedor de gráficos 2D
    const chart3d = document.getElementById('chart3d'); // Contenedor de gráficos 3D
    
    if (is3D) {
        charts2d.style.display = 'none'; // Oculta los gráficos 2D
        chart3d.style.display = 'block'; // Muestra los gráficos 3D
    } else {
        charts2d.style.display = 'block'; // Muestra los gráficos 2D
        chart3d.style.display = 'none'; // Oculta los gráficos 3D
    }
    
    // Redibuja los gráficos si ya hay datos cargados
    if (window.currentData) {
        updateCharts(window.currentData);
    }
}

// Actualiza las variables y opciones de solución según el tipo de ejercicio seleccionado
function updateVariablesAndSolveOptions() {
    const exerciseType = document.getElementById('exerciseType').value; // Obtiene el tipo de ejercicio seleccionado
    const variablesContainer = document.getElementById('variablesContainer'); // Contenedor de variables
    const solveForSelect = document.getElementById('solveFor'); // Selector de variable a resolver
    
    // Limpia los contenedores existentes
    variablesContainer.innerHTML = '';
    solveForSelect.innerHTML = '';
    
    // Define las variables y opciones de solución para cada tipo de ejercicio
    const exerciseVariables = {
        MCU: {
            variables: [
                { id: 'r', label: 'Radio (r)', unit: 'm' },
                { id: 'ω', label: 'Velocidad angular (ω)', unit: 'rad/s' },
                { id: 'v', label: 'Velocidad lineal (v)', unit: 'm/s' },
                { id: 'T', label: 'Periodo (T)', unit: 's' },
                { id: 'f', label: 'Frecuencia (f)', unit: 'Hz' },
                { id: 'a_c', label: 'Aceleración centrípeta (a_c)', unit: 'm/s²' },
                { id: 'θ', label: 'Ángulo (θ)', unit: '°' },
                { id: 't', label: 'Tiempo (t)', unit: 's' },
                { id: 'N', label: 'Número de vueltas (N)', unit: '' }
            ],
            solveOptions: ['ω', 'v', 'T', 'f', 'a_c', 'θ', 't', 'N', 'r']
        },
        MCNU: {
            variables: [
                { id: 'r', label: 'Radio (r)', unit: 'm' },
                { id: 'ω_i', label: 'Velocidad angular inicial (ω_i)', unit: 'rad/s' },
                { id: 'ω_f', label: 'Velocidad angular final (ω_f)', unit: 'rad/s' },
                { id: 'alpha', label: 'Aceleración angular (α)', unit: 'rad/s²' },
                { id: 'θ', label: 'Ángulo (θ)', unit: '°' },
                { id: 'a_t', label: 'Aceleración tangencial (a_t)', unit: 'm/s²' },
                { id: 'a_c', label: 'Aceleración centrípeta (a_c)', unit: 'm/s²' },
                { id: 'a', label: 'Aceleración total (a)', unit: 'm/s²' },
                { id: 't', label: 'Tiempo (t)', unit: 's' }
            ],
            solveOptions: ['ω_i', 'ω_f', 'alpha', 'θ', 'a_t', 'a_c', 'a', 't']
        },
        TP: {
            variables: [
                { id: 'v_0', label: 'Velocidad inicial (v_0)', unit: 'm/s' },
                { id: 'θ', label: 'Ángulo de lanzamiento (θ)', unit: '°' },
                { id: 'g', label: 'Aceleración gravitacional (g)', unit: 'm/s²', default: '9.81' },
                { id: 'x', label: 'Posición horizontal (x)', unit: 'm' },
                { id: 'y', label: 'Posición vertical (y)', unit: 'm' },
                { id: 'H', label: 'Altura máxima (H)', unit: 'm' },
                { id: 'R', label: 'Alcance horizontal (R)', unit: 'm' },
                { id: 't', label: 'Tiempo de vuelo (t)', unit: 's' },
                { id: 'v_0x', label: 'Componente horizontal de v_0 (v_0x)', unit: 'm/s' },
                { id: 'v_0y', label: 'Componente vertical de v_0 (v_0y)', unit: 'm/s' }
            ],
            solveOptions: ['v_0', 'θ', 'g', 'x', 'y', 'H', 'R', 't']
        },
        MCG: {
            variables: [
                { id: 'v', label: 'Velocidad (v)', unit: 'm/s' },
                { id: 'a_t', label: 'Aceleración tangencial (a_t)', unit: 'm/s²' },
                { id: 'a_c', label: 'Aceleración normal (a_c)', unit: 'm/s²' },
                { id: 'rho', label: 'Radio de curvatura (ρ)', unit: 'm' },
                { id: 'a', label: 'Aceleración total (a)', unit: 'm/s²' }
            ],
            solveOptions: ['v', 'a_t', 'a_c', 'rho', 'a']
        }
    };
    
    // Obtiene las variables y opciones de solución para el tipo de ejercicio seleccionado
    const { variables, solveOptions } = exerciseVariables[exerciseType];

    // Crea un diseño de cuadrícula para las variables
    const row = document.createElement('div');
    row.className = 'row';
    
    // Agrega las entradas de variables
    variables.forEach(variable => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        const id = variable.id; // ID de la variable
        const defaultValue = variable.default || ''; // Valor predeterminado
        
        col.innerHTML = `
            <div class="form-group">
                <label for="${id}" class="form-label">${variable.label}</label>
                <div class="input-group">
                    <input type="number" id="${id}" name="${id}" step="any" class="form-control variable-input" 
                        data-var-id="${id}" data-var-name="${variable.label}" placeholder="Ingrese valor" value="${defaultValue}" />
                    ${variable.unit ? `<span class="input-group-text">${variable.unit}</span>` : ''}
                </div>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    variablesContainer.appendChild(row); // Agrega las variables al contenedor
    
    // Agrega las opciones de solución
    solveOptions.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        
        // Busca la variable correspondiente para obtener su etiqueta
        const variable = variables.find(v => v.id === option);
        if (variable) {
            optElement.textContent = variable.label;
        } else {
            optElement.textContent = option;
        }
        
        solveForSelect.appendChild(optElement);
    });
}

// Resuelve el ejercicio sin las gráficas
function solveExercise() {
    // Muestra un mensaje de carga mientras se realiza el cálculo
    document.getElementById('solutionOutput').innerHTML = '<div class="text-center p-4"><div class="loading-spinner d-inline-block me-2"></div> Calculando...</div>';
    
    // Recopila los datos del formulario y los envía al servidor para procesar
    fetchDataAndProcess(true); // Llama a la función para procesar solo la solución
}

// Obtener datos y actualizar los gráficos
function fetchDataAndUpdate() {
    // Muestra un estado de carga en los gráficos
    const loadingMessage = '<div class="flex justify-center items-center h-full"><i class="fas fa-spinner fa-spin mr-2"></i> Cargando datos...</div>';
    document.getElementById('trajectoryChart').parentElement.innerHTML = `<canvas id="trajectoryChart" class="w-full h-64"></canvas>${loadingMessage}`;
    document.getElementById('velocityChart').parentElement.innerHTML = `<canvas id="velocityChart" class="w-full h-64"></canvas>${loadingMessage}`;
    document.getElementById('accelerationChart').parentElement.innerHTML = `<canvas id="accelerationChart" class="w-full h-64"></canvas>${loadingMessage}`;
    
    // Recopila los datos del formulario y los envía al servidor para actualizar los gráficos
    fetchDataAndProcess(false); // Llama a la función para procesar y graficar
}

// Recoge los datos del formulario y las ecuaciones vectoriales y procesa los resultados
function fetchDataAndProcess(solutionOnly = false) {
    // Recopila los datos del formulario
    const formData = new FormData(document.getElementById('paramsForm'));
    
    // Recopila las ecuaciones vectoriales
    const functionInputs = document.querySelectorAll('.vector-function-input');
    const xEquations = [];
    const yEquations = [];
    const zEquations = [];
    
    functionInputs.forEach((div, index) => {
        const originalIndex = parseInt(div.getAttribute('data-original-index'), 10);
        
        // Omite las funciones ocultas
        if (!window.vectorFunctionVisibility[originalIndex]) {
            return;
        }
        
        const xInput = div.querySelector('.vector-x');
        const yInput = div.querySelector('.vector-y');
        const zInput = div.querySelector('.vector-z');
        
        // Agrega las ecuaciones vectoriales según las entradas proporcionadas
        if (xInput && xInput.value.trim() !== '') {
            xEquations.push(xInput.value.trim());
            
            // Asegurarse de que la ecuación y coincide (añadir vacío si no está presente)
            if (yInput && yInput.value.trim() !== '') {
                yEquations.push(yInput.value.trim());
            } else {
                // Si no se proporciona la ecuación y pero tenemos x, añade un vacio para mantener los índices alineados
                yEquations.push('0');
            }
            
            // Añadir componente z (si se especifica o por defecto a 0)
            if (zInput && zInput.value.trim() !== '') {
                zEquations.push(zInput.value.trim());
            } else {
                // Por defecto z=0 si no se proporciona para mantener los índices alineados
                zEquations.push('0');
            }
        } else if (yInput && yInput.value.trim() !== '') {
            xEquations.push('0'); // Si no hay x, agrega '0'
            yEquations.push(yInput.value.trim());
            
            // Añadir componente z (si se especifica o por defecto a 0)
            if (zInput && zInput.value.trim() !== '') {
                zEquations.push(zInput.value.trim());
            } else {
                zEquations.push('0');
            }
        } else if (zInput && zInput.value.trim() !== '') {
            // Si sólo se proporciona la ecuación z
            xEquations.push('0');
            yEquations.push('0');
            zEquations.push(zInput.value.trim());
        }
    });
    
    // Construye el objeto de variables
    const variables = {};
    const variableInputs = document.querySelectorAll('#variablesContainer input');
    
    console.log("Variables available: ", variableInputs.length);
    
    variableInputs.forEach(input => {
        if (input.value.trim() !== '') {
            const exerciseType = document.getElementById('exerciseType').value;
            
            // Utilizar directamente el ID de la entrada
            let varName = input.id;
            
            // Para TP (Projectile Motion) necesitamos mapeados específicos
            if (exerciseType === 'TP') {
                if (varName === 'v0') varName = 'v_0';
                else if (varName === 'v0x') varName = 'v_0x';
                else if (varName === 'v0y') varName = 'v_0y';
            }
            
            // Registrar todas las variables para depuración
            console.log(`Variable: ${exerciseType} > ${input.id} = ${input.value.trim()} (mapped to: ${varName})`);
            
            // Añadir el valor de la variable
            variables[varName] = input.value.trim();
        }
    });
    
    // Construye la URL con los parámetros
    let url = `/get_data?t_max=${formData.get('t_max')}&intervals=${formData.get('intervals')}`;
    xEquations.forEach(eq => url += `&x_equations=${encodeURIComponent(eq)}`);
    yEquations.forEach(eq => url += `&y_equations=${encodeURIComponent(eq)}`);
    zEquations.forEach(eq => url += `&z_equations=${encodeURIComponent(eq)}`);
    url += `&variables=${encodeURIComponent(JSON.stringify(variables))}`;
    url += `&exercise_type=${formData.get('exerciseType')}`;
    url += `&solve_for=${formData.get('solveFor')}`;
    
    // Envía la solicitud al servidor
    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Error del servidor');
                });
            }
            return response.json();
        })
        .then(data => {
            // Almacena los datos para uso posterior
            window.currentData = data;
            
            // Muestra la solución si está disponible
            if (data.solution) {
                document.getElementById('solutionOutput').innerHTML = `<div class="p-4 bg-green-50 text-green-800 rounded border border-green-200">${data.solution}</div>`;
            } else {
                document.getElementById('solutionOutput').innerHTML = `<div class="p-4 bg-gray-50 text-gray-600 rounded border border-gray-200">No hay solución disponible.</div>`;
            }
            
            // Actualiza los gráficos si no es solo solución
            if (!solutionOnly) {
                updateCharts(data);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('solutionOutput').innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded border border-red-200">Error: ${error.message}</div>`;
            resetCharts(); // Restablece los gráficos en caso de error
        });
}

function resetCharts() {
    // Limpia los gráficos 2D
    const chartContainer = document.getElementById('charts2d');
    chartContainer.querySelectorAll('canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Limpia los gráficos 3D
    const plot3dContainer = document.getElementById('chart3d');
    plot3dContainer.querySelectorAll('[id$="3d"]').forEach(div => {
        if (div.id !== 'chart3d') {
            Plotly.purge(div);
        }
    });
}

// Variables globales para la gestión de funciones vectoriales
window.vectorFunctionIdCounter = 1; // Contador para asignar IDs únicos a las funciones vectoriales
window.vectorFunctionVisibility = {}; // Objeto para rastrear la visibilidad de las funciones vectoriales

// Agrega la función vectorial inicial
document.getElementById('addVectorFunctionBtn').addEventListener('click', addVectorFunction);

// Maneja eventos en el contenedor de funciones vectoriales (eliminar y alternar visibilidad)
document.getElementById('vectorFunctionsContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-vector-function')) {
        // Elimina una función vectorial si hay más de una
        if (document.querySelectorAll('.vector-function-input').length > 1) {
            const parentDiv = e.target.parentElement;
            const id = parseInt(parentDiv.getAttribute('data-original-index'), 10);
            delete window.vectorFunctionVisibility[id]; // Elimina el seguimiento de visibilidad
            parentDiv.remove(); // Elimina el elemento del DOM
            updateRemoveVectorButtons(); // Actualiza los botones de eliminación
            fetchDataAndUpdate(); // Actualiza los gráficos
        }
    }
    
    // Alterna la visibilidad de una función vectorial
    if (e.target.closest('.toggle-visibility')) {
        const toggleBtn = e.target.closest('.toggle-visibility');
        const icon = toggleBtn.querySelector('i');
        const parentDiv = toggleBtn.parentElement;
        const id = parseInt(parentDiv.getAttribute('data-original-index'), 10);
        
        if (icon.classList.contains('fa-eye')) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            parentDiv.classList.add('opacity-50'); // Aplica opacidad para indicar que está oculta
            window.vectorFunctionVisibility[id] = false; // Marca la función como oculta
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            parentDiv.classList.remove('opacity-50'); // Elimina la opacidad
            window.vectorFunctionVisibility[id] = true; // Marca la función como visible
        }
        
        // Actualiza los gráficos inmediatamente
        fetchDataAndUpdate();
    }
});
