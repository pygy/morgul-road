define(function () { 'use strict';

  // The Mithril router extracted to work standalone.
  // as a commonJS module.
  // the effector must be a function that accepts a DOM node
  // (insertion point) and a component, like Mithril;s `m.mount`

  // This was done by modifying the code as little as possible
  // but the result will need a bit more polish to become universally
  // useful...

  // The MIT License (MIT)

  // Copyright (c) 2014 Leo Horie

  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:

  // The above copyright notice and this permission notice shall be included in all
  // copies or substantial portions of the Software.

  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.

  var type = {}.toString

  function isObject(object) {
    return type.call(object) === '[object Object]'
  }

  function isString(object) {
    return type.call(object) === '[object String]'
  }

  var isArray = Array.isArray || function (object) {
    return type.call(object) === '[object Array]'
  }

  function noop() {}

  var hasOwn = {}.hasOwnProperty

  function forEach(list, f) {
    for (var i = 0; i < list.length && !f(list[i], i++);) {
          // function called in condition
    }
  }
  // routing
  function makeRouter(effector) {
    var modes = {pathname: '', hash: '#', search: '?'}
    var redirect = noop
    var isDefaultRoute = false
    var routeParams, currentRoute

      function route(root, arg1, arg2, vdom) { // eslint-disable-line
          // route()
        if (arguments.length === 0) return currentRoute
          // route(el, defaultRoute, routes)
        if (arguments.length === 3 && isString(arg1)) {
          redirect = function (source) {
            var path = currentRoute = normalizeRoute(source)
            if (!routeByValue(root, arg2, path)) {
              if (isDefaultRoute) {
                throw new Error('Ensure the default route matches ' +
                              'one of the routes defined in route')
              }

              isDefaultRoute = true
              route(arg1, true)
              isDefaultRoute = false
            }
          }

          var listener = route.mode === 'hash' ?
                  'onhashchange' :
                  'onpopstate'

          window[listener] = function () {
            var path = location[route.mode]
            if (route.mode === 'pathname') path += location.search
            if (currentRoute !== normalizeRoute(path)) redirect(path)
          }

          effector.computePreRedrawHook = setScroll
          window[listener]()

          return
        }


          // config: route
        if (root.addEventListener || root.attachEvent) {
          var base = route.mode !== 'pathname' ? location.pathname : ''
          root.href = base + modes[route.mode] + vdom.attrs.href
          if (root.addEventListener) {
            root.removeEventListener('click', routeUnobtrusive)
            root.addEventListener('click', routeUnobtrusive)
          } else {
            root.detachEvent('onclick', routeUnobtrusive)
            root.attachEvent('onclick', routeUnobtrusive)
          }

          return
        }

          // route(route, params, shouldReplaceHistoryEntry)
        if (isString(root)) {
          var oldRoute = currentRoute
          currentRoute = root

          var args = arg1 || {}
          var queryIndex = currentRoute.indexOf('?')
          var params

          if (queryIndex > -1) {
            params = parseQueryString(currentRoute.slice(queryIndex + 1))
          } else {
            params = {}
          }

          for (var i in args) if (hasOwn.call(args, i)) {
            params[i] = args[i]
          }

          var querystring = buildQueryString(params)
          var currentPath

          if (queryIndex > -1) {
            currentPath = currentRoute.slice(0, queryIndex)
          } else {
            currentPath = currentRoute
          }

          if (querystring) {
            currentRoute = currentPath +
                      (currentPath.indexOf('?') === -1 ? '?' : '&') +
                      querystring
          }

          var replaceHistory =
                  (arguments.length === 3 ? arg2 : arg1) === true ||
                  oldRoute === root

          if (window.history.pushState) {
            var method = replaceHistory ? 'replaceState' : 'pushState'
            effector.computePreRedrawHook = setScroll
            effector.computePostRedrawHook = function () {
              window.history[method](null, document.title,
                          modes[route.mode] + currentRoute)
            }
            redirect(modes[route.mode] + currentRoute)
          } else {
            location[route.mode] = currentRoute
            redirect(modes[route.mode] + currentRoute)
          }
        }
      }

    route.param = function (key) {
      if (!routeParams) {
        throw new Error('You must call route(element, defaultRoute, ' +
                  'routes) before calling route.param()')
      }

      if (!key) {
        return routeParams
      }

      return routeParams[key]
    }

    route.mode = 'search'

    function normalizeRoute(route) {
      return route.slice(modes[route.mode].length)
    }

    function routeByValue(root, router, path) {
      routeParams = {}

      var queryStart = path.indexOf('?')
      if (queryStart !== -1) {
        routeParams = parseQueryString(
                  path.substr(queryStart + 1, path.length))
        path = path.substr(0, queryStart)
      }

          // Get all routes and check if there's
          // an exact match for the current path
      var keys = Object.keys(router)
      var index = keys.indexOf(path)

      if (index !== -1){
        effector(root, router[keys [index]])
        return true
      }

      for (var route in router) if (hasOwn.call(router, route)) {
        if (route === path) {
          effector(root, router[route])
          return true
        }

        var matcher = new RegExp('^' + route
                  .replace(/:[^\/]+?\.{3}/g, '(.*?)')
                  .replace(/:[^\/]+/g, '([^\\/]+)') + '\/?$')

        if (matcher.test(path)) {
                  /* eslint-disable no-loop-func */
          path.replace(matcher, function () {
            var keys = route.match(/:[^\/]+/g) || []
            var values = [].slice.call(arguments, 1, -2)
            forEach(keys, function (key, i) {
              routeParams[key.replace(/:|\./g, '')] =
                              decodeURIComponent(values[i])
            })
            effector(root, router[route])
          })
                  /* eslint-enable no-loop-func */
          return true
        }
      }
    }

    function setScroll() {
      if (route.mode !== 'hash' && location.hash) {
        location.hash = location.hash
      } else {
        window.scrollTo(0, 0)
      }
    }

    function buildQueryString(object, prefix) {
      var duplicates = {}
      var str = []

      for (var prop in object) if (hasOwn.call(object, prop)) {
        var key = prefix ? prefix + '[' + prop + ']' : prop
        var value = object[prop]

        if (value === null) {
          str.push(encodeURIComponent(key))
        } else if (isObject(value)) {
          str.push(buildQueryString(value, key))
        } else if (isArray(value)) {
          var keys = []
          duplicates[key] = duplicates[key] || {}
                  /* eslint-disable no-loop-func */
          forEach(value, function (item) {
                      /* eslint-enable no-loop-func */
            if (!duplicates[key][item]) {
              duplicates[key][item] = true
              keys.push(encodeURIComponent(key) + '=' +
                              encodeURIComponent(item))
            }
          })
          str.push(keys.join('&'))
        } else if (value !== undefined) {
          str.push(encodeURIComponent(key) + '=' +
                      encodeURIComponent(value))
        }
      }
      return str.join('&')
    }

    function parseQueryString(str) {
      if (str === '' || str == null) return {}
      if (str.charAt(0) === '?') str = str.slice(1)

      var pairs = str.split('&')
      var params = {}

      forEach(pairs, function (string) {
        var pair = string.split('=')
        var key = decodeURIComponent(pair[0])
        var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
        if (params[key] != null) {
          if (!isArray(params[key])) params[key] = [params[key]]
          params[key].push(value)
        }
        else params[key] = value
      })

      return params
    }

    function routeUnobtrusive(e) {
      e = e || event
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return

      if (e.preventDefault) {
        e.preventDefault()
      } else {
        e.returnValue = false
      }

      var currentTarget = e.currentTarget || e.srcElement
      var args

      if (route.mode === 'pathname' && currentTarget.search) {
        args = parseQueryString(currentTarget.search.slice(1))
      } else {
        args = {}
      }

      while (currentTarget && !/a/i.test(currentTarget.nodeName)) {
        currentTarget = currentTarget.parentNode
      }

          // clear pendingRequests because we want an immediate route change
      route(currentTarget[route.mode]
              .slice(modes[route.mode].length), args)
    }

    route.buildQueryString = buildQueryString
    route.parseQueryString = parseQueryString
    return route
  }

  return makeRouter;

});