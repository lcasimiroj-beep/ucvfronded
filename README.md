# UCV Laboratorio Web

Aplicación web para pacientes y administración de citas de laboratorio.

## Requisitos
- Node.js 20+
- API backend ejecutándose en `http://localhost:4000`

## Instalación
```bash
npm install
cp .env.example .env
npm run dev
```

Configura `VITE_API_URL` en `.env` si la API usa otra dirección.

## Funciones iniciales
- Registro e inicio de sesión.
- Consulta de análisis disponibles.
- Solicitud y consulta de citas.
- Cancelación de citas propias.
- Vista de administración para listar citas y actualizar estados (requiere usuario ADMIN).
