// Funciones utilitarias para cálculos matemáticos

// Convierte coordenadas polares a cartesianas
function polarToCartesian(r, theta) {
    return {
        x: r * Math.cos(theta), // Calcula la coordenada x
        y: r * Math.sin(theta)  // Calcula la coordenada y
    };
}

// Calcula la derivada de una función en un punto usando diferencias centrales
function numericalDerivative(func, x, h = 0.0001) {
    return (func(x + h) - func(x - h)) / (2 * h); // Fórmula de diferencias centrales
}

// Calcula la segunda derivada de una función en un punto
function secondDerivative(func, x, h = 0.0001) {
    return (func(x + h) - 2 * func(x) + func(x - h)) / (h * h); // Fórmula de diferencias centrales para la segunda derivada
}

// Convierte grados a radianes
function degToRad(degrees) {
    return degrees * Math.PI / 180; // Fórmula de conversión
}

// Convierte radianes a grados
function radToDeg(radians) {
    return radians * 180 / Math.PI; // Fórmula de conversión
}

// Calcula la longitud de arco de una curva definida por funciones paramétricas
function arcLength(x_func, y_func, t_start, t_end, steps = 100) {
    const dt = (t_end - t_start) / steps; // Incremento de tiempo
    let length = 0; // Inicializa la longitud en 0
    
    for (let i = 0; i < steps; i++) {
        const t1 = t_start + i * dt; // Tiempo inicial del segmento
        const t2 = t1 + dt;          // Tiempo final del segmento
        
        const x1 = x_func(t1); // Coordenada x en t1
        const y1 = y_func(t1); // Coordenada y en t1
        const x2 = x_func(t2); // Coordenada x en t2
        const y2 = y_func(t2); // Coordenada y en t2
        
        // Calcula la distancia entre los puntos (x1, y1) y (x2, y2)
        const segment = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        length += segment; // Suma la longitud del segmento a la longitud total
    }
    
    return length; // Devuelve la longitud total
}

// Calcula la curvatura de una curva en un punto
function curvature(x_func, y_func, t, h = 0.0001) {
    const dx_dt = numericalDerivative(x_func, t, h); // Derivada de x respecto a t
    const dy_dt = numericalDerivative(y_func, t, h); // Derivada de y respecto a t
    const d2x_dt2 = secondDerivative(x_func, t, h);  // Segunda derivada de x respecto a t
    const d2y_dt2 = secondDerivative(y_func, t, h);  // Segunda derivada de y respecto a t
    
    // Fórmula de la curvatura
    const numerator = dx_dt * d2y_dt2 - dy_dt * d2x_dt2;
    const denominator = Math.pow(dx_dt * dx_dt + dy_dt * dy_dt, 3/2);
    
    return Math.abs(numerator / denominator); // Devuelve el valor absoluto de la curvatura
}

// Genera datos para una función paramétrica
function generateParametricData(x_func, y_func, t_start, t_end, steps = 100) {
    const dt = (t_end - t_start) / steps; // Incremento de tiempo
    const data = []; // Arreglo para almacenar los datos generados
    
    for (let i = 0; i <= steps; i++) {
        const t = t_start + i * dt; // Tiempo actual
        data.push({
            t: t,          // Tiempo
            x: x_func(t),  // Coordenada x
            y: y_func(t)   // Coordenada y
        });
    }
    
    return data; // Devuelve los datos generados
}

// Convierte una expresión matemática en una función de JavaScript
function parseExpression(expr) {
    // Reemplaza funciones y constantes matemáticas comunes
    expr = expr.replace(/sen/g, 'Math.sin');
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/tan/g, 'Math.tan');
    expr = expr.replace(/asin|arcsin/g, 'Math.asin');
    expr = expr.replace(/acos|arccos/g, 'Math.acos');
    expr = expr.replace(/atan|arctan/g, 'Math.atan');
    expr = expr.replace(/sqrt/g, 'Math.sqrt');
    expr = expr.replace(/abs/g, 'Math.abs');
    expr = expr.replace(/exp/g, 'Math.exp');
    expr = expr.replace(/log/g, 'Math.log');
    expr = expr.replace(/pi/g, 'Math.PI');
    expr = expr.replace(/e(?![a-zA-Z])/g, 'Math.E');
    
    // Agrega multiplicación explícita para coeficientes numéricos
    expr = expr.replace(/(\d)([a-zA-Z])/g, '$1 * $2');
    
    try {
        // Crea una función a partir de la expresión
        return new Function('t', `return ${expr};`);
    } catch (error) {
        console.error('Error parsing expression:', error);
        return t => 0; // Devuelve una función que siempre retorna 0 en caso de error
    }
}

// Calcula el vector tangente unitario en un punto
function unitTangentVector(x_func, y_func, t, h = 0.0001) {
    const dx_dt = numericalDerivative(x_func, t, h); // Derivada de x respecto a t
    const dy_dt = numericalDerivative(y_func, t, h); // Derivada de y respecto a t
    
    const magnitude = Math.sqrt(dx_dt * dx_dt + dy_dt * dy_dt); // Magnitud del vector tangente
    
    return {
        x: dx_dt / magnitude, // Componente x del vector tangente unitario
        y: dy_dt / magnitude  // Componente y del vector tangente unitario
    };
}

// Calcula el vector normal unitario en un punto
function unitNormalVector(x_func, y_func, t, h = 0.0001) {
    const tangent = unitTangentVector(x_func, y_func, t, h); // Vector tangente unitario
    
    // El vector normal es perpendicular al vector tangente
    return {
        x: -tangent.y, // Componente x del vector normal unitario
        y: tangent.x   // Componente y del vector normal unitario
    };
}

// Calcula las componentes tangencial y normal de la aceleración
function accelerationComponents(x_func, y_func, t, h = 0.0001) {
    const dx_dt = numericalDerivative(x_func, t, h); // Derivada de x respecto a t
    const dy_dt = numericalDerivative(y_func, t, h); // Derivada de y respecto a t
    const d2x_dt2 = secondDerivative(x_func, t, h);  // Segunda derivada de x respecto a t
    const d2y_dt2 = secondDerivative(y_func, t, h);  // Segunda derivada de y respecto a t
    
    const velocity = Math.sqrt(dx_dt * dx_dt + dy_dt * dy_dt); // Magnitud de la velocidad
    const tangent = unitTangentVector(x_func, y_func, t, h);   // Vector tangente unitario
    const normal = unitNormalVector(x_func, y_func, t, h);     // Vector normal unitario
    
    // Componente tangencial de la aceleración
    const a_tangential = (dx_dt * d2x_dt2 + dy_dt * d2y_dt2) / velocity;
    
    // Componente normal de la aceleración
    const a_normal = curvature(x_func, y_func, t, h) * velocity * velocity;
    
    return {
        tangential: a_tangential, // Aceleración tangencial
        normal: a_normal,         // Aceleración normal
        total: Math.sqrt(a_tangential * a_tangential + a_normal * a_normal) // Aceleración total
    };
}
