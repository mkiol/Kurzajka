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

function init() {
  // Sound checkbox
  const boxSound = document.createElement("input")
  boxSound.type = "checkbox"
  boxSound.id = "sound-checkbox"
  boxSound.onclick = ()=> {
    browser.storage.local.set({
      sound: boxSound.checked
    })
  }
  const labelSound = document.createElement("label")
  labelSound.appendChild(boxSound)
  labelSound.appendChild(document.createTextNode(browser.i18n.getMessage("soundOption")))
  const pSound = document.createElement("p")
  pSound.appendChild(labelSound)

  // Notification checkbox
  const boxNotify = document.createElement("input")
  boxNotify.type = "checkbox"
  boxNotify.id = "notify-checkbox"
  boxNotify.onclick = ()=> {
    browser.storage.local.set({
      notify: boxNotify.checked
    })
  }
  const labelNotify = document.createElement("label")
  labelNotify.appendChild(boxNotify)
  labelNotify.appendChild(document.createTextNode(browser.i18n.getMessage("notifyOption")))
  const pNotify = document.createElement("p")
  pNotify.appendChild(labelNotify)

  const div = document.getElementById("options")
  div.appendChild(pSound)
  div.appendChild(pNotify)

  browser.storage.local.get().then((result)=>{
    boxSound.checked = result.sound == undefined ? true : result.sound
    boxNotify.checked = result.notify == undefined ? true : result.notify
  })
}

document.addEventListener("DOMContentLoaded", init)
