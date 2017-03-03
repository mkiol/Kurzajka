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

var timer
var pTimer
var pIndicator

function getIndicator() {
  // Return span element that contains progress indicator
  pIndicator = document.createElement("span")
  pIndicator.id = "kurzajka-indicator"
  pIndicator.state = 0
  pTimer = setInterval(()=>{
    switch (pIndicator.state) {
    case 0: pIndicator.textContent = "....."; break
    case 1: pIndicator.textContent = "*...."; break
    case 2: pIndicator.textContent = "**..."; break
    case 3: pIndicator.textContent = "***.."; break
    case 4: pIndicator.textContent = "****."; break
    case 5: pIndicator.textContent = "*****"; break
    case 6: pIndicator.textContent = "****."; break
    case 7: pIndicator.textContent = "***.."; break
    case 8: pIndicator.textContent = "**..."; break
    case 9: pIndicator.textContent = "*...."; break
    }
    pIndicator.state = (pIndicator.state + 1) % 9
  }, 110)
  return pIndicator
}

function isSearchPage() {
  // Return true if search already done
  return document.querySelector("div.tableListGroup") != null
}

function getVisits() {
  // Return array that contains all visites that have been found
  const visits = []
  const liList = document.querySelectorAll("ul.tableList li")
  for(let i = 0, l = liList.length; i < l; i++) {
    const date = liList[i].querySelector("div.title").textContent
    const trList = liList[i].querySelectorAll("tbody tr")
    for(let i = 0, l = trList.length; i < l; i++) {
      const tdList = trList[i].querySelectorAll("td")
      if (tdList.length > 1) {
        const divList = tdList[1].querySelectorAll("div")
        if (divList.length > 2) {
          const visit = {
            date: date,
            hour: tdList[0].getAttribute("data-sort").trim(),
            button: tdList[0].querySelector("a.button"),
            row: trList[i],
            doctor: divList[0].textContent.trim(),
            service: divList[1].textContent.trim(),
            venue: divList[2].textContent.trim()
          }
          visits.push(visit)
        }
      }
    }
  }
  return visits
}

function hideToolbar() {
  // Hide toolbar
  const toolbar = document.getElementById("kurzajka-toolbar")
  if (toolbar != null) {
    clearTimeout(pTimer)
    toolbar.parentNode.removeChild(toolbar)
  }
}

