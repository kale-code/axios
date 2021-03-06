var defaults = require('../../lib/defaults');
var utils = require('../../lib/utils');

describe('defaults', () => {
  var XSRF_COOKIE_NAME = 'CUSTOM-XSRF-TOKEN';

  beforeEach(() => {
    jasmine.Ajax.install();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
    delete axios.defaults.baseURL;
    delete axios.defaults.headers.get['X-CUSTOM-HEADER'];
    delete axios.defaults.headers.post['X-CUSTOM-HEADER'];
    document.cookie = XSRF_COOKIE_NAME + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
  });

  it('should transform request json', () => {
    expect(defaults.transformRequest[0]({foo: 'bar'})).toEqual('{"foo":"bar"}');
  });

  it('should do nothing to request string', () => {
    expect(defaults.transformRequest[0]('foo=bar')).toEqual('foo=bar');
  });

  it('should transform response json', () => {
    var data = defaults.transformResponse[0]('{"foo":"bar"}');

    expect(typeof data).toEqual('object');
    expect(data.foo).toEqual('bar');
  });

  it('should do nothing to response string', () => {
    expect(defaults.transformResponse[0]('foo=bar')).toEqual('foo=bar');
  });

  it('should use global defaults config', done => {
    axios('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should use modified defaults config', done => {
    axios.defaults.baseURL = 'http://example.com/';

    axios('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('http://example.com/foo');
      done();
    });
  });

  it('should use request config', done => {
    axios('/foo', {
      baseURL: 'http://www.example.com'
    });

    getAjaxRequest().then(request => {
      expect(request.url).toBe('http://www.example.com/foo');
      done();
    });
  });

  it('should use default config for custom instance', done => {
    var instance = axios.create({
      xsrfCookieName: XSRF_COOKIE_NAME,
      xsrfHeaderName: 'X-CUSTOM-XSRF-TOKEN'
    });
    document.cookie = instance.defaults.xsrfCookieName + '=foobarbaz';

    instance.get('/foo');

    getAjaxRequest().then(request => {
      expect(request.requestHeaders[instance.defaults.xsrfHeaderName]).toEqual('foobarbaz');
      done();
    });
  });

  it('should use GET headers', done => {
    axios.defaults.headers.get['X-CUSTOM-HEADER'] = 'foo';
    axios.get('/foo');

    getAjaxRequest().then(request => {
      expect(request.requestHeaders['X-CUSTOM-HEADER']).toBe('foo');
      done();
    });
  });

  it('should use POST headers', done => {
    axios.defaults.headers.post['X-CUSTOM-HEADER'] = 'foo';
    axios.post('/foo', {});

    getAjaxRequest().then(request => {
      expect(request.requestHeaders['X-CUSTOM-HEADER']).toBe('foo');
      done();
    });
  });

  it('should use header config', done => {
    var instance = axios.create({
      headers: {
        common: {
          'X-COMMON-HEADER': 'commonHeaderValue'
        },
        get: {
          'X-GET-HEADER': 'getHeaderValue'
        },
        post: {
          'X-POST-HEADER': 'postHeaderValue'
        }
      }
    });

    instance.get('/foo', {
      headers: {
        'X-FOO-HEADER': 'fooHeaderValue',
        'X-BAR-HEADER': 'barHeaderValue'
      }
    });

    getAjaxRequest().then(request => {
      expect(request.requestHeaders).toEqual(
        utils.merge(defaults.headers.common, defaults.headers.get, {
          'X-COMMON-HEADER': 'commonHeaderValue',
          'X-GET-HEADER': 'getHeaderValue',
          'X-FOO-HEADER': 'fooHeaderValue',
          'X-BAR-HEADER': 'barHeaderValue'
        })
      );
      done();
    });
  });

  it('should be used by custom instance if set before instance created', done => {
    axios.defaults.baseURL = 'http://example.org/';
    var instance = axios.create();

    instance.get('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('http://example.org/foo');
      done();
    });
  });

  it('should not be used by custom instance if set after instance created', done => {
    var instance = axios.create();
    axios.defaults.baseURL = 'http://example.org/';

    instance.get('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      done();
    });
  });
});
