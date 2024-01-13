;(function (xhr) {
  var XHR = XMLHttpRequest.prototype
  var open = XHR.open
  var send = XHR.send
  var setRequestHeader = XHR.setRequestHeader
  XHR.open = function (method, url) {
    this._method = method
    this._url = new URL(url, window.location.href).href
    this._requestHeaders = {}
    this._startTime = new Date().toISOString()
    return open.apply(this, arguments)
  }
  XHR.setRequestHeader = function (header, value) {
    this._requestHeaders[header] = value
    return setRequestHeader.apply(this, arguments)
  }
  XHR.send = function (body) {
    this.addEventListener('load', function () {
      var endTime = new Date().toISOString()
      var myUrl = this._url
      if (myUrl) {
        this._endTime = endTime
        document.dispatchEvent(
          new CustomEvent('listenInterfaceEvent', {
            detail: {
              req: {
                url: myUrl,
                method: this._method,
                headers: this._requestHeaders,
                startTime: this._startTime,
                body: body
              },
              res: {
                headers: this.getAllResponseHeaders(),
                body: this.response,
                endTime: this._endTime
              }
            }
          })
        )
      }
    })
    return send.apply(this, arguments)
  }
})(XMLHttpRequest)
