# Danta: Cruce del Bosque

Juego HTML listo para publicar con GitHub Pages.

## Archivos principales

- `index.html`: entrada principal que GitHub Pages servira automaticamente.
- `manifest.json`: metadatos PWA con rutas relativas.
- `sw.js`: cache basico para que el juego cargue rapido y pueda funcionar offline despues de abrirlo una vez.
- `icon.svg`: icono del sitio.
- `.nojekyll`: evita procesamiento de Jekyll en GitHub Pages.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de esta carpeta a la raiz del repositorio.
3. En GitHub, abre `Settings` > `Pages`.
4. En `Build and deployment`, selecciona `Deploy from a branch`.
5. Usa la rama `main` y la carpeta `/root`, luego guarda.

La pagina quedara disponible en:

```text
https://TU_USUARIO.github.io/TU_REPOSITORIO/
```

Tambien puedes subirlo con Git:

```powershell
git init
git add index.html manifest.json sw.js icon.svg .nojekyll README.md
git commit -m "Publicar juego Danta"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```
