# Pouter

Yet another javascript router. Minimalistic, universal, and framework agnostic.

[![npm version](https://badge.fury.io/js/pouter.svg)](https://badge.fury.io/js/pouter)

Pouter provides an elegant way to respond to route changes on both the server and the client. On the client, Pouter relies on and is intended to be used in conjunction with [history](https://github.com/reactjs/history).

Pouter itself is a very small amount of code, and its only dependency is [path-parser](https://github.com/troch/path-parser), which is also very small with no dependencies. The instended usage with history does add a little more size.



## Basic Usage

```javascript
/** Universal bits **/
import { Router } from 'pouter';
const router = new Router();

router.use('/', done => done.ok({page: 'home'}));
router.use('/posts', done => done.ok({page: 'posts'}));
router.use('/foo', done => done.redirect('/bar'));
router.use('/oops', done => done.error({some: 'error'}));

/** On the server **/
app.get('*', (req, res, next) => {
  router.route(req.url, (location, data, redirect, error) => {
    if (error) return next(error);
    if (redirect) return res.redirect(redirect);
    if (data) return res.send({page: data.page});
    next(); // 404 not found
  });
});

/** On the client **/
import { createHistory } from 'history';
const history = createHistory();

router.startRouting(history, (location, data, redirect, error) => {
  if (error) return console.error(error);
  if (redirect) return history.replace(redirect);
  if (data) return console.log(`navigated to ${data.page}`);
  console.error('Route not found.'); // not found
});

```



## Reasoning

Pouter takes the stance that a router is responsible for handling route changes&#42;. Handling a route change can mean more than just changing the view or changing the application’s state. Although both of those things **should indeed** happen, there are also side effects to be considered. Some things to need happen before the new view is rendered - fetch data, check permissions, authorize, etc. But perhaps most importantly, there are times it will determined that the view should not be rendered, but instead a redirect should occur.

To handle all this, each route is directed to a function, or “route handler”, to execute any arbitrary code you need it to. This is not so different from backbone router (or many other “old school” routers), except that the route handler is expected to indicate its outcome as one of: ok, error, or redirect. This enables Pouter to have a `routeFinish` callback where both the client and the server can have a place to actually perform a redirect, render a view, or handle an error ...after any side effects are triggered by the route handler. 

This stance is different than other popular routers which aim to automatically marry the route to a view or to the application’s state. Such approaches make the mentioned side effects at least very awkward, if not a poor separation of concerns. It puts all of the responsibility on the view itself. The view has to fetch its own data, check if itself is allowed to be viewed by the current user, and perform any redirects that might need to occur. Although this is possible and good architecture could allow it feel manageable, it seems as though there has a long been a place that is meant to handle these very concerns - the router.

&#42;or just respond to a single route when speaking server-side.



## Detailed Usage

### Instantiating a Router

```javascript
import { Router } from 'pouter';
const router = new Router();
```

### Defining Routes

  * `use(path, handler)` expects a path as a string and a handler function which will be invoked whenever the given path is encountered.
  * Path strings are parsed and matched by library [path-parser](https://github.com/troch/path-parser).
  * Note that only the path (not the query) will be matched, meaning that both URLs `'/foo'` and `'/foo?b=ar'` will be matched to route `'/foo'`. 

```javascript
router.use('/posts', routeHandlerA);
router.use('/posts/asdf', routeHandlerB); // note this is placed first or else it would be matched to /posts/:postId
router.use('/posts/:postId', routeHandlerC);

```

### History

  * Client side routing is accomplished through the [history](https://github.com/reactjs/history) library.
  * Pouter aims with work _with_ history, rather than abstracting it, so it should be included as a separate dependency.
  * Since Pouter relies on history to listen for route changes, all client-side route changes will need to be triggered by history.
  * To minimize the build, only import the implementation you need, for most:

```javascript
import createHistory from 'history/lib/createBrowserHistory'
```