function showToolbar(type) {
  // Show toolbar
  hideToolbar()

  let style = document.getElementById("kurzajka-style")
  if (style == null) {
    const bgColor = "indigo"
    const bgLightColor = "black"
    const fgColor = "fuchsia"
    style = document.createElement("style")
    style.id = "kurzajka-style"
    style.textContent =
      `#kurzajka-toolbar button, input {font-weight:bold; margin: 5px;
      font-size:18px; border: 3px solid ${fgColor}; background-color:${bgColor};
      color:${fgColor}; padding: 2px 4px; vertical-align: middle}
      #kurzajka-toolbar p, label {margin: 5px; font-weight:bold}
      #kurzajka-toolbar img {vertical-align:middle; margin-right:5px}
      #kurzajka-toolbar button:hover {background-color:${bgLightColor}}
      #kurzajka-indicator {font-size:20px; margin:0 5px 0 0; font-family: monospace;}
      #kurzajka-toolbar {padding:4px 8px; font-size:16px; position:fixed;
      top:0; left:0; width:100%; color:${fgColor}; z-index:100;
      border-bottom: 5px solid ${fgColor}; background-color:${bgColor}}
      button#kurzajka-cancel {position: fixed; top:0; right:0; border:hidden}`
    document.getElementsByTagName("head")[0].appendChild(style)
  }

  const toolbar = document.createElement("div")
  toolbar.id = "kurzajka-toolbar"

  if (type === "start-search-question") {

    const butX = document.createElement("button")
    butX.id = "kurzajka-cancel"
    butX.textContent = "X"
    butX.onclick = hideToolbar
    const p = document.createElement("p")
    p.textContent = browser.i18n.getMessage("startSearchQuestion")
    const butStart = document.createElement("button")
    butStart.textContent = browser.i18n.getMessage("startSearch")
    const boxReg = document.createElement("input")
    boxReg.type = "checkbox"
    boxReg.id = "kurzajka-reg-checkbox"
    const labelReg = document.createElement("label")
    labelReg.innerHTML = boxReg.outerHTML + browser.i18n.getMessage("autoReservationOption")

    butStart.onclick = ()=>{
      const autoreg = document.getElementById("kurzajka-reg-checkbox")
      if (autoreg.checked)
        showToolbar("autoreg-question")
      else
        sendMessage({type: "start_search", autoreg: false})
    }

    p.appendChild(butStart)
    p.appendChild(labelReg)
    p.appendChild(butX)
    toolbar.appendChild(p)

  } else if (type === "autoreg-question") {

    const p = document.createElement("p")
    p.textContent = browser.i18n.getMessage("acceptAutoregQuestion")
    const butAccept = document.createElement("button")
    butAccept.textContent = browser.i18n.getMessage("acceptAutoreg")
    butAccept.onclick = ()=>sendMessage({type: "start_search", autoreg: true})
    toolbar.appendChild(p)
    toolbar.appendChild(butAccept)

  } else if (type === "stop-search-question") {

    const p = document.createElement("p")
    p.appendChild(document.createTextNode(
      browser.i18n.getMessage("stopSearchQuestion")))
    p.appendChild(getIndicator())
    const butStop = document.createElement("button")
    butStop.textContent = browser.i18n.getMessage("stopSearch")
    butStop.onclick = ()=>sendMessage({type: "stop_search"})
    p.appendChild(butStop)
    toolbar.appendChild(p)

  } else if (type === "visit-found") {

    const p = document.createElement("p")
    p.textContent = browser.i18n.getMessage("visitFoundTitle")
    const butX = document.createElement("button")
    butX.id = "kurzajka-cancel"
    butX.textContent = "X"
    butX.onclick = hideToolbar
    p.appendChild(butX)
    toolbar.appendChild(p)

  } else if (type === "autoreg-error") {

    const p = document.createElement("p")
    p.textContent = browser.i18n.getMessage("autoregErrorTitle")
    const butX = document.createElement("button")
    butX.id = "kurzajka-cancel"
    butX.textContent = "X"
    butX.onclick = hideToolbar
    p.appendChild(butX)
    toolbar.appendChild(p)

  } else if (type === "autoreg-success") {

    const p = document.createElement("p")
    p.textContent = browser.i18n.getMessage("autoregSuccessTitle")
    const butX = document.createElement("button")
    butX.id = "kurzajka-cancel"
    butX.textContent = "X"
    butX.onclick = hideToolbar
    p.appendChild(butX)
    toolbar.appendChild(p)
  }

  document.body.appendChild(toolbar)
}

function refresh() {
  // Refresh search results
  const but = document.querySelector("#advancedResevation input[type=submit]")
  if (but)
    but.click()
}

function autoReg(visit) {
  // Return promise that will do auto-registration
  visit.button.click()
  return new Promise((resolve, reject)=>{
    window.setTimeout(()=>{
      const acceptCheck = document.getElementById("cbAccept")
      const acceptButton = document.getElementById("okButton")
      if (acceptCheck)
        acceptCheck.click()
      if (acceptButton) {
        acceptButton.click()
        resolve()
      } else {
        reject()
      }
    }, 2000)
  })
}

function closePopup() {
  // Close popup window
  window.setTimeout(()=>{
    const closeButton = document.querySelector("button._popupClose")
    if (closeButton)
      closeButton.click()
  }, 500)
}

function handleVisitFound(visit) {
  visit.row.style.border = "10px solid magenta"
  showToolbar("visit-found")
}

function handleVisitNotFound() {
  closePopup()
  showToolbar("stop-search-question")
  timer = window.setTimeout(refresh, 10000)
}

function handleMessage(message) {
  // Handle messages received from browser script
  const visits = getVisits()
  if (message.type === "search_on") {
    if (visits.length > 0) {
      handleVisitFound(visits[0])
      sendMessage({type: "search_finished"})
    } else {
      handleVisitNotFound()
    }
  } else if (message.type === "search_off") {
    window.clearTimeout(timer)

    if (visits.length === 0) {
      showToolbar("start-search-question")
      return
    }

    if (message.autoreg) {
      autoReg(visits[0]).then(()=>{
        sendMessage({type: "autoreg_finished", success: true})
        showToolbar("autoreg-success")
      }, ()=>{
        sendMessage({type: "autoreg_finished", success: false})
        showToolbar("autoreg-error")
      })
    }
  }
}

function sendMessage(message) {
  // Send message to browser script
  browser.runtime.sendMessage(message).then(handleMessage)
}

function init() {
  if (!isSearchPage())
    return

  sendMessage({type: "check_search"})
}

window.setTimeout(init, 500)
