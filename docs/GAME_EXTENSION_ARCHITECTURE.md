# Arquitectura para ampliar mecánicas

`assets/js/game-extension-system.js` crea un registro global para añadir futuras funciones sin mezclar su configuración con el motor principal.

## Registro básico

```js
BTMMGameExtensions.register("road-signs", {
  description: "Señalización vial educativa",
  start() {
    // Inicializar el módulo.
  },
  stop() {
    // Detener o limpiar el módulo.
  }
});
```

## Estructura prevista

```text
assets/js/features/
  road-signs.js
  fauna-crossing-restoration.js
  knowledge-cards.js
  seed-dispersal.js
```

Cada mecánica nueva debe mantenerse en su propio archivo y registrarse con un nombre único.

## Separación de responsabilidades

- `assets/js/art/`: apariencia y animación.
- `assets/js/features/`: reglas y mecánicas nuevas.
- `assets/css/`: interfaz y tema.
- `visual-config.js`: activación y paleta.
- `game-extension-system.js`: registro y ciclo de vida de extensiones.

## Migración futura

El registro es una transición segura. Cuando el proyecto crezca, el contenido monolítico de `index.html` deberá dividirse formalmente en motor, entidades, niveles, renderizado, interfaz, audio y persistencia.
