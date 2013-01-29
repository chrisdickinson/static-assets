# static-assets

CLI tool for bundling static assets from NPM (think textures, audio for voxeljs, but could
potentially be used for creating CSS bundles too, I guess). Makes assets published on
NPM suitable for publishing on a CDN.

```bash
$ npm install -g static-assets
...
$ cat package.json
...
"dependencies": { "painterly-textures": "0.0.X", "garys-sweet-textures": "0.0.12" },
"useAssets": {
  "outputDirOne": { "painterly-textures": "**/*.png", "garys-sweet-textures": "lib/overwrite.png" },
  "outputDirTwo": { "garys-sweet-textures": "apocrypha/*.png" }
}
...
$ static-assets --package package.json --output assets
...
$ tree assets

assets/
├── outputDirOne
|   ├── brick.png
|   ├── grass.png
|   ├── things.png
|   └── overwrite.png
└── outputDirTwo
    ├── lovecraft.png
    ├── gary_busey.png
    └── derp.png

```

The syntax it expects is `{"destination": {"module-name": "file_or_glob"} }`, where for every file
it finds, it will do the equivalent of `cp -r node_modules/module-name/found_file destination/`. 

Later modules in the object may overwrite previous output from previous modules.

## usage

### static-assets [--package, -p path/to/package.json] [--output path/to/assets]

If `--package` is not given, it is assumed to be `./package.json`. It uses [resolve](substack/resolve) to find
the modules listed in `useAssets`.

## License

MIT
