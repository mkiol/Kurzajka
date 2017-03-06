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

var searchEnabled = false
var autoregEnabled = false

function notify(content) {
  // Show desktop notification if enabled in settings
  browser.storage.local.get("notify").then((result)=>{
    const notifyEnabled = result.notify == undefined ? true : result.notify
    if (notifyEnabled) {
      browser.notifications.create({
        "type": "basic",
        "iconUrl": browser.extension.getURL("res/kurzajka-48.png"),
        "title": "Kurzajka",
        "message": content
      })
    }
  })
}

function playSound() {
  // Play sound if enabled in settings
  browser.storage.local.get("sound").then((result)=>{
    const soundEnabled = result.sound == undefined ? true : result.sound
    if (soundEnabled) {
      const audio = new Audio(browser.extension.getURL("res/music.mp3"))
      audio.play()
    }
  })
}

function highlightTab(tab) {
  // Highlight tab
  // Doesn't work on Android
  /*try {
    browser.tabs.highlight({windowId: tab.windowId, tabs: tab.index}).then((data)=>{
      console.log(data)
    })
  } catch (e) {
    console.log(`Catch Error: ${e.message}`)
  }*/
}

function handleMessage(message, sender, sendResponse) {
  // Handle messages received from content script
  if (message.type === "cancel_search") {
    searchEnabled = false
    autoregEnabled = false
    return
  }

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
    notify(browser.i18n.getMessage("visitFoundTitle"))
    playSound()
    highlightTab(sender.tab)
    return
  }

  if (message.type === "autoreg_finished") {
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
