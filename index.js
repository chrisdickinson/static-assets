var tty = require('tty')
  , nopt = require('nopt')
  , path = require('path')
  , fs = require('fs')
  , spawn = require('child_process').spawn
  , glob = require('glob')
  , mkdirp = require('mkdirp')
  , resolve = require('resolve')
  , cpr = require('cpr').cpr
  , cwd = process.cwd()
  , options
  , shorthand
  , cpropts

module.exports = run
module.exports.cli = cli

options = {
    'package': path
  , 'output': path
  , 'help': Boolean
  , 'quiet': Boolean
}

shorthand = {
    'h': ['--help']
  , 'p': ['--package']
  , 'o': ['--output']
  , 'q': ['--quiet']
}

cpropts = {
    'deleteFirst': false
  , 'overwrite': true
  , 'confirm': false
}

function help() {
/*
static-assets [--package=path/to/package.json] [--output=path/to/output/dir]

  Pull static assets from multiple installed node modules into a single
  "asset" directory. 

  if no output option is defined, output will be written to stdout.

  arguments:

    --help, -h                  this help message.

    --output path, -o path      output assets into this directory. defaults
                                to `./assets/`.

    --package path, -p path     read "useAssets" from this JSON file. defaults
                                to `./package.json`.

    --quiet, -q                 disable non-error output
*/

  var str = help+''

  process.stdout.write(str.slice(str.indexOf('/*')+3, str.indexOf('*/')))
}

function cli() {
  var parsed = nopt(options, shorthand)

  if(parsed.help) {
    return help(), process.exit(1)
  }

  run(parsed.package, parsed.output, parsed.quiet ? Function() : output, function(err) {
    if(err) {
      console.error(err)
      return process.exit(1)
    }
  })

  function output(what) {
    console.log(what)
  }
}

function run(package_json, output, log, ready) {
  var parsed = nopt(options, shorthand)

  var package_json = parsed.package || 'package.json'
    , output = parsed.output || 'assets'
    , packages 
    , data
    , dirs

  if(package_json.charAt(0) !== '/') {
    package_json = path.resolve(path.join(cwd, package_json))
  } 
  
  if(output.charAt(0) !== '/') {
    output = path.resolve(path.join(cwd, output))
  } 

  cwd = path.dirname(package_json)

  data = JSON.parse(fs.readFileSync(package_json)).useAssets || {}
  dirs = Object.keys(data)

  fs.mkdir(output, iter_dirs)

  function iter_dirs() { 
    if(!dirs.length) {
      return
    }

    log('visiting ', dirs[0])
    packages = Object.keys(data[dirs[0]])

    mkdirp(path.join(output, dirs[0]), function(err) {
      iter_packages()
    })    
  }

  function iter_packages() {
    if(!packages.length) {
      dirs.shift()
      return iter_dirs()
    }

    var package_dir = get_package_dir(resolve.sync(packages[0], {basedir: cwd}))
      , glob_dir = path.join(package_dir, data[dirs[0]][packages[0]])
      , dest_dir = path.join(output, dirs[0])
      , waiting

    glob(glob_dir, function(err, files) {
      if(err) {
        return errored(err)
      }

      files
        .filter(function(x) { return x.replace(path.join(cwd, 'node_modules'), '.').indexOf('node_modules') === -1 })
        .forEach(do_copy)
    }) 

    function do_copy(filename, idx, files) {
      var target = path.join(dest_dir, path.basename(filename))

      waiting = files.length

      log('cp -r '+filename.replace(cwd, '.')+' '+dest_dir.replace(cwd, '.'))

      fs.stat(filename, function(err, stat) {
        if(stat.isDirectory()) {
          return cpr(filename, dest_dir, done)
        }
        fs.createReadStream(filename)
          .pipe(fs.createWriteStream(target))
          .on('close', done) 
      })

      function done(err, files) {
        if(!--waiting) {
          packages.shift()
          iter_packages()
        }
      }
    }
  }

  function errored(err) {
    return ready(err)
  }
}

function get_package_dir(p) {
  p = p.split(path.sep)
  while(p.length > 2 && p[p.length - 2] !== 'node_modules') {
    p.pop()
  }
  p[0] = path.resolve('/')
  return path.join.apply(path, p)
}
