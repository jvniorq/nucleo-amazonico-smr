# Núcleo Amazónico — Simulador SMR 3D

Experiencia web interactiva que explora, de forma conceptual, cómo un reactor modular pequeño (SMR) podría convertir calor nuclear en energía eléctrica para una red aislada como Iquitos.

## Enlace público

La simulación se publica con GitHub Pages en:

https://jvniorq.github.io/nucleo-amazonico-smr/

## Experiencia

- Recorrido 3D por reactor, turbina, enfriamiento, subestación e Iquitos.
- Flujo energético animado y cámara con movimiento amortiguado.
- Selección directa de componentes y panel de métricas.
- Modos de iluminación diurno y nocturno.
- Diseño adaptable para escritorio y dispositivos móviles.

## Alcance

La visualización es educativa. Los parámetros mostrados son ilustrativos y no constituyen un diseño de ingeniería, una evaluación de emplazamiento ni la aprobación de un proyecto real.

El contexto normativo corresponde a la Ley N.º 32560 del Perú, promulgada en marzo de 2026. La ley establece un marco de promoción y evaluación para generación nuclear y SMR; cualquier proyecto concreto requiere estudios de viabilidad, seguridad, impacto ambiental y participación ciudadana.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Producción

El proyecto se compila automáticamente con GitHub Actions y se publica mediante GitHub Pages.

Tecnologías: Three.js, Vite, JavaScript y CSS.
