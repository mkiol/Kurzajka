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
      const ele = document.querySelector("div.ajax-loader")
      if (ele == null) {
        window.clearInterval(timerID)
        resolve()
      }
    }, 100)
  })
}

function armSearchButton() {
  // Return Promise that resolves then event listner for search
  // submit form is added
  return new Promise((resolve, reject)=>{
    const timerID = window.setInterval(()=>{
      const form = document.querySelector("#advancedSearchForm div form")
      if (form != null) {
        window.clearInterval(timerID)
        form.addEventListener("submit", init2, false)
        resolve()
      }
    }, 300)
  })
}

function isSearchPage() {
  // Return true if page contains search results
  const div = document.getElementById("freeSlotsResult")
  if (div != null) {
    return div.parentNode.style.display != "none"
  }
  return false
}

function refresh() {
  // Refresh search results
  hideToolbar()
  const but = document.querySelector("div.search-button button[type=submit]")
  if (but != null)
    but.click()
}

function getVisits() {
  // Return array that contains all visites that have been found
  const reqestedDateInput = document.querySelector("div.date input.form-control")
  let reqestedDate = ""
  if (reqestedDateInput != null) {
    reqestedDate = reqestedDateInput.value
    if (reqestedDate == "") {
      console.log("Error: unknown reqestedDate")
      return
    }
  } else {
    console.log("Error: unknown reqestedDateInput")
    return
  }

  const visits = []
  const days = document.querySelectorAll("#freeSlotsResult div.results div.panel div.row")
  for(let i = 0, l = days.length; i < l; i++) {
    const boxes = days[i].querySelectorAll(".freeSlot-box")
    for(let i = 0, l = boxes.length; i < l; i++) {
      const head = boxes[i].querySelector(".freeSlot-head")
      const content = boxes[i].querySelector(".freeSlot-content")
      const footer = boxes[i].querySelector(".freeSlot-footer")

      const date = head.querySelector("span:nth-child(1)").textContent.trim()
      if (date != reqestedDate)
        break

      const visit = {
        date: date,
        hour: head.querySelector("span:nth-child(2)").textContent.trim(),
        button: footer.querySelector("a.btn"),
        box: boxes[i],
        doctor: content.querySelector(".doctorName").textContent.trim(),
        service: content.querySelector(".speciality").textContent.trim(),
        venue: content.querySelector(".clinicName").textContent.trim()
      }
      visits.push(visit)
    }
  }
  return visits
}


function autoReg(visit) {
  // Return promise that will do auto-registration
  visit.button.click()
  return new Promise((resolve, reject)=>{
    /*window.setTimeout(()=>{
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
    }, 2000)*/
    resolve()
  })
}

function closePopup() {
  // Close popup window
  // Only for luxmed
}

function randomRefreshTime() {
  // Return random time im ms for page refresh
  return Math.floor(Math.random() * 25000) + 5000
}

function handleMessage(message) {
  // Handle messages received from browser script

  if (message == null)
    return

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

function init2() {
  console.log("init2")
  hideToolbar()
  ready().then(()=>{
    console.log("isSearchPage:",isSearchPage())
    if (isSearchPage()) {
      sendMessage({type: "check_search"})
    } else {
      sendMessage({type: "cancel_search"})
    }
  })
}

function init() {
  console.log("init")
  armSearchButton().then(()=>{
    console.log("Search button is armed!")
  })

  init2()
}

init()
