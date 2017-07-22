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

var pTimer
var pIndicator

function getIndicator() {
 // Return span element that contains progress indicator
 pIndicator = document.createElement("span")
 pIndicator.id = "kurzajka-indicator"
 pIndicator.state = 0
 pTimer = setInterval(()=>{
   switch (pIndicator.state) {
   case 0: pIndicator.textContent = "*....."; break
   case 1: pIndicator.textContent = ".*...."; break
   case 2: pIndicator.textContent = "..*..."; break
   case 3: pIndicator.textContent = "...*.."; break
   case 4: pIndicator.textContent = "....*."; break
   case 5: pIndicator.textContent = ".....*"; break
   case 6: pIndicator.textContent = "....*."; break
   case 7: pIndicator.textContent = "...*.."; break
   case 8: pIndicator.textContent = "..*..."; break
   case 9: pIndicator.textContent = ".*...."; break
   }
   pIndicator.state = (pIndicator.state + 1) % 9
 }, 110)
 return pIndicator
}

function hideToolbar() {
 // Hide toolbar
 const toolbar = document.getElementById("kurzajka-toolbar")
 if (toolbar != null) {
   clearTimeout(pTimer)
   toolbar.parentNode.removeChild(toolbar)
 }
}

function appendCancel(element) {
  const butX = document.createElement("button")
  butX.id = "kurzajka-cancel"
  butX.textContent = "X"
  butX.onclick = hideToolbar
  element.appendChild(butX)
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
     #kurzajka-toolbar p, label {margin: 5px; font-weight:bold;}
     #kurzajka-toolbar img {vertical-align:middle; margin-right:5px}
     #kurzajka-toolbar button:hover {background-color:${bgLightColor}}
     #kurzajka-indicator {font-size:20px; margin:0 5px 0 5px; font-family: monospace;}
     #kurzajka-toolbar {padding:5px 15px 5px 55px; font-size:16px;
     position:fixed; top:0; left:0; width:100%; color:${fgColor}; z-index:10000;
     border-bottom: 5px solid ${fgColor};
     background: ${bgColor} url("${browser.extension.getURL("res/kurzajka-48.png")}") no-repeat 5px 5px;}
     button#kurzajka-cancel {position: fixed; top:0; right:0; border:hidden}`
   document.getElementsByTagName("head")[0].appendChild(style)
 }

 const toolbar = document.createElement("div")
 toolbar.id = "kurzajka-toolbar"

 if (type === "start-search-question") {

   const p = document.createElement("p")
   p.textContent = browser.i18n.getMessage("startSearchQuestion")
   const butStart = document.createElement("button")
   butStart.textContent = browser.i18n.getMessage("startSearch")
   const boxReg = document.createElement("input")
   boxReg.type = "checkbox"
   boxReg.id = "kurzajka-reg-checkbox"
   const labelReg = document.createElement("label")
   labelReg.appendChild(boxReg)
   labelReg.appendChild(document.createTextNode(
     browser.i18n.getMessage("autoReservationOption")))

   butStart.onclick = ()=>{
     const autoreg = document.getElementById("kurzajka-reg-checkbox")
     if (autoreg.checked)
       showToolbar("autoreg-question")
     else
       sendMessage({type: "start_search", autoreg: false})
   }

   p.appendChild(butStart)
   p.appendChild(labelReg)
   toolbar.appendChild(p)
   appendCancel(toolbar)

 } else if (type === "autoreg-question") {

   const p = document.createElement("p")
   p.textContent = browser.i18n.getMessage("acceptAutoregQuestion")
   const butAccept = document.createElement("button")
   butAccept.textContent = browser.i18n.getMessage("acceptAutoreg")
   butAccept.onclick = ()=>sendMessage({type: "start_search", autoreg: true})
   toolbar.appendChild(p)
   toolbar.appendChild(butAccept)
   appendCancel(toolbar)

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
   toolbar.appendChild(p)
   toolbar.appendChild(document.createElement("br"))
   appendCancel(toolbar)

 } else if (type === "autoreg-error") {

   const p = document.createElement("p")
   p.textContent = browser.i18n.getMessage("autoregErrorTitle")
   toolbar.appendChild(p)
   toolbar.appendChild(document.createElement("br"))
   appendCancel(toolbar)

 } else if (type === "autoreg-success") {

   const p = document.createElement("p")
   p.textContent = browser.i18n.getMessage("autoregSuccessTitle")
   toolbar.appendChild(p)
   toolbar.appendChild(document.createElement("br"))
   appendCancel(toolbar)
 }

 document.body.appendChild(toolbar)
}
