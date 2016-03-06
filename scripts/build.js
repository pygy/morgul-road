#! /usr/bin/env node

/*eslint-env node*/
/*eslint no-console: 0*/

var fs = require('fs'),
  rollup = require('rollup'),
  uglify = require('uglify-js'),
  zlib = require('zlib'),
  outputs = [
    {
      rollupOptions:{
        format: 'iife',
        moduleName: 'morgulRoad'
      },
      name: 'global',
      minify: {saveGzip:true}
    },
    {
      rollupOptions:{
        format: 'cjs'
      },
      name: 'commonjs',
      minify: {save:true}
    },
    {
      rollupOptions:{
        format: 'amd',
        name: 'morgul-road'
      },
      name: 'amd',
      minify: {save:true}
    }
  ]

var parsed = rollup.rollup({
  entry: 'index.es6.js'
})


outputs.forEach(function (output) {
  parsed.then(function(bundle){
    var result = bundle.generate(output.rollupOptions)
    fs.writeFileSync('dist/morgul-road.' + output.name + '.js', result.code)
    if (output.minify) {
      var minified = uglify.minify(result.code, {
        fromString: true,
        mangle: true,
        compress: {}
      }).code
      fs.writeFileSync('dist/morgul-road.' + output.name + '.min.js', minified)
      zlib.gzip(minified, function(_, buf){
        console.log(output.name, _ || buf.length)
        if (output.minify.saveGzip) {
          fs.writeFileSync('dist/morgul-road.' + output.name + '.min.js.gz', buf)
        }
      })
    }
  }).then(null, function (e) {
    console.log(output.name, e)
    process.exit(1)
  })
})
