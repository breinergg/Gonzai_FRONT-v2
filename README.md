# Gonzai Frontend

Panel de administración web para **Gonzai**, un sistema de gestión empresarial orientado a negocios que venden productos y administran clientes con cuentas corrientes, deudas e inventario. Esta aplicación es la capa de presentación del proyecto: consume una API REST externa y ofrece una interfaz moderna para las operaciones del día a día.

## Características

- **Autenticación segura** con JWT y rutas protegidas por guard.
- **Dashboard** con indicadores de ventas mensuales, clientes activos, productos activos y deudas pendientes.
- **Gestión de productos** con categorías, precios de compra/venta y control de stock.
- **Gestión de clientes** con registro, edición y consulta de saldos.
- **Inventario** con movimientos de entrada y salida de productos.
- **Movimientos de clientes** para registrar y consultar deudas y pagos.
- **Ventas diarias** con registro, filtros por fecha y resumen mensual.
- **Layout responsive** con barra lateral colapsable y navegación centralizada.

## Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | [Angular](https://angular.dev/) 19 |
| Lenguaje | TypeScript 5.7 |
| Reactividad | RxJS 7.8 |
| Arquitectura | Standalone Components |
| Estilos | CSS por componente |
| Tipografía | Poppins & Montserrat (Google Fonts) |
| Testing | Karma + Jasmine |

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- [npm](https://www.npmjs.com/) 9 o superior
- [Angular CLI](https://angular.dev/tools/cli) 19
- API backend de Gonzai en ejecución (puerto `5057` en desarrollo)

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd Gonzai_FRONT-master

# Instalar dependencias
npm install
```

## Desarrollo

Asegúrate de que el backend esté corriendo en `http://localhost:5057` antes de iniciar el frontend.

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en [http://localhost:4200](http://localhost:4200). Los cambios en el código se recargan automáticamente.

### Configuración de la API

La URL del backend se define en los archivos de entorno:

| Entorno | Archivo | URL |
|---------|---------|-----|
| Desarrollo | `src/environments/environment.ts` | `http://localhost:5057/api` |
| Producción | `src/environments/environment.prod.ts` | `/api` |

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run watch` | Compila en modo desarrollo con recarga automática |
| `npm test` | Ejecuta las pruebas unitarias |

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Protección de rutas (authGuard)
│   │   ├── interceptors/    # Inyección del token JWT en peticiones HTTP
│   │   ├── models/          # Interfaces y tipos TypeScript
│   │   └── services/        # Servicios de comunicación con la API
│   ├── pages/
│   │   ├── login/           # Inicio de sesión
│   │   ├── dashboard/       # Panel principal
│   │   ├── products/        # Catálogo de productos
│   │   ├── clients/         # Gestión de clientes
│   │   ├── inventory/       # Movimientos de inventario
│   │   ├── client-movements/# Historial financiero de clientes
│   │   └── sales/           # Ventas diarias
│   ├── shared/
│   │   └── layout/          # Shell con sidebar y topbar
│   ├── app.routes.ts        # Definición de rutas
│   └── app.config.ts        # Configuración de la aplicación
├── environments/            # Variables de entorno
└── styles.css               # Estilos globales
```

## Integración con la API

El frontend se comunica con el backend mediante `HttpClient`. Los principales endpoints consumidos son:

| Recurso | Endpoint |
|---------|----------|
| Usuarios | `/api/usuario` |
| Productos | `/api/producto` |
| Categorías | `/api/categoria` |
| Clientes | `/api/cliente` |
| Movimientos de cliente | `/api/movimientocliente` |
| Movimientos de inventario | `/api/movimientoinventario` |
| Ventas diarias | `/api/ventadiaria` |

## Autenticación

1. El usuario inicia sesión en `/login` con email y contraseña.
2. El backend devuelve un token JWT y los datos del usuario.
3. El token se almacena en `sessionStorage` y se adjunta automáticamente a cada petición HTTP mediante el interceptor `authInterceptor`.
4. Las rutas internas están protegidas por `authGuard`, que redirige a `/login` si no hay sesión válida.

## Licencia

Proyecto privado. Todos los derechos reservados.
