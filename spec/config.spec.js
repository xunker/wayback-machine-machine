
describe("config", function () {
  var config = require('../config');

  it("debug flag", () => {
    var subject = config(require('yargs')(['-v']));

    expect(subject.debug).toBeTruthy();
  });

  describe('--netscape1', () => {
    it("it set correct sub-flags", () => {
      var subject = config(require('yargs')(['--netscape1']));

      expect(subject.ignoreUserAgent).toBeTruthy();
      expect(subject.ignoreHttpVersion).toBeTruthy();
      expect(subject.http1).toBeTruthy();
      expect(subject.gif87a).toBeTruthy();
      expect(subject.proxyImageRedirects).toBeTruthy();
      expect(subject.imageColors).toBe(16);
    });
  });

  describe('--netscape1', () => {
    it("it set correct sub-flags", () => {
      var subject = config(require('yargs')(['--netscape1']));

      expect(subject.ignoreUserAgent).toBeTruthy();
      expect(subject.ignoreHttpVersion).toBeTruthy();
      expect(subject.http1).toBeTruthy();
      expect(subject.gif87a).toBeTruthy();
      expect(subject.proxyImageRedirects).toBeTruthy();
      expect(subject.imageColors).toBe(16);
    });
  });
});
