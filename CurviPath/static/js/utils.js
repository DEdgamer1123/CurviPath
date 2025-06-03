// Funciones utilitarias para la aplicación

// Formatea un número con la precisión especificada
function formatNumber(number, precision = 4) {
    // Verifica si el valor es un número válido
    if (typeof number !== 'number' || isNaN(number)) {
        return 'N/A'; // Devuelve "N/A" si no es un número
    }
    return number.toFixed(precision); // Devuelve el número con la cantidad de decimales especificada
}

// Formatea el resultado de una solución para mostrarlo de manera más legible
function formatSolutionResult(data) {
    if (!data) return ''; // Si no hay datos, devuelve una cadena vacía
    
    // Si los datos son un objeto
    if (typeof data === 'object') {
        if (data.result !== undefined) {
            // Si el objeto tiene un campo "result", formatea ese valor con 2 decimales
            return formatNumber(data.result, 2);
        } else {
            // Si no hay un campo "result", recorre las propiedades del objeto
            return Object.entries(data)
                .map(([key, value]) => {
                    // Mapea nombres de propiedades a etiquetas más amigables
                    const label = {
                        'v0': 'Velocidad inicial',
                        'angle': 'Ángulo',
                        'g': 'Gravedad',
                        'r': 'Radio',
                        'omega': 'Velocidad angular',
                        'alpha': 'Aceleración angular'
                    }[key] || key; // Usa el nombre original si no hay una etiqueta definida
                    
                    // Formatea el valor
                    const formattedValue = typeof value === 'number' ? formatNumber(value, 2) : value;
                    
                    return `${label}: ${formattedValue}`; // Devuelve la etiqueta y el valor formateado
                })
                .join(', '); // Une todas las propiedades en una cadena separada por comas
        }
    }
    
    // Si los datos son un número, formatea el número con 2 decimales
    if (typeof data === 'number') {
        return formatNumber(data, 2);
    }
    
    // Si no se puede formatear mejor, devuelve los datos como cadena
    return String(data);
}

// Genera un color aleatorio en formato HSL
function randomColor() {
    const hue = Math.floor(Math.random() * 360); // Genera un valor aleatorio para el tono (hue)
    return `hsl(${hue}, 70%, 60%)`; // Devuelve el color en formato HSL
}

// Genera múltiples colores distintos
function generateColors(count) {
    const colors = [];
    const hueStep = 360 / count; // Divide el espectro de colores en partes iguales
    
    for (let i = 0; i < count; i++) {
        const hue = i * hueStep; // Calcula el tono para cada color
        colors.push(`hsl(${hue}, 70%, 60%)`); // Agrega el color al arreglo
    }
    
    return colors; // Devuelve el arreglo de colores
}

// Muestra un mensaje de error en un contenedor
function showError(container, message) {
    const errorDiv = document.createElement('div'); // Crea un elemento div
    errorDiv.className = 'notification notification-error'; // Asigna clases CSS para el estilo
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`; // Agrega el mensaje con un ícono
    
    // Limpia el contenido previo del contenedor
    container.innerHTML = '';
    container.appendChild(errorDiv); // Agrega el mensaje de error al contenedor
}

// Muestra un mensaje de éxito en un contenedor
function showSuccess(container, message) {
    const successDiv = document.createElement('div'); // Crea un elemento div
    successDiv.className = 'notification notification-success'; // Asigna clases CSS para el estilo
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`; // Agrega el mensaje con un ícono
    
    // Limpia el contenido previo del contenedor
    container.innerHTML = '';
    container.appendChild(successDiv); // Agrega el mensaje de éxito al contenedor
}

// Muestra un indicador de carga en un contenedor
function showLoading(container, message = 'Cargando...') {
    const loadingDiv = document.createElement('div'); // Crea un elemento div
    loadingDiv.className = 'text-center p-4'; // Asigna clases CSS para el estilo
    loadingDiv.innerHTML = `
        <div class="loading-spinner d-inline-block me-2"></div>
        <span>${message}</span>
    `; // Agrega un spinner y el mensaje de carga
    
    // Limpia el contenido previo del contenedor
    container.innerHTML = '';
    container.appendChild(loadingDiv); // Agrega el indicador de carga al contenedor
}

// Función debounce para limitar la frecuencia de ejecución de una función
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout); // Limpia el temporizador previo
        timeout = setTimeout(() => func.apply(this, args), wait); // Ejecuta la función después del tiempo especificado
    };
}

