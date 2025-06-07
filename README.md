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
- Flask
- HTML5 / CSS3
- JavaScript (módulos: `calculations.js`, `visualizations.js`, `utils.js`)

## *Estructura del proyecto*

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

## *Instalación local*

1. Clona este repositorio:

```bash
git clone https://github.com/tu-usuario/CurviPath.git
cd CurviPath
# Crea un entorno virtual (opcional pero recomendado)
python -m venv env
source env/bin/activate  # En Windows: env\\Scripts\\activate
# Instala las dependencias
pip install flask
# Ejecuta la aplicación
python main.py
