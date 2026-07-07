# Arquitectura visual — BTMM DantaGame1

## Objetivo

Separar la apariencia del motor monolítico actual para poder rediseñar cada elemento sin poner en riesgo las mecánicas del juego.

## Estructura

```text
assets/
  css/
    theme-kawaii.css
  js/
    visual-config.js
    visual-system.js
    art/
      mama-danta.js
      [futuros renderizadores]
docs/
  VISUAL_ARCHITECTURE.md
  VISUAL_ROADMAP.md
```

## Sistema de renderizadores

`visual-system.js` crea el registro global `BTMMVisual`.

Los renderizadores se registran por nombre:

```js
BTMMVisual.register("tapir.adult", renderer);
BTMMVisual.register("tapir.calf", renderer);
BTMMVisual.register("plant.aguacatillo", renderer);
```

El sistema conserva el renderizador original y lo usa cuando no existe un sustituto registrado. Esto permite cambiar un elemento a la vez.

## Reglas

1. Un archivo por familia visual.
2. No cambiar hitboxes desde los renderizadores.
3. Tamaño visual y tamaño de colisión deben mantenerse independientes.
4. Cada nuevo elemento debe tener estados mínimos: normal, alerta, interacción y noche cuando corresponda.
5. Mantener contraste suficiente para pantallas pequeñas.
6. Toda animación debe respetar `prefers-reduced-motion`.

## Flujo para añadir un elemento

1. Crear el archivo en `assets/js/art/`.
2. Registrar el renderizador con un nombre único.
3. Activarlo en `visual-config.js`.
4. Añadirlo a la lista de recursos del `sw.js`.
5. Incrementar `RELEASE_ID`.
6. Probar en teléfono y escritorio.

## Estado actual

- Tema general kawaii: activo.
- Mamá danta: rediseñada.
- Crías: renderizador original.
- Vegetación: renderizador original.
- Vehículos: renderizador original.
- Cazadores: renderizador original.
- Entorno: renderizador original.