// Función throttle para ejecutar una función como máximo una vez en un período de tiempo
function throttle(func, wait = 300) {
    let waiting = false;
    return function(...args) {
        if (!waiting) {
            func.apply(this, args); // Ejecuta la función si no está en espera
            waiting = true; // Activa el estado de espera
            setTimeout(() => {
                waiting = false; // Desactiva el estado de espera después del tiempo especificado
            }, wait);
        }
    };
}

// Valida una expresión matemática
function validateExpression(expr) {
    try {
        // Elimina espacios y verifica errores básicos de sintaxis
        expr = expr.replace(/\s+/g, ''); // Elimina espacios
        
        // Verifica paréntesis desbalanceados
        let parenCount = 0;
        for (let i = 0; i < expr.length; i++) {
            if (expr[i] === '(') parenCount++;
            else if (expr[i] === ')') parenCount--;
            
            if (parenCount < 0) return false; // Más paréntesis de cierre que de apertura
        }
        if (parenCount !== 0) return false; // Paréntesis desbalanceados
        
        // Verifica operadores inválidos
        if (/[+\-*/^]$/.test(expr)) return false; // Termina con un operador
        if (/^[*/^]/.test(expr)) return false; // Comienza con un operador inválido
        if (/[+\-*/^][+*/^]/.test(expr)) return false; // Operadores consecutivos
        
        return true; // La expresión es válida
    } catch (error) {
        return false; // Devuelve falso si ocurre un error
    }
}

// Genera ecuaciones de ejemplo para diferentes tipos de ejercicios
function getExampleEquations(exerciseType) {
    const examples = {
        MCU: {
            x: 'r * cos(omega * t)',
            y: 'r * sin(omega * t)',
            z: '0'
        },
        MCNU: {
            x: 'r * cos(omega_i * t + 0.5 * alpha * t^2)',
            y: 'r * sin(omega_i * t + 0.5 * alpha * t^2)',
            z: '0'
        },
        TP: {
            x: 'v_0 * cos(theta) * t',
            y: 'v_0 * sin(theta) * t - 0.5 * g * t^2',
            z: '0'
        },
        MCG: {
            x: 'cos(t) + t*sin(t)',
            y: 'sin(t) - t*cos(t)',
            z: '0'
        }
    };
    
    return examples[exerciseType] || { x: '', y: '', z: '' }; // Devuelve las ecuaciones correspondientes o vacías
}

// Analiza los parámetros de la URL para rellenar el formulario
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search); // Obtiene los parámetros de la URL
    
    // Configura el tipo de ejercicio si está presente
    const exerciseType = params.get('type');
    if (exerciseType && document.getElementById('exerciseType').querySelector(`option[value="${exerciseType}"]`)) {
        document.getElementById('exerciseType').value = exerciseType;
        document.getElementById('exerciseType').dispatchEvent(new Event('change')); // Dispara el evento de cambio
    }
    
    // Configura los parámetros de tiempo si están presentes
    if (params.get('t_max')) {
        document.getElementById('t_max').value = params.get('t_max');
    }
    if (params.get('intervals')) {
        document.getElementById('intervals').value = params.get('intervals');
    }
    
    // Configura las ecuaciones si están presentes
    const x_eq = params.get('x_eq');
    const y_eq = params.get('y_eq');
    const z_eq = params.get('z_eq');
    if (x_eq || y_eq || z_eq) {
        if (document.querySelectorAll('.vector-function-input').length === 0) {
            addVectorFunction(); // Agrega un campo de función vectorial si no existe
        }
        const firstVectorFunction = document.querySelector('.vector-function-input');
        if (firstVectorFunction) {
            if (x_eq) firstVectorFunction.querySelector('.vector-x').value = x_eq;
            if (y_eq) firstVectorFunction.querySelector('.vector-y').value = y_eq;
            if (z_eq) firstVectorFunction.querySelector('.vector-z').value = z_eq;
        }
    }
    
    // Configura las variables si están presentes
    const variablesJson = params.get('variables');
    if (variablesJson) {
        try {
            const variables = JSON.parse(variablesJson);
            for (const [key, value] of Object.entries(variables)) {
                const input = document.getElementById(key.replace(/_/g, ''));
                if (input) {
                    input.value = value;
                }
            }
        } catch (error) {
            console.error('Error parsing variables from URL', error);
        }
    }
    
    // Configura la variable a resolver si está presente
    const solveFor = params.get('solve_for');
    if (solveFor && document.getElementById('solveFor').querySelector(`option[value="${solveFor}"]`)) {
        document.getElementById('solveFor').value = solveFor;
    }
    
    // Configura la visualización 3D si está presente
    const is3D = params.get('visualization3d');
    if (is3D === 'true') {
        document.getElementById('visualization3d').checked = true;
        toggleVisualizationType(); // Cambia el tipo de visualización
    }
}

