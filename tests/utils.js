import chai from 'chai';
chai.should();

import * as utils from '../src/utils';



describe('utils', function() {

  describe('parseUrl', function() {
    it('provides correct parts for URL with query', function() {
      const parsed = utils.parseUrl('/taco?style=mexicanos&meat=chorizo');
      parsed.path.should.equal('/taco');
      parsed.queryString.should.equal('style=mexicanos&meat=chorizo');
      parsed.query.should.eql({style: 'mexicanos', meat: 'chorizo'});
    });

    it('provides correct parts for URL without query', function() {
      const parsed = utils.parseUrl('/taco');
      parsed.path.should.equal('/taco');
      parsed.queryString.should.equal('');
      parsed.query.should.eql({});
    });

    it('decodes query parts', function() {
      const parsed = utils.parseUrl('/taco?meat%20ingredients=chorizo%20barbacoa%20steak');
      parsed.query.should.eql({'meat ingredients': 'chorizo barbacoa steak'});
    });

    it('handles equals character in query vals', function() {
      const parsed = utils.parseUrl('/taco?meat=chor=izo');
      parsed.query.should.eql({'meat': 'chor=izo'});
    });
  });

});
