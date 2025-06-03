# Importación de módulos necesarios
from flask import Flask, render_template, request, jsonify  # Framework Flask para crear la aplicación web
import numpy as np  # Biblioteca para cálculos numéricos
import sympy as sp  # Biblioteca para cálculos simbólicos
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application  # Herramientas para analizar expresiones simbólicas
import json  # Manejo de datos en formato JSON
import re  # Expresiones regulares para manipulación de cadenas
import logging  # Registro de eventos y errores
import os  # Acceso a variables de entorno del sistema operativo

# Configuración del registro de logs
logging.basicConfig(level=logging.DEBUG)  # Configura el nivel de detalle de los logs (DEBUG)

# Inicialización de la aplicación Flask
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "curvipath_dev_key")  # Clave secreta para sesiones

# Ruta principal de la aplicación
@app.route('/')
def index():
    """Renderiza la página principal de la aplicación."""
    return render_template('index.html')  # Devuelve el archivo HTML principal

# Ruta para procesar datos y devolver resultados
@app.route('/get_data')
def get_data():
    """
    Procesa ecuaciones matemáticas y devuelve datos calculados.
    Maneja funciones vectoriales, derivadas y soluciones para problemas de física.
    """
    try:
        # Obtención de parámetros de entrada desde la solicitud HTTP
        t_max = float(request.args.get('t_max', 10.0))  # Tiempo máximo
        intervals = int(request.args.get('intervals', 100))  # Número de intervalos
        x_equations_raw = request.args.getlist('x_equations')  # Ecuaciones para la componente x
        y_equations_raw = request.args.getlist('y_equations')  # Ecuaciones para la componente y
        z_equations_raw = request.args.getlist('z_equations')  # Ecuaciones para la componente z
        variables_json = request.args.get('variables', '{}')  # Variables adicionales en formato JSON
        variables = json.loads(variables_json)  # Decodifica las variables JSON a un diccionario
        solve_for = request.args.get('solve_for', None)  # Variable a resolver
        exercise_type = request.args.get('exercise_type', None)  # Tipo de ejercicio físico
        logging.debug(f"Processing equations with parameters: {request.args}")  # Log de los parámetros recibidos
    except (TypeError, ValueError, json.JSONDecodeError) as e:
        # Manejo de errores en los parámetros de entrada
        logging.error(f"Invalid parameters: {str(e)}")
        return jsonify({'error': 'Invalid parameters: ' + str(e)}), 400

    # Conversión de ángulo θ de grados a radianes si está presente
    if 'θ' in variables:
        try:
            variables['θ'] = sp.rad(float(variables['θ']))
        except ValueError:
            return jsonify({'error': 'El valor de θ no es un número válido'}), 400
        except Exception as e:
            return jsonify({'error': f'Error al convertir el ángulo a radianes: {str(e)}'}), 400

    # Creación de un símbolo de tiempo y generación de valores de tiempo
    t = sp.symbols('t')  # Define el símbolo de tiempo
    t_vals = np.linspace(0, t_max, intervals)  # Genera un arreglo de valores de tiempo
    results = {'t': t_vals.tolist()}  # Inicializa el diccionario de resultados con los valores de tiempo

    # Transformaciones para analizar expresiones simbólicas
    transformations = (standard_transformations + (implicit_multiplication_application,))

    # Función para preprocesar ecuaciones
    def preprocess_equation(eq):
        """
        Preprocesa cadenas de ecuaciones para corregir problemas comunes de notación:
        - Elimina espacios
        - Reemplaza 'sen' por 'sin' (función seno en español)
        - Inserta signos de multiplicación explícitos donde faltan
        """
        if not eq or eq.strip() == '':
            return eq
        
        eq = eq.replace(' ', '')  # Elimina espacios
        eq = eq.replace('sen', 'sin')  # Reemplaza 'sen' por 'sin'
        eq = re.sub(r'(\d)([a-zA-Z\(])', r'\1*\2', eq)  # Inserta multiplicación explícita
        return eq

    # Función para evaluar expresiones simbólicas de forma segura
    def safe_evalf_array(expr, vals):
        """
        Evalúa de forma segura una expresión simbólica sobre un arreglo de valores.
        Si falla la evaluación vectorizada, realiza una evaluación elemento por elemento.
        """
        if isinstance(expr, tuple):  # Si la expresión es una tupla, toma el primer elemento
            expr = expr[0]
        f = sp.lambdify(t, expr, 'numpy')  # Convierte la expresión simbólica en una función evaluable
        try:
            y_vals = f(vals)  # Intenta evaluar de forma vectorizada
            y_vals = np.array(y_vals, dtype=np.float64)
        except Exception as e:
            logging.debug(f"Vectorized evaluation failed, falling back to element-wise: {str(e)}")
            y_vals = []
            for val in vals:  # Evalúa elemento por elemento si falla la evaluación vectorizada
                try:
                    yv = expr.subs(t, val).evalf()
                    y_vals.append(float(yv))
                except Exception:
                    y_vals.append(0)  # Valor predeterminado en caso de error
            y_vals = np.array(y_vals, dtype=np.float64)
        return y_vals

    # Determina la longitud máxima de las listas de ecuaciones
    max_len = max(len(x_equations_raw), len(y_equations_raw), len(z_equations_raw))

    # Rellena las listas más cortas con cadenas vacías
    x_equations_raw += [''] * (max_len - len(x_equations_raw))
    y_equations_raw += [''] * (max_len - len(y_equations_raw))
    z_equations_raw += [''] * (max_len - len(z_equations_raw))

    # Procesa cada función vectorial
    for idx in range(max_len):
        x_eq_str = x_equations_raw[idx].strip()  # Ecuación para la componente x
        y_eq_str = y_equations_raw[idx].strip()  # Ecuación para la componente y
        z_eq_str = z_equations_raw[idx].strip()  # Ecuación para la componente z

        # Procesa la componente x
        if x_eq_str:
            try:
                x_processed = preprocess_equation(x_eq_str)  # Preprocesa la ecuación
                x_expr = parse_expr(x_processed, transformations=transformations)  # Analiza la ecuación
                if isinstance(x_expr, tuple):
                    x_expr = x_expr[0]
                x_expr = sp.simplify(x_expr)  # Simplifica la ecuación
                x_vals = safe_evalf_array(x_expr, t_vals)  # Evalúa la ecuación
                results[f'x_eq_{idx+1}'] = x_vals.tolist()

                # Calcula la primera derivada (velocidad)
                dx_expr = sp.diff(x_expr, t)
                dx_expr = sp.simplify(dx_expr)
                dx_vals = safe_evalf_array(dx_expr, t_vals)
                results[f'x_v_{idx+1}'] = dx_vals.tolist()

                # Calcula la segunda derivada (aceleración)
                ddx_expr = sp.diff(dx_expr, t)
                ddx_expr = sp.simplify(ddx_expr)
                ddx_vals = safe_evalf_array(ddx_expr, t_vals)
                results[f'x_a_{idx+1}'] = ddx_vals.tolist()
            except Exception as e:
                logging.error(f"Error processing x equation {idx+1}: {str(e)}")
                return jsonify({'error': f'Error parsing x equation {idx+1}: {str(e)}'}), 400

        # Procesa la componente y
        if y_eq_str:
            try:
                y_processed = preprocess_equation(y_eq_str)
                y_expr = parse_expr(y_processed, transformations=transformations)
                if isinstance(y_expr, tuple):
                    y_expr = y_expr[0]
                y_expr = sp.simplify(y_expr)  # Simplifica la ecuación
                y_vals = safe_evalf_array(y_expr, t_vals)  # Evalúa la ecuación
                results[f'y_eq_{idx+1}'] = y_vals.tolist()

                # Primera derivada (velocidad)
                dy_expr = sp.diff(y_expr, t)
                dy_expr = sp.simplify(dy_expr)
                dy_vals = safe_evalf_array(dy_expr, t_vals)
                results[f'y_v_{idx+1}'] = dy_vals.tolist()

                # Segunda derivada (aceleración)
                ddy_expr = sp.diff(dy_expr, t)
                ddy_expr = sp.simplify(ddy_expr)
                ddy_vals = safe_evalf_array(ddy_expr, t_vals)
                results[f'y_a_{idx+1}'] = ddy_vals.tolist()
            except Exception as e:
                logging.error(f"Error processing y equation {idx+1}: {str(e)}")
                return jsonify({'error': f'Error parsing y equation {idx+1}: {str(e)}'}), 400

        # Procesa la componente z
        if z_eq_str:
            try:
                z_processed = preprocess_equation(z_eq_str)
                z_expr = parse_expr(z_processed, transformations=transformations)
                if isinstance(z_expr, tuple):
                    z_expr = z_expr[0]
                z_expr = sp.simplify(z_expr)  # Simplifica la ecuación
                z_vals = safe_evalf_array(z_expr, t_vals)  # Evalúa la ecuación
                results[f'z_eq_{idx+1}'] = z_vals.tolist()

                # Primera derivada (velocidad)
                dz_expr = sp.diff(z_expr, t)
                dz_expr = sp.simplify(dz_expr)
                dz_vals = safe_evalf_array(dz_expr, t_vals)
                results[f'z_v_{idx+1}'] = dz_vals.tolist()

                # Segunda derivada (aceleración)
                ddz_expr = sp.diff(dz_expr, t)
                ddz_expr = sp.simplify(ddz_expr)
                ddz_vals = safe_evalf_array(ddz_expr, t_vals)
                results[f'z_a_{idx+1}'] = ddz_vals.tolist()
            except Exception as e:
                logging.error(f"Error processing z equation {idx+1}: {str(e)}")
                return jsonify({'error': f'Error parsing z equation {idx+1}: {str(e)}'}), 400

    # Procesa una función adicional z si se proporciona
    z_function_raw = request.args.get('z_function', '').strip()
    if z_function_raw:
        try:
            z_processed = preprocess_equation(z_function_raw)
            z_expr = parse_expr(z_processed, transformations=transformations)
            z_expr = sp.simplify(z_expr)  # Simplifica la ecuación
            z_vals = safe_evalf_array(z_expr, t_vals)  # Evalúa la ecuación
            results['z_eq'] = z_vals.tolist()

            # Primera derivada (velocidad)
            dz_expr = sp.diff(z_expr, t)
            dz_expr = sp.simplify(dz_expr)
            dz_vals = safe_evalf_array(dz_expr, t_vals)
            results['z_v'] = dz_vals.tolist()

            # Segunda derivada (aceleración)
            ddz_expr = sp.diff(dz_expr, t)
            ddz_expr = sp.simplify(ddz_expr)
            ddz_vals = safe_evalf_array(ddz_expr, t_vals)
            results['z_a'] = ddz_vals.tolist()
        except Exception as e:
            logging.error(f"Error processing Z function: {str(e)}")
            return jsonify({'error': f'Error parsing Z function: {str(e)}'}), 400

    # Calcula soluciones para problemas de física si se solicitan
    solution = "Datos insuficientes para calcular la solución."
    solution_data = {}
    
    if solve_for and exercise_type:
        solution, solution_data = calculate_solution(solve_for, exercise_type, variables)
        
        # Convierte valores de sympy.Float a float de Python para JSON serialization
        converted_solution_data = {}
        for k, v in solution_data.items():
            if hasattr(v, 'evalf') or isinstance(v, sp.Float):
                converted_solution_data[k] = float(v)
            else:
                converted_solution_data[k] = v
                
        results['solution'] = solution
        results['solution_data'] = converted_solution_data

    return jsonify(results)  # Devuelve los resultados en formato JSON

