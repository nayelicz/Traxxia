# Traccia — Stellar BAF MVP

Explorador de cinco inmuebles **ficticios** con análisis trazable, reserva de prueba por Freighter y contrato Soroban para registro, oráculo y compra con token de pago. No representa títulos de propiedad ni constituye avalúo, oferta o asesoría financiera.

## Ejecutar la demo

Requiere Node.js 20+. Copia `.env.example` a `.env`; configura `GEMINI_API_KEY` únicamente en el servidor si quieres usar Gemini. Sin esa clave, la API devuelve un análisis ilustrativo marcado como `demo`. Nunca pongas la clave en una variable `VITE_`.

```bash
npm install
npm run server
# en otra terminal
npm run dev
```

Abre `http://localhost:5173`. La API utiliza Google Search grounding cuando hay clave, conserva los títulos y URLs devueltos por la API y calcula un SHA-256 del registro JSON. El hash se muestra al usuario; **no se publica automáticamente en Stellar**. El prompt prohíbe inventar datos para inmuebles sin ubicación real, limita la confianza y mantiene explícita la incertidumbre.

## Soroban Testnet

Requiere Rust, target `wasm32v1-none` y Stellar CLI. El contrato usa `soroban-sdk` 22; instala una CLI compatible y compila con `stellar contract build --manifest-path contracts/property_registry/Cargo.toml`. Despliega con `stellar contract deploy --wasm ... --network testnet --source <admin>`. Inicializa `initialize(admin,oracle,payment_token)` con las direcciones reales de cuentas y el contrato de un activo de **prueba**. Da de alta cada lote con `list(id,seller,price)`; tanto admin como vendedor autorizan. `price` se expresa en unidades mínimas del token elegido, no MXN. Configura `VITE_CONTRACT_ID` con el ID desplegado y reinicia Vite.

`reserve(id,buyer)` exige autorización de la wallet y marca el lote. La interfaz prepara la invocación, pide firma a Freighter y espera el recibo. `publish(id,hash,score,confidence)` exige autorización del oráculo, y `purchase(id,buyer)` exige una valoración reciente (24 h), score ≥80 y confianza ≥75; transfiere el token de prueba al vendedor y cambia el dueño **del registro digital**. La publicación del oráculo y la compra todavía se operan desde CLI; no hay servicio firmante ni botón de compra. La reserva no bloquea fondos, no caduca y no impide que el administrador de este prototipo controle otros listados. No uses fondos reales.

## Integración pendiente para una demo completa

1. Definir inmueble real/autorizado, jurisdicción, identificador documental y fuentes fiables de comparables.
2. Establecer reglas de valoración reproducibles y un servicio oráculo autenticado que publique el hash y la puntuación de la evaluación al contrato. Añadir política de actualización y manejo de disputas.
3. Configurar activo de Testnet, cuentas, saldo y parámetros de precio en unidades mínimas; comprobar el contrato con la versión de Stellar CLI elegida.
4. Añadir la vista de compra, verificación on-chain del estado y recibo, más un mecanismo jurídico externo si se pretende transmitir derechos sobre inmuebles.

## Estructura

- `src/`: UI y firma de reservas.
- `server/`: análisis Gemini opcional y SHA-256 del resultado.
- `contracts/property_registry/`: contrato Soroban en Rust.

## Seguridad y alcance

Los datos locales de estado sirven solo para reflejar inmediatamente la reserva en esta demo; recargar desde otro dispositivo no muestra ese estado. Para producción, leer el estado del contrato y usar almacenamiento persistente para metadatos. El resultado de Gemini se calcula fuera de cadena y **no es una fuente objetiva ni libre de sesgos**. El score ilustrativo inicial no habilita automáticamente `purchase`. No se transmite la propiedad legal mediante este software.


## Presentación y pitch

- [Presentación PowerPoint de siete diapositivas](docs/Traccia-Presentacion.pptx)
- [Pitch de tres minutos con tiempos por diapositiva](docs/Traccia-Pitch-03-minutos.md)
- [Guion en texto](docs/Traccia-Pitch-03-minutos.txt)

El PowerPoint incluye el guion en las notas del orador. Duración objetivo: 03:00, aproximadamente 377 palabras a 126 palabras por minuto. La presentación distingue el prototipo disponible de las integraciones pendientes en Testnet.
