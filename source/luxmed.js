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

function ready() {
  // Return Promise that resolves when page is not busy
  return new Promise((resolve, reject)=>{
    const timerID = window.setInterval(()=>{
      const ele = document.getElementById("spinnerDiv")
      if (ele != null) {
        if (ele.style.display == "none") {
          window.clearInterval(timerID)
          resolve()
        }
      }
    }, 100)
  })
}

function isSearchPage() {
  // Return true if page contains search results
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
            box: trList[i],
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

function refresh() {
  // Refresh search results
  const but = document.querySelector("#advancedResevation input[type=submit]")
  if (but != null)
    but.click()
}

function autoReg(visit) {
  // Return promise that will do auto-registration
  visit.button.click()
  return new Promise((resolve, reject)=>{
    ready().then(()=>{
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
    })
  })
}

function closePopup() {
  // Close popup window
  const closeButton = document.querySelector("button._popupClose")
  if (closeButton)
    closeButton.click()
}

function randomRefreshTime() {
  // Return random time im ms for page refresh
  return Math.floor(Math.random() * 25000) + 5000
}

function handleMessage(message) {
  // Handle messages received from browser script
  const visits = getVisits()
  if (message.type === "search_on") {
    if (visits.length > 0) {
      visits[0].box.style.border = "6px solid magenta"
      showToolbar("visit-found")
      sendMessage({type: "search_finished"})
    } else {
      closePopup()
      showToolbar("stop-search-question")
      timer = window.setTimeout(refresh, randomRefreshTime())
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
  ready().then(()=>{
    if (isSearchPage()) {
      sendMessage({type: "check_search"})
    } else {
      sendMessage({type: "cancel_search"})
    }
  })
}

init()
