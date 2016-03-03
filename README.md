# Pouter

Yet another javascript router. Minimalistic, universal, and framework agnostic.

[![npm version](https://badge.fury.io/js/pouter.svg)](https://badge.fury.io/js/pouter)

Pouter provides an elegant way to respond to route changes on both the server and the client. On the client, Pouter relies on and is intended to be used in conjunction with [history](https://github.com/reactjs/history).

Pouter itself is a very small amount of code, and its only dependency is [path-parser](https://github.com/troch/path-parser), which is also very small with no dependencies. The intended usage with history does add a little more size.

  * [Basic Usage](#basic-usage)
  * [Reasoning](#reasoning)
  * [History and Navigation](#history-and-navigation)
  * [Detailed Usage](#detailed-usage)
  * [Putting it Together](#putting-it-together)
  * [Example Project](#example-project)



## Basic Usage

```javascript
/** Universal bits **/
import { Router } from 'pouter';
const router = new Router();

router.use('/', done => done({page: 'home'}));
router.use('/posts', done => done({page: 'posts'}));
router.use('/foo', done => done({redirect: '/bar'}));
router.use('/oops', done => done({error: 'error here'}));

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



## History and Navigation

Client side routing is accomplished through the [history](https://github.com/reactjs/history) library. Pouter aims with work _with_ history, rather than abstracting it, so it should be included as a separate dependency. Since Pouter relies on history to listen for route changes, all client-side navigation should be [handled through history](https://github.com/reactjs/history/blob/master/docs/GettingStarted.md#navigation).

```javascript
// To minimize the build, only import the implementation you need, for most:
import createHistory from 'history/lib/createBrowserHistory';

// To navigate:
history.push('/home');
history.replace('/profile');
```



## Detailed Usage

### Instantiating a Router

```javascript
import { Router } from 'pouter';
const router = new Router();
```

### Defining Routes

```javascript
router.use('/posts', routeHandlerA);
router.use('/posts/asdf', routeHandlerB); // note this is placed first or else it would be matched to /posts/:postId
router.use('/posts/:postId', routeHandlerC);

```
Path strings are parsed and matched by library [path-parser](https://github.com/troch/path-parser). Note that only the path (not the query) will be matched, meaning that both URLs `'/foo'` and `'/foo?b=ar'` will be matched to route `'/foo'`. 

### Route Handlers

```javascript
function routeHandlerA(done, location, context, preRouted) {
  // arbitrary data can be passed back, wich will be available in the onRouteFinish callback
  done({some: 'arbitrary data'});
};

function routeHandlerB(done, location, context, preRouted) {
  // `redirect` is a reserved key to indicate that a redirect should happen
  done({redirect: '/somewhere/else'});
};

function routeHandlerC(done, location, context, preRouted) {
  // `error` is a reserved key to indicate an error occured while handling route
  done({error: 'error object here'});
};

function routeHandlerD(done, location, {store}, preRouted) {
  // don't need to fetch data on client if the server already did
  if (preRouted) return done();
  //
  const postId = location.params.postId;
  store.dispatch(fetchPost(postId)).promise
    .then(() => done())
    .catch(error => done({error}));
};
```
  * Each route handler is passed 4 arguments: `done`, `location`, `context`, and `preRouted`.
  * Each handler must call `done` once and only once.
  * `preRouted` is true only for the first route on client and is a convenient way to know that the server already handled the route.
  * `location` and `context` covered below.

### Location

```javascript
// for route '/posts/:postId'
// at URL '/posts/abc?foo=bar'
// location will be:
{
  url: '/posts/abc?foo=bar',
  path: '/posts/abc',
  queryString: 'foo=bar',
  query: {
    foo: 'bar'
  },
  params: {
    postId: 'abc'
  }
}
```
The location object is sent to both route handlers and the onRouteFinish callback.

### Context

```javascript
// use `setContext()` to set a "context" object on the router
router.setContext({foo: 'bar'});
// and it will be passed to each route handler as the third argument
router.use('/', (done, location, context) {
  context.foo; // bar
})
```

### Routing

```javascript
// on the server
// routes just the given URL
router.route(url, onRouteFinish);

// on the client
// listens for location changes and routes each one
router.startRouting(history, onRouteFinish);
```
For both methods, Pouter finds the first route that matches the current location and invokes the corresponding route handler. Once the route handler is finished, the onRouteFinish callback is invoked.

### Route Finish Callback

```javascript
// server side
app.get('*', (req, res, next) => {
  router.route(req.url, (location, data, redirect, error) => {

    // when error is present, pass on to error handler
    if (error) {
      next(error);
    }

    // when redirect is present, perform a redirect
    else if (redirect) {
      res.redirect(redirect);
    }

    // when data is present, 200 ok
    else if (data) {
      res.send(data);
    }

    // when none of those are present, the route does not exist
    else {
      next();
    }
    
  });
});
```
The second argument to both `route()` and `startRouting()` is an onRouteFinish callback. It is invoked _after_ the route handler, and is passed 4 arguments: `location`, `data`, `redirect`, and `error`. `location` will always be present. Only one of `data`, `redirect`, or `error` will be present at a time, and this indicates the outcome of the route change. `data` will contain the object passed into `done()` by the route handler (unless there is an error or redirect).



## Putting it Together

##### /app/router.js
```javascript
import { Router } from 'pouter';
import * as posts from './route-handlers/posts';

export default function buildRouter(store) {
  const router = new Router();
  router.setContext({store}); // a redux store, for example
  router.use('/posts', posts.index);
  router.use('/posts/:postId', posts.show);
  return router;
};
```

##### /app/route-handlers/posts.js
```javascript
export function index(done, location, {store}) {
  // in RL: dispatch action to fetch data; update store before calling done()
  fetchPosts()
    .then(() => done({page: 'posts-index'}))
    .catch(error => done({error}));
};
export function show(done, {params: {postId}}, {store}) {
  fetchPost(postId)
    .then(() => done({page: 'post-show'}))
    .catch(error => done({error}));
};
```

##### /app/history.js
```javascript
// makes the history a singleton for the app... will need it in React components to navigate
import createHistory from 'history/lib/createBrowserHistory';
export default const history = __IS_CLIENT__ ? createHistory() : null;
```

##### /server/index.js
```javascript
import express from 'express';
import buildRouter from '../app/router';
import buildStore from '../app/store';

const app = express();

app.use('*', (req, res, next) => {
  const store = buildStore();
  const router = buildRouter(store);
  // delegate to pouter
  router.route(req.url, (location, data, redirect, error) => {
    if (error) return next(error);
    if (redirect) return res.redir
    if (data) {
      // update store with data.page
      // render the view/component
    }
    next(); // not found
  });
});
```

##### /client/index.js
```javascript
import buildStore from '../app/store';
import buildRouter from '../app/router';
import history from '../app/history';

const store = buildStore();
const router = buildRouter(store);

router.startRouting(history, (location, data, redirect, error) => {
  if (error) return console.error(error);
  if (redirect) return history.replace(redirect);
  if (data) {
    // update store with data.page
  } else {
    console.error('Route not found.');
  }
});
// render view/component
```



## Example Project

For a reference implementation check out [this repo](https://github.com/tybro0103/redux-universal-boilerplate). Particularly files:

  * [app/router.js](https://github.com/tybro0103/redux-universal-boilerplate/blob/master/app/router.js)
  * [app/route-handlers/*](https://github.com/tybro0103/redux-universal-boilerplate/tree/master/app/route-handlers)
  * [app/history](https://github.com/tybro0103/redux-universal-boilerplate/blob/master/app/history.js)
  * [app/components/routing/*](https://github.com/tybro0103/redux-universal-boilerplate/tree/master/app/components/common/routing)
  * [client/index.js](https://github.com/tybro0103/redux-universal-boilerplate/blob/master/client/index.js)
  * [server/app-router.js](https://github.com/tybro0103/redux-universal-boilerplate/blob/master/server/app-router.js)
