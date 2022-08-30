"use strict";

/**
 * Module dependencies.
 */
var _require = require('string_decoder'),
    StringDecoder = _require.StringDecoder;

var Stream = require('stream');

var zlib = require('zlib');
/**
 * Buffers response data events and re-emits when they're unzipped.
 *
 * @param {Request} req
 * @param {Response} res
 * @api private
 */


exports.unzip = function (request, res) {
  var unzip = zlib.createUnzip();
  var stream = new Stream();
  var decoder; // make node responseOnEnd() happy

  stream.req = request;
  unzip.on('error', function (error) {
    if (error && error.code === 'Z_BUF_ERROR') {
      // unexpected end of file is ignored by browsers and curl
      stream.emit('end');
      return;
    }

    stream.emit('error', error);
  }); // pipe to unzip

  res.pipe(unzip); // override `setEncoding` to capture encoding

  res.setEncoding = function (type) {
    decoder = new StringDecoder(type);
  }; // decode upon decompressing with captured encoding


  unzip.on('data', function (buf) {
    if (decoder) {
      var string_ = decoder.write(buf);
      if (string_.length > 0) stream.emit('data', string_);
    } else {
      stream.emit('data', buf);
    }
  });
  unzip.on('end', function () {
    stream.emit('end');
  }); // override `on` to capture data listeners

  var _on = res.on;

  res.on = function (type, fn) {
    if (type === 'data' || type === 'end') {
      stream.on(type, fn.bind(res));
    } else if (type === 'error') {
      stream.on(type, fn.bind(res));

      _on.call(res, type, fn);
    } else {
      _on.call(res, type, fn);
    }

    return this;
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ub2RlL3VuemlwLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJTdHJpbmdEZWNvZGVyIiwiU3RyZWFtIiwiemxpYiIsImV4cG9ydHMiLCJ1bnppcCIsInJlcXVlc3QiLCJyZXMiLCJjcmVhdGVVbnppcCIsInN0cmVhbSIsImRlY29kZXIiLCJyZXEiLCJvbiIsImVycm9yIiwiY29kZSIsImVtaXQiLCJwaXBlIiwic2V0RW5jb2RpbmciLCJ0eXBlIiwiYnVmIiwic3RyaW5nXyIsIndyaXRlIiwibGVuZ3RoIiwiX29uIiwiZm4iLCJiaW5kIiwiY2FsbCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFFQSxlQUEwQkEsT0FBTyxDQUFDLGdCQUFELENBQWpDO0FBQUEsSUFBUUMsYUFBUixZQUFRQSxhQUFSOztBQUNBLElBQU1DLE1BQU0sR0FBR0YsT0FBTyxDQUFDLFFBQUQsQ0FBdEI7O0FBQ0EsSUFBTUcsSUFBSSxHQUFHSCxPQUFPLENBQUMsTUFBRCxDQUFwQjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFFQUksT0FBTyxDQUFDQyxLQUFSLEdBQWdCLFVBQUNDLE9BQUQsRUFBVUMsR0FBVixFQUFrQjtBQUNoQyxNQUFNRixLQUFLLEdBQUdGLElBQUksQ0FBQ0ssV0FBTCxFQUFkO0FBQ0EsTUFBTUMsTUFBTSxHQUFHLElBQUlQLE1BQUosRUFBZjtBQUNBLE1BQUlRLE9BQUosQ0FIZ0MsQ0FLaEM7O0FBQ0FELEVBQUFBLE1BQU0sQ0FBQ0UsR0FBUCxHQUFhTCxPQUFiO0FBRUFELEVBQUFBLEtBQUssQ0FBQ08sRUFBTixDQUFTLE9BQVQsRUFBa0IsVUFBQ0MsS0FBRCxFQUFXO0FBQzNCLFFBQUlBLEtBQUssSUFBSUEsS0FBSyxDQUFDQyxJQUFOLEtBQWUsYUFBNUIsRUFBMkM7QUFDekM7QUFDQUwsTUFBQUEsTUFBTSxDQUFDTSxJQUFQLENBQVksS0FBWjtBQUNBO0FBQ0Q7O0FBRUROLElBQUFBLE1BQU0sQ0FBQ00sSUFBUCxDQUFZLE9BQVosRUFBcUJGLEtBQXJCO0FBQ0QsR0FSRCxFQVJnQyxDQWtCaEM7O0FBQ0FOLEVBQUFBLEdBQUcsQ0FBQ1MsSUFBSixDQUFTWCxLQUFULEVBbkJnQyxDQXFCaEM7O0FBQ0FFLEVBQUFBLEdBQUcsQ0FBQ1UsV0FBSixHQUFrQixVQUFDQyxJQUFELEVBQVU7QUFDMUJSLElBQUFBLE9BQU8sR0FBRyxJQUFJVCxhQUFKLENBQWtCaUIsSUFBbEIsQ0FBVjtBQUNELEdBRkQsQ0F0QmdDLENBMEJoQzs7O0FBQ0FiLEVBQUFBLEtBQUssQ0FBQ08sRUFBTixDQUFTLE1BQVQsRUFBaUIsVUFBQ08sR0FBRCxFQUFTO0FBQ3hCLFFBQUlULE9BQUosRUFBYTtBQUNYLFVBQU1VLE9BQU8sR0FBR1YsT0FBTyxDQUFDVyxLQUFSLENBQWNGLEdBQWQsQ0FBaEI7QUFDQSxVQUFJQyxPQUFPLENBQUNFLE1BQVIsR0FBaUIsQ0FBckIsRUFBd0JiLE1BQU0sQ0FBQ00sSUFBUCxDQUFZLE1BQVosRUFBb0JLLE9BQXBCO0FBQ3pCLEtBSEQsTUFHTztBQUNMWCxNQUFBQSxNQUFNLENBQUNNLElBQVAsQ0FBWSxNQUFaLEVBQW9CSSxHQUFwQjtBQUNEO0FBQ0YsR0FQRDtBQVNBZCxFQUFBQSxLQUFLLENBQUNPLEVBQU4sQ0FBUyxLQUFULEVBQWdCLFlBQU07QUFDcEJILElBQUFBLE1BQU0sQ0FBQ00sSUFBUCxDQUFZLEtBQVo7QUFDRCxHQUZELEVBcENnQyxDQXdDaEM7O0FBQ0EsTUFBTVEsR0FBRyxHQUFHaEIsR0FBRyxDQUFDSyxFQUFoQjs7QUFDQUwsRUFBQUEsR0FBRyxDQUFDSyxFQUFKLEdBQVMsVUFBVU0sSUFBVixFQUFnQk0sRUFBaEIsRUFBb0I7QUFDM0IsUUFBSU4sSUFBSSxLQUFLLE1BQVQsSUFBbUJBLElBQUksS0FBSyxLQUFoQyxFQUF1QztBQUNyQ1QsTUFBQUEsTUFBTSxDQUFDRyxFQUFQLENBQVVNLElBQVYsRUFBZ0JNLEVBQUUsQ0FBQ0MsSUFBSCxDQUFRbEIsR0FBUixDQUFoQjtBQUNELEtBRkQsTUFFTyxJQUFJVyxJQUFJLEtBQUssT0FBYixFQUFzQjtBQUMzQlQsTUFBQUEsTUFBTSxDQUFDRyxFQUFQLENBQVVNLElBQVYsRUFBZ0JNLEVBQUUsQ0FBQ0MsSUFBSCxDQUFRbEIsR0FBUixDQUFoQjs7QUFDQWdCLE1BQUFBLEdBQUcsQ0FBQ0csSUFBSixDQUFTbkIsR0FBVCxFQUFjVyxJQUFkLEVBQW9CTSxFQUFwQjtBQUNELEtBSE0sTUFHQTtBQUNMRCxNQUFBQSxHQUFHLENBQUNHLElBQUosQ0FBU25CLEdBQVQsRUFBY1csSUFBZCxFQUFvQk0sRUFBcEI7QUFDRDs7QUFFRCxXQUFPLElBQVA7QUFDRCxHQVhEO0FBWUQsQ0F0REQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxuY29uc3QgeyBTdHJpbmdEZWNvZGVyIH0gPSByZXF1aXJlKCdzdHJpbmdfZGVjb2RlcicpO1xuY29uc3QgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJyk7XG5jb25zdCB6bGliID0gcmVxdWlyZSgnemxpYicpO1xuXG4vKipcbiAqIEJ1ZmZlcnMgcmVzcG9uc2UgZGF0YSBldmVudHMgYW5kIHJlLWVtaXRzIHdoZW4gdGhleSdyZSB1bnppcHBlZC5cbiAqXG4gKiBAcGFyYW0ge1JlcXVlc3R9IHJlcVxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLnVuemlwID0gKHJlcXVlc3QsIHJlcykgPT4ge1xuICBjb25zdCB1bnppcCA9IHpsaWIuY3JlYXRlVW56aXAoKTtcbiAgY29uc3Qgc3RyZWFtID0gbmV3IFN0cmVhbSgpO1xuICBsZXQgZGVjb2RlcjtcblxuICAvLyBtYWtlIG5vZGUgcmVzcG9uc2VPbkVuZCgpIGhhcHB5XG4gIHN0cmVhbS5yZXEgPSByZXF1ZXN0O1xuXG4gIHVuemlwLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgIGlmIChlcnJvciAmJiBlcnJvci5jb2RlID09PSAnWl9CVUZfRVJST1InKSB7XG4gICAgICAvLyB1bmV4cGVjdGVkIGVuZCBvZiBmaWxlIGlzIGlnbm9yZWQgYnkgYnJvd3NlcnMgYW5kIGN1cmxcbiAgICAgIHN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnJvcik7XG4gIH0pO1xuXG4gIC8vIHBpcGUgdG8gdW56aXBcbiAgcmVzLnBpcGUodW56aXApO1xuXG4gIC8vIG92ZXJyaWRlIGBzZXRFbmNvZGluZ2AgdG8gY2FwdHVyZSBlbmNvZGluZ1xuICByZXMuc2V0RW5jb2RpbmcgPSAodHlwZSkgPT4ge1xuICAgIGRlY29kZXIgPSBuZXcgU3RyaW5nRGVjb2Rlcih0eXBlKTtcbiAgfTtcblxuICAvLyBkZWNvZGUgdXBvbiBkZWNvbXByZXNzaW5nIHdpdGggY2FwdHVyZWQgZW5jb2RpbmdcbiAgdW56aXAub24oJ2RhdGEnLCAoYnVmKSA9PiB7XG4gICAgaWYgKGRlY29kZXIpIHtcbiAgICAgIGNvbnN0IHN0cmluZ18gPSBkZWNvZGVyLndyaXRlKGJ1Zik7XG4gICAgICBpZiAoc3RyaW5nXy5sZW5ndGggPiAwKSBzdHJlYW0uZW1pdCgnZGF0YScsIHN0cmluZ18pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGJ1Zik7XG4gICAgfVxuICB9KTtcblxuICB1bnppcC5vbignZW5kJywgKCkgPT4ge1xuICAgIHN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgfSk7XG5cbiAgLy8gb3ZlcnJpZGUgYG9uYCB0byBjYXB0dXJlIGRhdGEgbGlzdGVuZXJzXG4gIGNvbnN0IF9vbiA9IHJlcy5vbjtcbiAgcmVzLm9uID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgaWYgKHR5cGUgPT09ICdkYXRhJyB8fCB0eXBlID09PSAnZW5kJykge1xuICAgICAgc3RyZWFtLm9uKHR5cGUsIGZuLmJpbmQocmVzKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgICBzdHJlYW0ub24odHlwZSwgZm4uYmluZChyZXMpKTtcbiAgICAgIF9vbi5jYWxsKHJlcywgdHlwZSwgZm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfb24uY2FsbChyZXMsIHR5cGUsIGZuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbn07XG4iXX0=