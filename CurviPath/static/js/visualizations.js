// Funciones de visualización para gráficos y trazados

// Actualiza todos los gráficos con nuevos datos
function updateCharts(data) {
    if (!data || !data.t) {
        console.error('Invalid data format'); // Verifica que los datos sean válidos
        return;
    }
    
    const is3D = document.getElementById('visualization3d').checked; // Verifica si la visualización es en 3D
    
    if (is3D) {
        update3DCharts(data); // Actualiza gráficos en 3D
    } else {
        update2DCharts(data); // Actualiza gráficos en 2D
    }
}

// Actualiza gráficos en 2D utilizando Chart.js
function update2DCharts(data) {
    // Recrea los elementos canvas para evitar problemas de redimensionamiento
    document.getElementById('trajectoryChart').parentElement.innerHTML = `<canvas id="trajectoryChart" class="w-full h-64"></canvas>`;
    document.getElementById('velocityChart').parentElement.innerHTML = `<canvas id="velocityChart" class="w-full h-64"></canvas>`;
    document.getElementById('accelerationChart').parentElement.innerHTML = `<canvas id="accelerationChart" class="w-full h-64"></canvas>`;
    
    // Obtiene los contextos de los canvas
    const trajectoryCtx = document.getElementById('trajectoryChart').getContext('2d');
    const velocityCtx = document.getElementById('velocityChart').getContext('2d');
    const accelerationCtx = document.getElementById('accelerationChart').getContext('2d');
    
    // Define colores para las diferentes funciones
    const colors = [
        'rgb(54, 162, 235)',   // azul
        'rgb(255, 99, 132)',   // rojo
        'rgb(75, 192, 192)',   // verde
        'rgb(255, 159, 64)',   // naranja
        'rgb(153, 102, 255)',  // púrpura
        'rgb(255, 205, 86)',   // amarillo
        'rgb(201, 203, 207)'   // gris
    ];
    
    // Prepara los datasets para los gráficos de trayectoria, velocidad y aceleración
    const trajectoryDatasets = [];
    const velocityDatasets = [];
    const accelerationDatasets = [];
    
    // Determina cuántas funciones vectoriales existen
    let count = 1;
    while (data[`x_eq_${count}`] && data[`y_eq_${count}`]) {
        count++;
    }
    count--; // Ajusta al número real de funciones
    
    // Procesa cada función vectorial
    for (let i = 1; i <= count; i++) {
        const colorIndex = (i - 1) % colors.length; // Selecciona un color de la lista
        const color = colors[colorIndex];
        
        // Agrega el dataset de trayectoria si existen las componentes x e y
        if (data[`x_eq_${i}`] && data[`y_eq_${i}`]) {
            trajectoryDatasets.push({
                label: `Trayectoria ${i}`,
                data: data[`x_eq_${i}`].map((x, j) => ({
                    x: x,
                    y: data[`y_eq_${i}`][j]
                })), // Combina las componentes x e y
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1,
                pointRadius: 0,
                pointHitRadius: 5,
                showLine: true,
            });
            
            // Agrega el dataset de velocidad (primera derivada de la posición)
            if (data[`x_v_${i}`] && data[`y_v_${i}`]) {
                velocityDatasets.push({
                    label: `vy Función ${i}`,
                    data: data.t.map((t, j) => ({
                        x: t,
                        y: data[`y_v_${i}`][j]
                    })), // Velocidad en función del tiempo
                    backgroundColor: 'transparent',
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHitRadius: 5,
                    showLine: true,
                    tension: 0.4
                });
            }
            
            // Agrega el dataset de aceleración (segunda derivada de la posición)
            if (data[`x_a_${i}`] && data[`y_a_${i}`]) {
                accelerationDatasets.push({
                    label: `ay Función ${i}`,
                    data: data.t.map((t, j) => ({
                        x: t,
                        y: data[`y_a_${i}`][j]
                    })), // Aceleración en función del tiempo
                    backgroundColor: 'transparent',
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHitRadius: 5,
                    showLine: true,
                    tension: 0.4
                });
            }
        }
    }
    
    // Crea el gráfico de trayectoria
    new Chart(trajectoryCtx, {
        type: 'scatter',
        data: {
            datasets: trajectoryDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'x'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'y'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
    
    // Crea el gráfico de velocidad
    new Chart(velocityCtx, {
        type: 'scatter',
        data: {
            datasets: velocityDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 't'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'v(t)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
    
    // Crea el gráfico de aceleración
    new Chart(accelerationCtx, {
        type: 'scatter',
        data: {
            datasets: accelerationDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 't'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'a(t)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
}

// Actualiza gráficos en 3D utilizando Plotly.js
function update3DCharts(data) {
    // Obtiene los contenedores para los gráficos 3D
    const trajectory3dDiv = document.getElementById('trajectory3d');
    const velocity3dDiv = document.getElementById('velocity3d');
    const acceleration3dDiv = document.getElementById('acceleration3d');
    
    // Limpia los gráficos existentes
    Plotly.purge(trajectory3dDiv);
    Plotly.purge(velocity3dDiv);
    Plotly.purge(acceleration3dDiv);
    
    // Define colores para las diferentes funciones
    const colors = [
        'rgb(54, 162, 235)',   // azul
        'rgb(255, 99, 132)',   // rojo
        'rgb(75, 192, 192)',   // verde
        'rgb(255, 159, 64)',   // naranja
        'rgb(153, 102, 255)',  // púrpura
        'rgb(255, 205, 86)',   // amarillo
        'rgb(201, 203, 207)'   // gris
    ];
    
    // Prepara los datos para los gráficos 3D
    const trajectoryTraces = [];
    const velocityTraces = [];
    const accelerationTraces = [];
    
    // Determina cuántas funciones vectoriales existen
    let count = 1;
    while (data[`x_eq_${count}`] && data[`y_eq_${count}`]) {
        count++;
    }
    count--; // Ajusta al número real de funciones
    
    // Procesa cada función vectorial
    for (let i = 1; i <= count; i++) {
        const colorIndex = (i - 1) % colors.length; // Selecciona un color de la lista
        const color = colors[colorIndex];
        
        // Agrega el trazado de trayectoria si existen las componentes
        if (data[`x_eq_${i}`] && data[`y_eq_${i}`]) {
            const trajectoryTrace = {
                type: 'scatter3d',
                mode: 'lines',
                name: `Trayectoria ${i}`,
                x: data[`x_eq_${i}`],
                y: data[`y_eq_${i}`],
                z: data[`z_eq_${i}`] || Array(data[`x_eq_${i}`].length).fill(0), // Usa z=0 si no se proporciona
                line: {
                    color: color,
                    width: 3
                }
            };
            trajectoryTraces.push(trajectoryTrace);
            
            // Añadir velocidad en 3D (derivada de la posición)
            if (data[`x_v_${i}`] && data[`y_v_${i}`]) {
                // Para la visualización 3D, mostramos la velocidad como una curva 3D
                const velocityTrace = {
                    type: 'scatter3d',
                    mode: 'lines',
                    name: `Velocidad ${i}`,
                    x: data[`x_v_${i}`],
                    y: data[`y_v_${i}`],
                    z: data[`z_v_${i}`] || Array(data[`x_v_${i}`].length).fill(0),
                    line: {
                        color: color,
                        width: 3
                    }
                };
                velocityTraces.push(velocityTrace);
            }
            
            // Añadir aceleracion en 3D (segunda derivada de la posición)
            if (data[`x_a_${i}`] && data[`y_a_${i}`]) {
                // Para la visualización 3D, mostramos la aceleración como una curva 3D
                const accelerationTrace = {
                    type: 'scatter3d',
                    mode: 'lines',
                    name: `Aceleración ${i}`,
                    x: data[`x_a_${i}`],
                    y: data[`y_a_${i}`],
                    z: data[`z_a_${i}`] || Array(data[`x_a_${i}`].length).fill(0),
                    line: {
                        color: color,
                        width: 3
                    }
                };
                accelerationTraces.push(accelerationTrace);
            }
        }
    }
    
    // Crear grafico de trayectoria en 3D
    const trajectoryLayout = {
        title: 'Trayectoria 3D',
        scene: {
            xaxis: { title: 'x' },
            yaxis: { title: 'y' },
            zaxis: { title: 'z' },
            aspectmode: 'cube'
        },
        margin: { l: 0, r: 0, b: 0, t: 30 }
    };
    
    // Crear grafico de velocidad en 3D
    const velocityLayout = {
        title: 'Velocidad 3D',
        scene: {
            xaxis: { title: 't' },
            yaxis: { title: 'v_x' },
            zaxis: { title: 'v_y / |v|' },
            aspectmode: 'auto'
        },
        margin: { l: 0, r: 0, b: 0, t: 30 }
    };
    
    // Crear grafico de aceleración en 3D
    const accelerationLayout = {
        title: 'Aceleración 3D',
        scene: {
            xaxis: { title: 't' },
            yaxis: { title: 'a_x' },
            zaxis: { title: 'a_y / |a|' },
            aspectmode: 'auto'
        },
        margin: { l: 0, r: 0, b: 0, t: 30 }
    };
    
    // Configuracion para los gráficos
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };
    
    // Renderizar graficos si hay datos
    if (trajectoryTraces.length > 0) {
        Plotly.newPlot(trajectory3dDiv, trajectoryTraces, trajectoryLayout, config);
    } else {
        trajectory3dDiv.innerHTML = '<div class="p-4 text-center text-gray-500">No hay datos suficientes para la visualización 3D</div>';
    }
    
    if (velocityTraces.length > 0) {
        Plotly.newPlot(velocity3dDiv, velocityTraces, velocityLayout, config);
    } else {
        velocity3dDiv.innerHTML = '<div class="p-4 text-center text-gray-500">No hay datos suficientes para la visualización 3D</div>';
    }
    
    if (accelerationTraces.length > 0) {
        Plotly.newPlot(acceleration3dDiv, accelerationTraces, accelerationLayout, config);
    } else {
        acceleration3dDiv.innerHTML = '<div class="p-4 text-center text-gray-500">No hay datos suficientes para la visualización 3D</div>';
    }
}