# Función para calcular soluciones específicas de problemas de física
def calculate_solution(solve_for, exercise_type, variables):
    """
    Calcula soluciones para problemas de física basados en el tipo de ejercicio.
    Devuelve una cadena explicativa y un diccionario con los datos calculados.
    """
    logging.debug(f"Calculating solution for: {solve_for} in {exercise_type}")
    
    solution_text = "Datos insuficientes para calcular la solución."
    solution_data = {}
    
    # Convertir cualquier objeto sympy.Float a un float de Python para evitar errores de serialización
    def convert_sympy_values(value):
        if hasattr(value, 'evalf'):
            return float(value)
        return value
    
    # Símbolos comunes utilizados en ecuaciones de física
    d, v, a, theta, time_sym, r, omega, alpha, g = sp.symbols('d v a theta time r omega alpha g')
    
    def to_float(val):
        """Convert a value to float if possible, otherwise return None."""
        try:
            # Asegurarse de que 0 sea considerado un valor válido
            if val == 0 or val == '0':
                return 0.0
            return float(val)
        except (TypeError, ValueError):
            return None
            
    # Log de las variables crudas para depuración
    logging.debug(f"Raw variables received: {variables}")
    
    # Extraer y convertir variables físicas según el tipo de ejercicio
    if exercise_type == 'MCU':
        # Variables de MCU
        radius = to_float(variables.get('r'))              # Radio (r)
        omega_val = to_float(variables.get('ω'))           # Velocidad angular (ω)
        vel = to_float(variables.get('v'))                 # Velocidad tangencial (v)
        period = to_float(variables.get('T'))              # Período (T)
        freq = to_float(variables.get('f'))                # Frecuencia (f)
        a_centripetal = to_float(variables.get('a_c'))     # Aceleración centrípeta (a_c)
        theta_val = to_float(variables.get('θ'))           # Ángulo (θ)
        time_var = to_float(variables.get('t'))            # Tiempo (t)
        num_revolutions = to_float(variables.get('N'))     # Número de vueltas (N)
        
        # Rastrear qué variables fueron proporcionadas
        provided = {k: v for k, v in [
            ('r', radius), ('ω', omega_val), ('v', vel), ('T', period),
            ('f', freq), ('a_c', a_centripetal), ('θ', theta_val),
            ('t', time_var), ('N', num_revolutions)
        ] if v is not None}
        
    elif exercise_type == 'MCNU':
        # Variables de MCNU
        radius = to_float(variables.get('r'))              # Radio (r)
        omega_i = to_float(variables.get('ω_i'))           # Velocidad angular inicial (ω_i)
        omega_f = to_float(variables.get('ω_f'))           # Velocidad angular final (ω_f)
        alpha_val = to_float(variables.get('alpha'))       # Aceleración angular (α)
        theta_val = to_float(variables.get('θ'))           # Ángulo (θ)
        a_tangential = to_float(variables.get('a_t'))      # Aceleración tangencial (a_t)
        a_centripetal = to_float(variables.get('a_c'))     # Aceleración centrípeta (a_c)
        a_total = to_float(variables.get('a'))             # Aceleración total (a)
        time_var = to_float(variables.get('t'))            # Tiempo (t)
        vel = to_float(variables.get('v'))                 # Velocidad tangencial (v)
        
        # Rastrear qué variables fueron proporcionadas
        provided = {k: v for k, v in [
            ('r', radius), ('ω_i', omega_i), ('ω_f', omega_f), ('alpha', alpha_val),
            ('θ', theta_val), ('a_t', a_tangential), ('a_c', a_centripetal),
            ('a', a_total), ('t', time_var), ('v', vel)
        ] if v is not None or v == 0}
        
    elif exercise_type == 'TP':
        # Variables de TP - intentar diferentes claves posibles
        v_0 = to_float(variables.get('v_0')) or to_float(variables.get('v0'))  # Velocidad inicial
        theta_val = to_float(variables.get('θ'))           # Ángulo de lanzamiento (θ)
        if theta_val is None:  # Intenta con otras claves si no se encuentra
            theta_val = to_float(variables.get('theta'))  
        gravity = to_float(variables.get('g', 9.81))       # Aceleración gravitacional (g)
        x_pos = to_float(variables.get('x'))               # Posición horizontal (x)
        y_pos = to_float(variables.get('y'))               # Posición vertical (y)
        height = to_float(variables.get('H'))              # Altura máxima (H)
        range_val = to_float(variables.get('R'))           # Alcance horizontal (R)
        time_var = to_float(variables.get('t'))            # Tiempo de vuelo (t)
        v_0x = to_float(variables.get('v_0x')) or to_float(variables.get('v0x'))  # Componente x de v_0
        v_0y = to_float(variables.get('v_0y')) or to_float(variables.get('v0y'))  # Componente y de v_0
        
        # Log de todas las variables para depuración
        logging.debug(f"TP variables: v_0={v_0}, theta={theta_val}, g={gravity}, x={x_pos}, y={y_pos}, H={height}, R={range_val}, t={time_var}, v_0x={v_0x}, v_0y={v_0y}")
        
        # Rastrear qué variables fueron proporcionadas
        provided = {k: v for k, v in [
            ('v_0', v_0), ('θ', theta_val), ('g', gravity), ('x', x_pos),
            ('y', y_pos), ('H', height), ('R', range_val), ('t', time_var),
            ('v_0x', v_0x), ('v_0y', v_0y)
        ] if v is not None}
        
    elif exercise_type == 'MCG':
        # Variables de MCG
        vel = to_float(variables.get('v'))                 # Velocidad (v)
        a_tangential = to_float(variables.get('a_t'))      # Aceleración tangencial (a_t)
        a_centripetal = to_float(variables.get('a_c'))     # Aceleración normal (a_c)
        rho = to_float(variables.get('rho'))               # Radio de curvatura (ρ)
        a_total = to_float(variables.get('a'))             # Aceleración total (a)
        
        # Rastrear qué variables fueron proporcionadas
        provided = {k: v for k, v in [
            ('v', vel), ('a_t', a_tangential), ('a_c', a_centripetal),
            ('rho', rho), ('a', a_total)
        ] if v is not None}
        
    # Log de las variables proporcionadas para depuración
    logging.debug(f"Provided variables: {provided}")
    
    if len(provided) < 1:
        return "Datos insuficientes para calcular la solución. Por favor, proporcione al menos un dato.", solution_data
        
    try:
        # Movimiento Circular Uniforme (MCU)
        if exercise_type == 'MCU':
            if solve_for == 't':  # 🔹 TIEMPO
                if 'θ' in provided and 'ω' in provided:
                    # t = θ / ω
                    time_result = provided['θ'] / provided['ω']
                    solution_text = f"t = θ / ω = {provided['θ']:.4f} / {provided['ω']:.4f} = {time_result:.4f} s"
                    solution_data['t'] = time_result
                elif 'N' in provided and 'ω' in provided:
                    # t = 2πN / ω
                    time_result = 2 * sp.pi * provided['N'] / provided['ω']
                    solution_text = f"t = 2πN / ω = 2π · {provided['N']:.4f} / {provided['ω']:.4f} = {time_result:.4f} s"
                    solution_data['t'] = time_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el tiempo (t) en MCU, necesita proporcionar: (θ, ω) o (N, ω)"
            
            elif solve_for == 'ω':  # 🔹 VELOCIDAD ANGULAR
                if 'θ' in provided and 't' in provided:
                    # ω = θ / t
                    omega_result = provided['θ'] / provided['t']
                    solution_text = f"ω = θ / t = {provided['θ']:.4f} / {provided['t']:.4f} = {omega_result:.4f} rad/s"
                    solution_data['ω'] = omega_result
                elif 'f' in provided:
                    # ω = 2πf
                    omega_result = 2 * sp.pi * provided['f']
                    solution_text = f"ω = 2πf = 2π · {provided['f']:.4f} = {omega_result:.4f} rad/s"
                    solution_data['ω'] = omega_result
                elif 'T' in provided:
                    # ω = 2π / T
                    omega_result = 2 * sp.pi / provided['T']
                    solution_text = f"ω = 2π / T = 2π / {provided['T']:.4f} = {omega_result:.4f} rad/s"
                    solution_data['ω'] = omega_result
                elif 'N' in provided and 't' in provided:
                    # ω = 2πN / t
                    omega_result = 2 * sp.pi * provided['N'] / provided['t']
                    solution_text = f"ω = 2πN / t = 2π · {provided['N']:.4f} / {provided['t']:.4f} = {omega_result:.4f} rad/s"
                    solution_data['ω'] = omega_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la velocidad angular (ω) en MCU, necesita proporcionar: (θ, t), (f), (T), o (N, t)"
            
            elif solve_for == 'f':  # 🔹 FRECUENCIA
                if 'T' in provided:
                    # f = 1 / T
                    freq_result = 1 / provided['T']
                    solution_text = f"f = 1 / T = 1 / {provided['T']:.4f} = {freq_result:.4f} Hz"
                    solution_data['f'] = freq_result
                elif 'ω' in provided:
                    # f = ω / 2π
                    freq_result = provided['ω'] / (2 * sp.pi)
                    solution_text = f"f = ω / 2π = {provided['ω']:.4f} / 2π = {freq_result:.4f} Hz"
                    solution_data['f'] = freq_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la frecuencia (f) en MCU, necesita proporcionar: (T) o (ω)"
            
            elif solve_for == 'T':  # 🔹 PERÍODO
                if 'f' in provided:
                    # T = 1 / f
                    period_result = 1 / provided['f']
                    solution_text = f"T = 1 / f = 1 / {provided['f']:.4f} = {period_result:.4f} s"
                    solution_data['T'] = period_result
                elif 'ω' in provided:
                    # T = 2π / ω
                    period_result = 2 * sp.pi / provided['ω']
                    solution_text = f"T = 2π / ω = 2π / {provided['ω']:.4f} = {period_result:.4f} s"
                    solution_data['T'] = period_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el período (T) en MCU, necesita proporcionar: (f) o (ω)"
            
            elif solve_for == 'θ':  # 🔹 ÁNGULO
                if 'ω' in provided and 't' in provided:
                    # θ = ωt
                    theta_result = provided['ω'] * provided['t']
                    solution_text = f"θ = ωt = {provided['ω']:.4f} · {provided['t']:.4f} = {theta_result:.4f} rad"
                    solution_data['θ'] = theta_result
                elif 'N' in provided:
                    # θ = 2πN
                    theta_result = 2 * sp.pi * provided['N']
                    solution_text = f"θ = 2πN = 2π · {provided['N']:.4f} = {theta_result:.4f} rad"
                    solution_data['θ'] = theta_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el ángulo (θ) en MCU, necesita proporcionar: (ω, t) o (N)"
                    
            elif solve_for == 'v':  # 🔹 VELOCIDAD TANGENCIAL
                if 'ω' in provided and 'r' in provided:
                    # v = ωr
                    vel_result = provided['ω'] * provided['r']
                    solution_text = f"v = ωr = {provided['ω']:.4f} · {provided['r']:.4f} = {vel_result:.4f} m/s"
                    solution_data['v'] = vel_result
                elif 'r' in provided and 'T' in provided:
                    # v = 2πr / T
                    vel_result = 2 * sp.pi * provided['r'] / provided['T']
                    solution_text = f"v = 2πr / T = 2π · {provided['r']:.4f} / {provided['T']:.4f} = {vel_result:.4f} m/s"
                    solution_data['v'] = vel_result
                elif 'r' in provided and 'f' in provided:
                    # v = 2πrf
                    vel_result = 2 * sp.pi * provided['r'] * provided['f']
                    solution_text = f"v = 2πrf = 2π · {provided['r']:.4f} · {provided['f']:.4f} = {vel_result:.4f} m/s"
                    solution_data['v'] = vel_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la velocidad tangencial (v) en MCU, necesita proporcionar: (ω, r), (r, T), o (r, f)"
            
            elif solve_for == 'r':  # 🔹 RADIO
                if 'v' in provided and 'ω' in provided:
                    # r = v / ω
                    radius_result = provided['v'] / provided['ω']
                    solution_text = f"r = v / ω = {provided['v']:.4f} / {provided['ω']:.4f} = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                elif 'v' in provided and 'a_c' in provided:
                    # r = v² / a_c
                    radius_result = provided['v']**2 / provided['a_c']
                    solution_text = f"r = v² / a_c = {provided['v']:.4f}² / {provided['a_c']:.4f} = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                elif 'v' in provided and 'T' in provided:
                    # r = vT / 2π
                    radius_result = provided['v'] * provided['T'] / (2 * sp.pi)
                    solution_text = f"r = vT / 2π = {provided['v']:.4f} · {provided['T']:.4f} / 2π = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                elif 'v' in provided and 'f' in provided:
                    # r = v / 2πf
                    radius_result = provided['v'] / (2 * sp.pi * provided['f'])
                    solution_text = f"r = v / 2πf = {provided['v']:.4f} / (2π · {provided['f']:.4f}) = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                elif 'a_c' in provided and 'ω' in provided:
                    # r = a_c / ω²
                    radius_result = provided['a_c'] / (provided['ω']**2)
                    solution_text = f"r = a_c / ω² = {provided['a_c']:.4f} / {provided['ω']:.4f}² = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el radio (r) en MCU, necesita proporcionar: (v, ω), (v, a_c), (v, T), (v, f), o (a_c, ω)"
            
            elif solve_for == 'a_c':  # 🔹 ACELERACIÓN CENTRÍPETA
                if 'v' in provided and 'r' in provided:
                    # a_c = v² / r
                    a_c_result = provided['v']**2 / provided['r']
                    solution_text = f"a_c = v² / r = {provided['v']:.4f}² / {provided['r']:.4f} = {a_c_result:.4f} m/s²"
                    solution_data['a_c'] = a_c_result
                elif 'ω' in provided and 'r' in provided:
                    # a_c = ω²r
                    a_c_result = provided['ω']**2 * provided['r']
                    solution_text = f"a_c = ω²r = {provided['ω']:.4f}² · {provided['r']:.4f} = {a_c_result:.4f} m/s²"
                    solution_data['a_c'] = a_c_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración centrípeta (a_c) en MCU, necesita proporcionar: (v, r) o (ω, r)"
            
            elif solve_for == 'N':  # 🔹 NÚMERO DE VUELTAS
                if 'θ' in provided:
                    # N = θ / 2π
                    n_result = provided['θ'] / (2 * sp.pi)
                    solution_text = f"N = θ / 2π = {provided['θ']:.4f} / 2π = {n_result:.4f} vueltas"
                    solution_data['N'] = n_result
                elif 'ω' in provided and 't' in provided:
                    # N = ωt / 2π
                    n_result = provided['ω'] * provided['t'] / (2 * sp.pi)
                    solution_text = f"N = ωt / 2π = {provided['ω']:.4f} · {provided['t']:.4f} / 2π = {n_result:.4f} vueltas"
                    solution_data['N'] = n_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el número de vueltas (N) en MCU, necesita proporcionar: (θ) o (ω, t)"
        
        # Movimiento Circular No Uniforme (MCNU)
        elif exercise_type == 'MCNU':
            if solve_for == 't':  # 🔹 TIEMPO
                if 'ω_f' in provided and 'ω_i' in provided and 'alpha' in provided:
                    # t = (ω_f - ω_i) / α
                    time_result = (provided['ω_f'] - provided['ω_i']) / provided['alpha']
                    solution_text = f"t = (ω_f - ω_i) / α = ({provided['ω_f']:.4f} - {provided['ω_i']:.4f}) / {provided['alpha']:.4f} = {time_result:.4f} s"
                    solution_data['t'] = time_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el tiempo (t) en MCNU, necesita proporcionar: (ω_f, ω_i, α)"
            
            elif solve_for == 'alpha':  # 🔹 ACELERACIÓN ANGULAR
                if 'ω_f' in provided and 'ω_i' in provided and 't' in provided:
                    # α = (ω_f - ω_i) / t
                    alpha_result = (provided['ω_f'] - provided['ω_i']) / provided['t']
                    solution_text = f"α = (ω_f - ω_i) / t = ({provided['ω_f']:.4f} - {provided['ω_i']:.4f}) / {provided['t']:.4f} = {alpha_result:.4f} rad/s²"
                    solution_data['alpha'] = alpha_result
                elif 'θ' in provided and 'ω_i' in provided and 't' in provided:
                    # α = (θ - ω_i·t) * 2 / t²
                    alpha_result = (provided['θ'] - provided['ω_i'] * provided['t']) * 2 / (provided['t']**2)
                    solution_text = f"α = (θ - ω_i·t) * 2 / t² = ({provided['θ']:.4f} - {provided['ω_i']:.4f}·{provided['t']:.4f}) * 2 / {provided['t']:.4f}² = {alpha_result:.4f} rad/s²"
                    solution_data['alpha'] = alpha_result
                elif 'ω_f' in provided and 'ω_i' in provided and 'θ' in provided:
                    # α = (ω_f² - ω_i²) / (2θ)
                    alpha_result = (provided['ω_f']**2 - provided['ω_i']**2) / (2 * provided['θ'])
                    solution_text = f"α = (ω_f² - ω_i²) / (2θ) = ({provided['ω_f']:.4f}² - {provided['ω_i']:.4f}²) / (2 · {provided['θ']:.4f}) = {alpha_result:.4f} rad/s²"
                    solution_data['alpha'] = alpha_result
                elif 'a_t' in provided and 'r' in provided:
                    # α = a_t / r
                    alpha_result = provided['a_t'] / provided['r']
                    solution_text = f"α = a_t / r = {provided['a_t']:.4f} / {provided['r']:.4f} = {alpha_result:.4f} rad/s²"
                    solution_data['alpha'] = alpha_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración angular (α) en MCNU, necesita proporcionar: (ω_f, ω_i, t), (θ, ω_i, t), (ω_f, ω_i, θ), o (a_t, r)"
            
            elif solve_for == 'ω_f':  # 🔹 VELOCIDAD ANGULAR FINAL
                if 'ω_i' in provided and 'alpha' in provided and 't' in provided:
                    # ω_f = ω_i + αt
                    omega_f_result = provided['ω_i'] + provided['alpha'] * provided['t']
                    solution_text = f"ω_f = ω_i + αt = {provided['ω_i']:.4f} + {provided['alpha']:.4f}·{provided['t']:.4f} = {omega_f_result:.4f} rad/s"
                    solution_data['ω_f'] = omega_f_result
                elif 'ω_i' in provided and 'alpha' in provided and 'θ' in provided:
                    # ω_f² = ω_i² + 2αθ
                    omega_f_result = sp.sqrt(provided['ω_i']**2 + 2 * provided['alpha'] * provided['θ'])
                    solution_text = f"ω_f = √(ω_i² + 2αθ) = √({provided['ω_i']:.4f}² + 2·{provided['alpha']:.4f}·{provided['θ']:.4f}) = {omega_f_result:.4f} rad/s"
                    solution_data['ω_f'] = omega_f_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la velocidad angular final (ω_f) en MCNU, necesita proporcionar: (ω_i, α, t) o (ω_i, α, θ)"
            
            elif solve_for == 'ω_i':  # 🔹 VELOCIDAD ANGULAR INICIAL
                if 'ω_f' in provided and 'alpha' in provided and 't' in provided:
                    # ω_i = ω_f - αt
                    omega_i_result = provided['ω_f'] - provided['alpha'] * provided['t']
                    solution_text = f"ω_i = ω_f - αt = {provided['ω_f']:.4f} - {provided['alpha']:.4f}·{provided['t']:.4f} = {omega_i_result:.4f} rad/s"
                    solution_data['ω_i'] = omega_i_result
                elif 'ω_f' in provided and 'alpha' in provided and 'θ' in provided:
                    # ω_i² = ω_f² - 2αθ
                    omega_i_result = sp.sqrt(provided['ω_f']**2 - 2 * provided['alpha'] * provided['θ'])
                    solution_text = f"ω_i = √(ω_f² - 2αθ) = √({provided['ω_f']:.4f}² - 2·{provided['alpha']:.4f}·{provided['θ']:.4f}) = {omega_i_result:.4f} rad/s"
                    solution_data['ω_i'] = omega_i_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la velocidad angular inicial (ω_i) en MCNU, necesita proporcionar: (ω_f, α, t) o (ω_f, α, θ)"
            
            elif solve_for == 'θ':  # 🔹 ÁNGULO
                if 'ω_i' in provided and 'alpha' in provided and 't' in provided:
                    # θ = ω_i t + ½ α t²
                    theta_result = provided['ω_i'] * provided['t'] + 0.5 * provided['alpha'] * (provided['t']**2)
                    solution_text = f"θ = ω_i·t + ½·α·t² = {provided['ω_i']:.4f}·{provided['t']:.4f} + 0.5·{provided['alpha']:.4f}·{provided['t']:.4f}² = {theta_result:.4f} rad"
                    solution_data['θ'] = theta_result
                elif 'ω_f' in provided and 'ω_i' in provided and 'alpha' in provided:
                    # θ = (ω_f² - ω_i²) / (2α)
                    theta_result = (provided['ω_f']**2 - provided['ω_i']**2) / (2 * provided['alpha'])
                    solution_text = f"θ = (ω_f² - ω_i²) / (2α) = ({provided['ω_f']:.4f}² - {provided['ω_i']:.4f}²) / (2·{provided['alpha']:.4f}) = {theta_result:.4f} rad"
                    solution_data['θ'] = theta_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el ángulo (θ) en MCNU, necesita proporcionar: (ω_i, α, t) o (ω_f, ω_i, α)"
            
            elif solve_for == 'a_t':  # 🔹 ACELERACIÓN TANGENCIAL
                if 'alpha' in provided and 'r' in provided:
                    # a_t = αr
                    a_t_result = provided['alpha'] * provided['r']
                    solution_text = f"a_t = αr = {provided['alpha']:.4f}·{provided['r']:.4f} = {a_t_result:.4f} m/s²"
                    solution_data['a_t'] = a_t_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración tangencial (a_t) en MCNU, necesita proporcionar: (α, r)"
            
            elif solve_for == 'a_c':  # 🔹 ACELERACIÓN CENTRÍPETA
                if 'ω_f' in provided and 'r' in provided:
                    # a_c = ω²r
                    a_c_result = provided['ω_f']**2 * provided['r']
                    solution_text = f"a_c = ω²r = {provided['ω_f']:.4f}²·{provided['r']:.4f} = {a_c_result:.4f} m/s²"
                    solution_data['a_c'] = a_c_result
                elif 'v' in provided and 'r' in provided:
                    # a_c = v² / r
                    a_c_result = provided['v']**2 / provided['r']
                    solution_text = f"a_c = v² / r = {provided['v']:.4f}² / {provided['r']:.4f} = {a_c_result:.4f} m/s²"
                    solution_data['a_c'] = a_c_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración centrípeta (a_c) en MCNU, necesita proporcionar: (ω, r) o (v, r)"
            
            elif solve_for == 'a':  # 🔹 ACELERACIÓN TOTAL
                if 'a_t' in provided and 'a_c' in provided:
                    # a = √(a_t² + a_c²)
                    a_result = sp.sqrt(provided['a_t']**2 + provided['a_c']**2)
                    solution_text = f"a = √(a_t² + a_c²) = √({provided['a_t']:.4f}² + {provided['a_c']:.4f}²) = {a_result:.4f} m/s²"
                    solution_data['a'] = a_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración total (a) en MCNU, necesita proporcionar: (a_t, a_c)"
                    
            elif solve_for == 'r':  # 🔹 RADIO
                if 'v' in provided and 'a_c' in provided:
                    # r = v² / a_c
                    radius_result = provided['v']**2 / provided['a_c']
                    solution_text = f"r = v² / a_c = {provided['v']:.4f}² / {provided['a_c']:.4f} = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                elif 'a_t' in provided and 'alpha' in provided:
                    # r = a_t / α
                    radius_result = provided['a_t'] / provided['alpha']
                    solution_text = f"r = a_t / α = {provided['a_t']:.4f} / {provided['alpha']:.4f} = {radius_result:.4f} m"
                    solution_data['r'] = radius_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el radio (r) en MCNU, necesita proporcionar: (v, a_c) o (a_t, α)"
            
        # Movimiento Parabólico (TP)
        elif exercise_type == 'TP':
            if solve_for == 't':  # 🔹 TIEMPO DE VUELO
                if 'v_0' in provided and 'θ' in provided and 'g' in provided:
                    # Caso especial para ángulo 0 (movimiento horizontal)
                    if abs(provided['θ']) < 1e-6:  # Prácticamente 0
                        if 'R' in provided:
                            time_result = provided['R'] / provided['v_0']
                            solution_text = f"t = R / v₀ = {provided['R']:.4f} / {provided['v_0']:.4f} = {time_result:.4f} s (caso especial: trayectoria horizontal)"
                            solution_data['t'] = time_result
                        else:
                            solution_text = "Para ángulo 0° (horizontal), se necesita el alcance (R) para calcular el tiempo de vuelo."
                    else:
                        # t = (2 v₀ sinθ) / g
                        time_result = (2 * provided['v_0'] * sp.sin(provided['θ'])) / provided['g']
                        solution_text = f"t = (2 v₀ sinθ) / g = (2 · {provided['v_0']:.4f} · sin({provided['θ']:.4f})) / {provided['g']:.4f} = {time_result:.4f} s"
                        solution_data['t'] = time_result
                elif 'x' in provided and 'v_0x' in provided:
                    # t = x / v₀ₓ
                    time_result = provided['x'] / provided['v_0x']
                    solution_text = f"t = x / v₀ₓ = {provided['x']:.4f} / {provided['v_0x']:.4f} = {time_result:.4f} s"
                    solution_data['t'] = time_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el tiempo de vuelo (t) en tiro parabólico, necesita proporcionar: (v_0, θ, g) o (x, v_0x)"
            
            elif solve_for == 'v_0':  # 🔹 VELOCIDAD INICIAL
                if 'v_0x' in provided and 'v_0y' in provided:
                    # v₀ = √(v₀ₓ² + v₀ᵧ²)
                    v0_result = sp.sqrt(provided['v_0x']**2 + provided['v_0y']**2)
                    solution_text = f"v₀ = √(v₀ₓ² + v₀ᵧ²) = √({provided['v_0x']:.4f}² + {provided['v_0y']:.4f}²) = {v0_result:.4f} m/s"
                    solution_data['v_0'] = v0_result
                elif 'R' in provided and 'θ' in provided and 'g' in provided:
                    # v₀ = √(Rg / sin(2θ))
                    v0_result = sp.sqrt(provided['R'] * provided['g'] / sp.sin(2 * provided['θ']))
                    solution_text = f"v₀ = √(Rg / sin(2θ)) = √({provided['R']:.4f} · {provided['g']:.4f} / sin(2 · {provided['θ']:.4f})) = {v0_result:.4f} m/s"
                    solution_data['v_0'] = v0_result
                elif 'H' in provided and 'θ' in provided and 'g' in provided:
                    # v₀ = √(2gH / sin²θ)
                    v0_result = sp.sqrt(2 * provided['g'] * provided['H'] / (sp.sin(provided['θ'])**2))
                    solution_text = f"v₀ = √(2gH / sin²θ) = √(2 · {provided['g']:.4f} · {provided['H']:.4f} / sin²({provided['θ']:.4f})) = {v0_result:.4f} m/s"
                    solution_data['v_0'] = v0_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la velocidad inicial (v_0) en tiro parabólico, necesita proporcionar: (v_0x, v_0y), (R, θ, g), o (H, θ, g)"
                    
            elif solve_for == 'v_0x':  # 🔹 COMPONENTE HORIZONTAL DE VELOCIDAD INICIAL
                if 'v_0' in provided and 'θ' in provided:
                    # v₀ₓ = v₀ cos(θ)
                    v0x_result = provided['v_0'] * sp.cos(provided['θ'])
                    solution_text = f"v₀ₓ = v₀ cos(θ) = {provided['v_0']:.4f} · cos({provided['θ']:.4f}) = {v0x_result:.4f} m/s"
                    solution_data['v_0x'] = v0x_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la componente horizontal de la velocidad inicial (v_0x) en tiro parabólico, necesita proporcionar: (v_0, θ)"
                    
            elif solve_for == 'v_0y':  # 🔹 COMPONENTE VERTICAL DE VELOCIDAD INICIAL
                if 'v_0' in provided and 'θ' in provided:
                    # v₀ᵧ = v₀ sin(θ)
                    v0y_result = provided['v_0'] * sp.sin(provided['θ'])
                    solution_text = f"v₀ᵧ = v₀ sin(θ) = {provided['v_0']:.4f} · sin({provided['θ']:.4f}) = {v0y_result:.4f} m/s"
                    solution_data['v_0y'] = v0y_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la componente vertical de la velocidad inicial (v_0y) en tiro parabólico, necesita proporcionar: (v_0, θ)"
                    
            elif solve_for == 'θ':  # 🔹 ÁNGULO DE LANZAMIENTO
                if 'v_0x' in provided and 'v_0y' in provided:
                    # θ = arctan(v₀ᵧ / v₀ₓ)
                    theta_result = sp.atan(provided['v_0y'] / provided['v_0x'])
                    solution_text = f"θ = arctan(v₀ᵧ / v₀ₓ) = arctan({provided['v_0y']:.4f} / {provided['v_0x']:.4f}) = {theta_result:.4f} rad"
                    solution_data['θ'] = theta_result
                elif 'R' in provided and 'H' in provided and 'g' in provided:
                    # θ = arctan(4H / R)
                    theta_result = sp.atan(4 * provided['H'] / provided['R'])
                    solution_text = f"θ = arctan(4H / R) = arctan(4 · {provided['H']:.4f} / {provided['R']:.4f}) = {theta_result:.4f} rad"
                    solution_data['θ'] = theta_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el ángulo de lanzamiento (θ) en tiro parabólico, necesita proporcionar: (v_0x, v_0y) o (R, H, g)"
                    
            elif solve_for == 'H':  # 🔹 ALTURA MÁXIMA
                if 'v_0' in provided and 'θ' in provided and 'g' in provided:
                    # H = (v₀² sin²θ) / (2g)
                    height_result = (provided['v_0']**2 * (sp.sin(provided['θ'])**2)) / (2 * provided['g'])
                    solution_text = f"H = (v₀² sin²θ) / (2g) = ({provided['v_0']:.4f}² · sin²({provided['θ']:.4f})) / (2 · {provided['g']:.4f}) = {height_result:.4f} m"
                    solution_data['H'] = height_result
                elif 'v_0y' in provided and 'g' in provided:
                    # H = v₀ᵧ² / (2g)
                    height_result = provided['v_0y']**2 / (2 * provided['g'])
                    solution_text = f"H = v₀ᵧ² / (2g) = {provided['v_0y']:.4f}² / (2 · {provided['g']:.4f}) = {height_result:.4f} m"
                    solution_data['H'] = height_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la altura máxima (H) en tiro parabólico, necesita proporcionar: (v_0, θ, g) o (v_0y, g)"
                    
            elif solve_for == 'R':  # 🔹 ALCANCE HORIZONTAL
                if 'v_0' in provided and 'θ' in provided and 'g' in provided:
                    # R = (v₀² sin(2θ)) / g
                    range_result = (provided['v_0']**2 * sp.sin(2 * provided['θ'])) / provided['g']
                    solution_text = f"R = (v₀² sin(2θ)) / g = ({provided['v_0']:.4f}² · sin(2 · {provided['θ']:.4f})) / {provided['g']:.4f} = {range_result:.4f} m"
                    solution_data['R'] = range_result
                elif 'v_0x' in provided and 't' in provided:
                    # R = v₀ₓ · t
                    range_result = provided['v_0x'] * provided['t']
                    solution_text = f"R = v₀ₓ · t = {provided['v_0x']:.4f} · {provided['t']:.4f} = {range_result:.4f} m"
                    solution_data['R'] = range_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el alcance horizontal (R) en tiro parabólico, necesita proporcionar: (v_0, θ, g) o (v_0x, t)"
                    
            elif solve_for == 'g':  # 🔹 ACELERACIÓN GRAVITACIONAL
                if 'v_0' in provided and 'θ' in provided and 'R' in provided:
                    # g = (v₀² sin(2θ)) / R
                    g_result = (provided['v_0']**2 * sp.sin(2 * provided['θ'])) / provided['R']
                    solution_text = f"g = (v₀² sin(2θ)) / R = ({provided['v_0']:.4f}² · sin(2 · {provided['θ']:.4f})) / {provided['R']:.4f} = {g_result:.4f} m/s²"
                    solution_data['g'] = g_result
                elif 'v_0' in provided and 'θ' in provided and 'H' in provided:
                    # g = (v₀² sin²θ) / (2H)
                    g_result = (provided['v_0']**2 * (sp.sin(provided['θ'])**2)) / (2 * provided['H'])
                    solution_text = f"g = (v₀² sin²θ) / (2H) = ({provided['v_0']:.4f}² · sin²({provided['θ']:.4f})) / (2 · {provided['H']:.4f}) = {g_result:.4f} m/s²"
                    solution_data['g'] = g_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración gravitacional (g) en tiro parabólico, necesita proporcionar: (v_0, θ, R) o (v_0, θ, H)"
        
        # Movimiento Curvilíneo General (MCG)
        elif exercise_type == 'MCG':
            if solve_for == 'v':  # 🔹 VELOCIDAD
                if 'a_c' in provided and 'rho' in provided:
                    # v = √(a_c * ρ)
                    vel_result = sp.sqrt(provided['a_c'] * provided['rho'])
                    solution_text = f"v = √(a_c · ρ) = √({provided['a_c']:.4f} · {provided['rho']:.4f}) = {vel_result:.4f} m/s"
                    solution_data['v'] = vel_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la velocidad (v) en MCG, necesita proporcionar: (a_c, ρ)"
                    
            elif solve_for == 'a_c':  # 🔹 ACELERACIÓN NORMAL/CENTRÍPETA
                if 'v' in provided and 'rho' in provided:
                    # a_c = v² / ρ
                    a_c_result = provided['v']**2 / provided['rho']
                    solution_text = f"a_c = v² / ρ = {provided['v']:.4f}² / {provided['rho']:.4f} = {a_c_result:.4f} m/s²"
                    solution_data['a_c'] = a_c_result
                elif 'a' in provided and 'a_t' in provided and provided['a'] > provided['a_t']:
                    # a_c = √(a² - a_t²)
                    a_c_result = sp.sqrt(provided['a']**2 - provided['a_t']**2)
                    solution_text = f"a_c = √(a² - a_t²) = √({provided['a']:.4f}² - {provided['a_t']:.4f}²) = {a_c_result:.4f} m/s²"
                    solution_data['a_c'] = a_c_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración normal (a_c) en MCG, necesita proporcionar: (v, ρ) o (a, a_t)"
                    
            elif solve_for == 'rho':  # 🔹 RADIO DE CURVATURA
                if 'v' in provided and 'a_c' in provided:
                    # ρ = v² / a_c
                    rho_result = provided['v']**2 / provided['a_c']
                    solution_text = f"ρ = v² / a_c = {provided['v']:.4f}² / {provided['a_c']:.4f} = {rho_result:.4f} m"
                    solution_data['rho'] = rho_result
                else:
                    solution_text = "Datos insuficientes. Para calcular el radio de curvatura (ρ) en MCG, necesita proporcionar: (v, a_c)"
                    
            elif solve_for == 'a_t':  # 🔹 ACELERACIÓN TANGENCIAL
                if 'a' in provided and 'a_c' in provided and provided['a'] > provided['a_c']:
                    # a_t = √(a² - a_c²)
                    a_t_result = sp.sqrt(provided['a']**2 - provided['a_c']**2)
                    solution_text = f"a_t = √(a² - a_c²) = √({provided['a']:.4f}² - {provided['a_c']:.4f}²) = {a_t_result:.4f} m/s²"
                    solution_data['a_t'] = a_t_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración tangencial (a_t) en MCG, necesita proporcionar: (a, a_c)"
                    
            elif solve_for == 'a':  # 🔹 ACELERACIÓN TOTAL
                if 'a_t' in provided and 'a_c' in provided:
                    # a = √(a_t² + a_c²)
                    a_result = sp.sqrt(provided['a_t']**2 + provided['a_c']**2)
                    solution_text = f"a = √(a_t² + a_c²) = √({provided['a_t']:.4f}² + {provided['a_c']:.4f}²) = {a_result:.4f} m/s²"
                    solution_data['a'] = a_result
                else:
                    solution_text = "Datos insuficientes. Para calcular la aceleración total (a) en MCG, necesita proporcionar: (a_t, a_c)"
        
        else:
            solution_text = f"Tipo de ejercicio no reconocido: {exercise_type}"
            
    except Exception as e:
        logging.error(f"Error al calcular la solución: {str(e)}")
        solution_text = f"Error al calcular la solución: {str(e)}"
    
    return solution_text, solution_data