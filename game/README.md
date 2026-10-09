# Shelf Catch

A small Unity game that plays on the Ledge website. Catch falling screenshots on the ledge and dodge the red desktop clutter.

Everything (camera, sprites, sounds and UI) is created from code in `Assets/Scripts/ShelfCatch.cs`, so the project has no art assets.

## Build

Open the folder with Unity 6.3 LTS and Web Build Support, or build from the command line:

```sh
Unity -batchmode -quit -projectPath game -buildTarget WebGL \
  -executeMethod WebGLBuilder.Build -outputPath /tmp/shelf-catch
```

Copy `/tmp/shelf-catch/Build/*` into `site/public/game/Build/`. The site loads it from `site/public/game/index.html`.
