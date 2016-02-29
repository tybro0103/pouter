# Pouter

Yet another javascript router. Minimalistic, universal, and framework agnostic.



## Basic Usage

```javascript
/** Unverisal bits **/
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
import createHistory from 'history/lib/createBrowserHistory';
const history = createHistory();

router.startRouting(history, (location, data, redirect, error) => {
  if (error) return console.error(error);
  if (redirect) return history.replace(redirect);
  if (data) return console.log(`navigated to ${data.page}`);
  console.error('Route not found.'); // not found
});

```