// Crea una URL compartible con el estado actual del formulario
function createShareableUrl() {
    const url = new URL(window.location.href);
    url.search = ''; // Limpia los parámetros existentes
    
    // Agrega los parámetros básicos
    url.searchParams.set('type', document.getElementById('exerciseType').value);
    url.searchParams.set('t_max', document.getElementById('t_max').value);
    url.searchParams.set('intervals', document.getElementById('intervals').value);
    
    // Agrega las ecuaciones de la primera función vectorial
    const firstVectorFunction = document.querySelector('.vector-function-input');
    if (firstVectorFunction) {
        const x_eq = firstVectorFunction.querySelector('.vector-x').value;
        const y_eq = firstVectorFunction.querySelector('.vector-y').value;
        const z_eq = firstVectorFunction.querySelector('.vector-z').value;
        
        if (x_eq) url.searchParams.set('x_eq', x_eq);
        if (y_eq) url.searchParams.set('y_eq', y_eq);
        if (z_eq) url.searchParams.set('z_eq', z_eq);
    }
    
    // Agrega las variables
    const variables = {};
    const variableInputs = document.querySelectorAll('#variablesContainer input');
    variableInputs.forEach(input => {
        if (input.value.trim() !== '') {
            const varName = input.id.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
            variables[varName] = input.value.trim();
        }
    });
    if (Object.keys(variables).length > 0) {
        url.searchParams.set('variables', JSON.stringify(variables));
    }
    
    // Agrega la variable a resolver
    url.searchParams.set('solve_for', document.getElementById('solveFor').value);
    
    // Agrega el estado de visualización 3D
    url.searchParams.set('visualization3d', document.getElementById('visualization3d').checked);
    
    return url.toString(); // Devuelve la URL generada
}

// Copia texto al portapapeles
function copyToClipboard(text) {
    const textarea = document.createElement('textarea'); // Crea un elemento textarea temporal
    textarea.value = text; // Asigna el texto a copiar
    textarea.setAttribute('readonly', ''); // Evita que se edite
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px'; // Lo posiciona fuera de la pantalla
    document.body.appendChild(textarea); // Lo agrega al DOM
    
    textarea.select(); // Selecciona el texto
    document.execCommand('copy'); // Copia el texto al portapapeles
    
    document.body.removeChild(textarea); // Elimina el textarea temporal
    return true; // Devuelve true si se copió correctamente
}

// Inicializa la funcionalidad de tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]'); // Selecciona todos los elementos con tooltips
    
    tooltips.forEach(tooltip => {
        const tooltipText = tooltip.getAttribute('data-tooltip'); // Obtiene el texto del tooltip
        
        tooltip.addEventListener('mouseenter', (e) => {
            const tooltipElement = document.createElement('div'); // Crea un elemento div para el tooltip
            tooltipElement.className = 'absolute bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 max-w-xs';
            tooltipElement.style.bottom = 'calc(100% + 5px)';
            tooltipElement.style.left = '50%';
            tooltipElement.style.transform = 'translateX(-50%)';
            tooltipElement.textContent = tooltipText; // Asigna el texto del tooltip
            
            tooltip.style.position = 'relative';
            tooltip.appendChild(tooltipElement); // Agrega el tooltip al elemento
        });
        
        tooltip.addEventListener('mouseleave', () => {
            const tooltipElement = tooltip.querySelector('div'); // Selecciona el tooltip
            if (tooltipElement) {
                tooltip.removeChild(tooltipElement); // Elimina el tooltip
            }
        });
    });
}

// Función que se ejecuta cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    initTooltips(); // Inicializa los tooltips
    parseUrlParams(); // Analiza los parámetros de la URL
    
    // Agrega funcionalidad al botón de compartir si está presente
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareUrl = createShareableUrl(); // Crea la URL compartible
            copyToClipboard(shareUrl); // Copia la URL al portapapeles
            
            // Muestra un mensaje de éxito
            showSuccess(document.getElementById('shareStatus'), 'URL copiada al portapapeles');
            
            // Oculta el mensaje después de 3 segundos
            setTimeout(() => {
                document.getElementById('shareStatus').innerHTML = '';
            }, 3000);
        });
    }
});
