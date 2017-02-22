/*
 * Kurzajka -- WebExtension that automates appointment booking for
 *             private medical clinics in Poland
 *
 * by Michal Kosciesza <michal@mkiol.net>
 *
 * This is free and unencumbered software released into the public domain.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

const defaults = {
  notify: true,
  autoreg: false
}

var searchEnabled = false
var notifyEnabled = defaults.notify
var autoregEnabled = defaults.autoreg

function notify(content) {
  // Show desktop notification
  browser.notifications.create({
    "type": "basic",
    "iconUrl": browser.extension.getURL("res/kurzajka-48.png"),
    "title": "Kurzajka",
    "message": content
  })
}

function handleMessage(message, sender, sendResponse) {
  // Handle messages received from content script

  if (message.type === "start_search") {
    searchEnabled = true
    autoregEnabled = message.autoreg
    sendResponse({type: "search_on"})
    return
  }

  if (message.type === "stop_search") {
    searchEnabled = false
    sendResponse({type: "search_off"})
    return
  }

  if (message.type === "search_finished") {
    searchEnabled = false
    sendResponse({type: "search_off", autoreg: autoregEnabled})

    if (notifyEnabled)
      notify(browser.i18n.getMessage("visitFoundTitle"))

    // Reset to default values
    notifyEnabled = defaults.notify
    autoregEnabled = defaults.autoreg
    return
  }

  if (message.type === "autoreg_finished") {
    if (notifyEnabled)
      notify(browser.i18n.getMessage(
        message.success ? "autoregSuccessTitle" : "autoregErrorTitle"))
    return
  }

  if (message.type === "check_search") {
    if (searchEnabled)
      sendResponse({type: "search_on"})
    else
      sendResponse({type: "search_off"})
    return
  }
}

browser.runtime.onMessage.addListener(handleMessage)
