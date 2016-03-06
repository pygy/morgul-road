# morgul-road

The mithril router extracted for standalone use.

**CAVEAT: This adaptation hasn't been tested at all (I didn't even try to run it). It may very well be broken (or just work as advertised, who knows).**

Usage:

```JS
import makeRouter from 'morgul-road';

// a basic router that swaps DOM nodes

const route = makeRouter(function updater(root, node) {
    
    // remove this if you don't want the page to scroll up on route change
    if (updater.preRedraw) updater.preRedraw();

    if(root.firstChild) {
        root.replaceChild(node, root.firstChild);
    } else {
        root.appendChild(node);
    }

    // this is mandatory to push or replace the history state.
    if (updater.postRedraw) updater.postRedraw();

})
```

main = document.createElement('h1')
main.innerHTML = 'Hello'

route(document.body, '/', {
    '/' : main //, ...
})
```

The `route` function has the same (polymorphic) signature as [m.route](http://mithril.js.org/mithril.route.html).

