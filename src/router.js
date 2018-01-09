import Path from 'path-parser';

import { parseUrl } from './utils';



export default class Router {

  constructor() {
    this._routes = [];
    this._context = {};
    this._latestRouteFinishCb = null;
  }



  /*
   *  PRIVATE HELPERS
   */

  _match(path) {
    const matchPredicate = route => route.pattern.match(path, true);
    return this._routes.filter(matchPredicate)[0];
  };

  _buildLocation(url, pattern) {
    const {path, query, queryString} = parseUrl(url);
    const params = pattern ? pattern.match(path, true) : {};
    return {
      url,
      path,
      params,
      query,
      queryString
    };
  }



  /*
   *  PRIVATE EVENTS
   */

  _handleDone(routeFinishCb, data={}) {
    // ignore if not the latest
    const isLatest = routeFinishCb === this._latestRouteFinishCb;
    if (!isLatest) return;
    //
    if (data.error) return routeFinishCb(null, null, data.error);
    if (data.redirect) return routeFinishCb(null, data.redirect, null);
    routeFinishCb(data, null, null);
  }



  /*
   *  PUBLIC API
   */

  setContext(context) {
    this._context = context;
  }

  use(pattern, handler) {
    this._routes.push({
      pattern: new Path(pattern),
      handler
    });
  }

  startRouting(history, routeFinishCb) {
    let preRouted = true; // convenience on the client to know this route was already handled by server
    history.listen(location => {
      const url = `${location.pathname}${location.search}`
      this.route(url, routeFinishCb, preRouted);
      preRouted = false;
    });
    // immediately invoke if on client - was done by history in previous versions
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}${window.location.search}`;
      this.route(url, routeFinishCb, preRouted);
      preRouted = false;
    }
  }

  route(url, routeFinishCb=()=>{}, preRouted=false) {
    // find corresponding route
    const path = parseUrl(url).path;
    const route = this._match(path);
    const location = this._buildLocation(url, route && route.pattern);
    // first arg to finishCallback will always be location, regardless of outcome
    routeFinishCb = routeFinishCb.bind(this, location);
    // update reference to latestRouteFinishCb for later
    this._latestRouteFinishCb = routeFinishCb;
    // when no route found, invoke callback without any args (no args indicates not found)
    if (!route) return routeFinishCb(null, null, null);
    // invoke the route
    const done = this._handleDone.bind(this, routeFinishCb);
    const context = this._context;
    route.handler(done, location, context, preRouted);
  }

};
