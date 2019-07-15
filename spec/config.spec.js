
describe("config", function () {
  var config = require('../config');

  it("debug flag", () => {
    var subject = config(require('yargs')(['-v']));

    expect(subject.debug).toBeTruthy();
  });

  describe('--image-colors', () => {
    describe('arg > 0', () => {
      it("sets colors to arg", () => {
        var subject = config(require('yargs')(['--image-colors=3']));

        expect(subject.imageColors).toBe(3);
      });
    });

    it("sets colors to zero", () => {
      var subject = config(require('yargs')(['--image-colors']));

      expect(subject.imageColors).toBe(0);
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

  describe('--netscape2', () => {
    it("it set correct sub-flags", () => {
      var subject = config(require('yargs')(['--netscape2']));

      expect(subject.ignoreUserAgent).toBeTruthy();
      expect(subject.ignoreHttpVersion).toBeTruthy();
      expect(subject.http1).toBeTruthy();
      expect(subject.gif87a).toBeFalsy();
      expect(subject.proxyImageRedirects).toBeFalsy();
      expect(subject.imageColors).toBe(16);
    });
  });
});
