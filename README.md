# *CurviPath*

**CurviPath** es una aplicación web interactiva desarrollada en Python que permite visualizar y calcular trayectorias curvas mediante herramientas gráficas y matemáticas. Ideal para fines educativos, científicos o experimentales.

## *Características*

- Visualización de trayectorias curvas personalizadas
- Cálculos interactivos con funciones matemáticas
- Interfaz moderna basada en HTML, CSS y JavaScript
- Backend en Python con soporte para lógica avanzada
- Organización modular de scripts y utilidades

## *Tecnologías utilizadas*

- Python
- HTML5 / CSS3
- JavaScript (módulos: `calculations.js`, `visualizations.js`, `utils.js`)

## *Estructura del proyecto*

```
CurviPath/
├── app.py
├── main.py
├── templates/
│ └── index.html
├── static/
│ ├── css/
│ │ └── modern-styles.css
│ └── js/
│ ├── calculations.js
│ ├── main.js
│ ├── utils.js
│ └── visualizations.js
```

## *Instalación local*

1. Clona este repositorio:

```bash
git clone https://github.com/DEdgamer1123/CurviPath.git
cd CurviPath
```

2. Crea un entorno virtual (opcional pero recomendado):

```bash
python -m venv env
source env/bin/activate  # En Windows: env\\Scripts\\activate
```

3. Instala las dependencias

```bash
pip install flask numpy sympy
```

4. Ejecuta la aplicación

```bash
python main.py
```
