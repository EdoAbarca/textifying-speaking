# Textifying Speaking

## Advertencia

Esta aplicación aún está en proceso.

## Descripción

*Textifying Speaking* es una aplicación web que automatiza la transcripción de archivos de audio y video, y ofrece la opción de generar resúmenes de las transcripciones obtenidas. Esta herramienta es ideal para estudiantes, profesionales y cualquier persona que necesite convertir contenido multimedia en texto y obtener resúmenes de estos.

## Características distintivas

- **Soporte multilingüe:** Si bien la aplicación está diseñada para manejar archivos en español e inglés, es capaz de soportar sobre 40 idiomas, ofreciendo una amplia cobertura para usuarios globales.
- **Transcripción:** Utiliza el modelo `whisper-v3-large` para ofrecer transcripciones precisas y rápidas.
- **Resúmenes:** Utiliza el modelo `mT5_multilingual_XLSum` para generar resúmenes concisos.
- **Confidencialidad de la información:** Los modelos mencionados son llamados desde *Hugging Face* mediante *Inference API*, por lo que no se auto-entrenan con la información que procesan.
- **Información adicional que, de corresponder, será presentada**

## Tecnologías utilizadas

- **Frontend:**
  - Vite (React.js, JavaScript + SWC)
  - Tailwind CSS

- **Backend:**
  - Nest.js (Mongoose)
  - MongoDB
  - Django

## Instalación y configuración (Generado con IA, próximamente será actualizado)

### Prerrequisitos

- Node.js
- npm o yarn
- Docker (opcional, para contenedores)

### Instrucciones de instalación

1. Clonar el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/textifying-speaking.git
    cd textifying-speaking
    ```

2. Instalar las dependencias del frontend:
    ```bash
    cd frontend
    npm install
    ```

3. Instalar las dependencias del backend:
    ```bash
    cd backend
    npm install
    ```

4. Configurar las variables de entorno:
    - Crear un archivo `.env` en la raíz del proyecto y añadir las variables necesarias para MongoDB, Nest.js, y Django.

5. Iniciar la aplicación:
    ```bash
    # Iniciar frontend
    cd frontend
    npm run dev

    # Iniciar backend
    cd backend
    npm run start:dev
    ```

6. (Opcional) Usar Docker para entorno de desarrollo:
    ```bash
    docker-compose up --build
    ```


## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para discutir cualquier cambio que sea necesario realizar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Para más detalles, consulta el archivo [LICENSE](./LICENSE).
