import chai, { expect } from 'chai';
chai.should();

import Router from '../src/router';



describe('Router', function() {

  beforeEach(function() {
    this.router = new Router();
  });



  describe('contructor', function() {
    it('sets correct defaults', function() {
      this.router._routes.should.eql([]);
      this.router._context.should.eql({});
    });
  });



  describe('private instance methods', function() {

    describe('_match', function() {
      it('provides the first route matching the given url', function() {
        this.router.use('/foo', function() {return 'a';});
        this.router.use('/bar/:asdf', function() {return 'b';});
        this.router.use('/bar/nog', function() {return 'c';});
        const path = '/bar/nog';
        const route = this.router._match(path);
        route.handler().should.equal('b');
      });
    });

    describe('_buildLocation', function() {
      it('provides the correct parts for a given URL and pattern', function() {
        const url = '/queso/dip?corona=true&lime=true';
        const pattern = {match: function(path) {
          if (path === '/queso/dip') return {type: 'dip'};
        }};
        const location = this.router._buildLocation(url, pattern);
        location.should.eql({
          url: '/queso/dip?corona=true&lime=true',
          path: '/queso/dip',
          params: {type: 'dip'},
          query: {corona: 'true', lime: 'true'},
          queryString: 'corona=true&lime=true'
        });
      });
      it('provides the correct parts for a given URL without pattern', function() {
        const url = '/queso/dip?corona=true&lime=true';
        const location = this.router._buildLocation(url);
        location.should.eql({
          url: '/queso/dip?corona=true&lime=true',
          path: '/queso/dip',
          params: {},
          query: {corona: 'true', lime: 'true'},
          queryString: 'corona=true&lime=true'
        });
      });
    });

    describe('_handleDone', function() {
      it('invokes callback with error when error key is present', function(done) {
        const cb = function(data, redirect, error) {
          expect(data).to.equal(null);
          expect(redirect).to.equal(null);
          expect(error).to.equal('asdf');
          done();
        };
        this.router._latestRouteFinishCb = cb;
        this.router._handleDone(cb, {error: 'asdf', foo: 'bar'});
      });
      it('invokes callback with redirect when redirect key is present', function(done) {
        const cb = function(data, redirect, error) {
          expect(data).to.equal(null);
          expect(redirect).to.equal('/burritoville');
          expect(error).to.equal(null);
          done();
        };
        this.router._latestRouteFinishCb = cb;
        this.router._handleDone(cb, {redirect: '/burritoville'});
      });
      it('invokes callback with data no redirect or error key is present', function(done) {
        const cb = function(data, redirect, error) {
          expect(data).to.eql({salsa: 'verde'});
          expect(redirect).to.equal(null);
          expect(error).to.equal(null);
          done();
        };
        this.router._latestRouteFinishCb = cb;
        this.router._handleDone(cb, {salsa: 'verde'});
      });
    });

  });



  describe('public instance methods', function() {

    describe('setContext', function() {
      it('sets the context', function() {
        this.router.setContext({taco: 'sauce'});
        this.router._context.should.eql({taco: 'sauce'});
      });
    });

    describe('use', function() {
      it('add proper object to end of routes array', function() {
        this.router.use('/burrito', function() {return 'burrito';});
        this.router.use('/taco', function() {return 'taco';});
        const route = this.router._routes[1];
        route.handler().should.equal('taco');
        route.pattern.match('/taco').should.eql({});
      });
    });

    describe('route', function() {
      it('invokes correct correct route handler and routeFinish cb', function(testDone) {
        this.router.use('/foo', function() {});
        this.router.use('/bar', function(done) {done();});
        this.router.route('/bar', function() {testDone();});
      });
      it('passes correct params to route handler', function() {
        this.router.use('/foo', function(done, location, context, preRouted) {
          location.url.should.equal('/foo?a=b');
          context.should.equal('quesadilla');
          preRouted.should.equal('salsa');
        });
        this.router.setContext('quesadilla');
        this.router.route('/foo?a=b', ()=>{}, 'salsa');
      }); 
      it('currys location to routeFinish', function() {
        this.router.use('/bar', function(done) {done();});
        this.router.route('/bar?b=c', function(location) {
          location.url.should.equal('/bar?b=c');
        });
      });
      it('handles not found', function() {
        this.router.route('/bar?b=c', function(location, data, redirect, error) {
          location.url.should.equal('/bar?b=c');
          expect(data).to.equal(null);
          expect(redirect).to.equal(null);
          expect(error).to.equal(null);
        });
      });
      it('provides default routeFinish', function() {
        this.router.use('/bar', function(done) {done();});
        this.router.route('/bar');
      });
    });

    describe('startRouting', function() {
      beforeEach(function() {
        this.history = {
          listen: function(cb) {this.cb=cb;},
          go: function(pathname, search) {
            this.cb({pathname, search});
          }
        }
      });
      it('listens to history and delegates to route()', function(done) {
        this.router.startRouting(this.history, function() {return 'ceviche';});
        this.router.route = function(url, routeFinish, preRouted) {
          url.should.equal('/beans/rice?plantains=yes');
          routeFinish().should.equal('ceviche');
          preRouted.should.be.true;
        };
        this.history.go('/beans/rice', '?plantains=yes');
        this.router.route = function(url, rf, preRouted) {
          preRouted.should.be.false;
          done();
        };
        this.history.go('', '');
      });
    });

  });

  describe('behavior', function() {
    it('only handles the latest route', function(done) {
      this.router.use('/fast-first', function(dun) { setTimeout(dun, 20) });
      this.router.use('/slow-second', function(dun) { setTimeout(dun, 40) });

      this.router.route('/fast-first', function() {
        throw(Error('routeFinish was called for route that is not current route'));
      });
      this.router.route('/slow-second', function() {
        done();
      });
    });
  });

});
