// // --------------------------
// // Core calculation & table
// // --------------------------

// function convertB(B) {
//     const map = {0:0, 3:25, 6:50, 9:75};
//     return map[B] || 0;
// }

// function calculateCFT(A, B, C){
//     let convertedB = convertB(B);
//     let value = (C * C * (A + convertedB / 100)) / 2304;
//     return Math.floor(value * 100) / 100;
// }

// function updateTable(){
//     const table = document.getElementById('tableBody');
//     let total = 0;

//     for(let i=0; i < table.rows.length; i++){
//         const row = table.rows[i];
//         row.cells[0].innerText = i + 1;

//         const A = parseFloat(row.cells[1].innerText) || 0;
//         const B = parseFloat(row.cells[2].innerText) || 0;
//         const C = parseFloat(row.cells[3].innerText) || 0;

//         const cft = calculateCFT(A,B,C);
//         row.cells[4].innerText = cft.toFixed(2);
//         total += cft;
//     }

//     document.getElementById('totalCFT').innerText = total.toFixed(2);
//     document.getElementById("firstNCFT").innerText = "0.00";
// }

// function addRow() {
//     const table = document.getElementById("tableBody");
//     const idx = table.rows.length + 1;

//     const row = table.insertRow();
//     row.classList.add("row-animate");

//     row.innerHTML = `
//         <td>${idx}</td>
//         <td contenteditable="true"></td>
//         <td contenteditable="true"></td>
//         <td contenteditable="true"></td>
//         <td>0.00</td>
//         <td><button class="delete-btn" onclick="deleteRow(this)">🗑</button></td>
//     `;
// }

// function addLogFromOCR(A, B, C) {
//     const table = document.getElementById("tableBody");
//     const idx = table.rows.length + 1;

//     const cft = calculateCFT(A, B, C);

//     const row = table.insertRow();
//     row.classList.add("row-animate");

//     row.innerHTML = `
//         <td>${idx}</td>
//         <td contenteditable="true">${A}</td>
//         <td contenteditable="true">${B}</td>
//         <td contenteditable="true">${C}</td>
//         <td>${cft.toFixed(2)}</td>
//         <td><button class="delete-btn" onclick="deleteRow(this)">🗑</button></td>
//     `;
// }

// function deleteRow(btn) {
//     const row = btn.parentNode.parentNode;
//     row.remove();
//     updateTable();
// }

// document.addEventListener('click', (e)=>{
//     // Prevent accidental table focus behavior when clicking controls
// });

// // Keep live edits updating
// document.addEventListener("DOMContentLoaded", () => {
//     const tableBody = document.getElementById('tableBody');
//     tableBody.addEventListener('input', updateTable);
// });

// // --------------------------
// // OCR, PDF, bulk, first N
// // --------------------------

// async function processPhoto(){
//     const fileInput = document.getElementById('photoUpload');
//     if (!fileInput.files.length) { setStatusMsg('svStatus','No image chosen','#b91c1c'); return; }
//     const file = fileInput.files[0];

//     const pre = await preprocessImage(file);

//     try {
//         const result = await Tesseract.recognize(pre, 'eng'); 
//         let text = result.data.text || '';
//         text = text.replace(/[O o]/g, '0').replace(/[IIl|]/g, '1').replace(/[Ss]/g,'5');

//         const regex = /(\d+)[^\d]+(\d+)[^\d]+(\d+)/g;
//         let match, count = 0;
//         while((match = regex.exec(text)) !== null){
//             const A = parseInt(match[1],10);
//             const B = parseInt(match[2],10);
//             const C = parseInt(match[3],10);
//             addLogFromOCR(A,B,C);
//             count++;
//         }

//         if (count === 0) {
//             setStatusMsg('svStatus','No triplets found in image','#b91c1c');
//         } else {
//             updateTable();
//             setStatusMsg('svStatus',`${count} logs added from image`,'#064e3b');
//             setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'), 1400);
//         }
//     } catch(e){
//         setStatusMsg('svStatus','OCR failed','#b91c1c');
//     }
// }

// function preprocessImage(file){
//     return new Promise((resolve) => {
//         const img = new Image();
//         img.onload = () => {
//             const canvas = document.createElement('canvas');
//             const ctx = canvas.getContext('2d');

//             const maxDim = 1600;
//             let w = img.width, h = img.height;
//             if (w > maxDim || h > maxDim) {
//                 const scale = Math.min(maxDim/w, maxDim/h);
//                 w = Math.round(w * scale); h = Math.round(h * scale);
//             }
//             canvas.width = w; canvas.height = h;
//             ctx.drawImage(img,0,0,w,h);

//             const imageData = ctx.getImageData(0,0,w,h);
//             for (let i=0;i<imageData.data.length;i+=4){
//                 const r = imageData.data[i], g = imageData.data[i+1], b = imageData.data[i+2];
//                 const gray = (r+g+b)/3;
//                 const t = gray > 170 ? 255 : 0;
//                 imageData.data[i]=imageData.data[i+1]=imageData.data[i+2]=t;
//             }
//             ctx.putImageData(imageData,0,0);
//             resolve(canvas.toDataURL('image/png'));
//         };
//         img.src = URL.createObjectURL(file);
//     });
// }

// function downloadPDF(){
//     const rows = Array.from(document.querySelectorAll("#cftTable tbody tr"));
//     if (rows.length === 0) { setStatusMsg('svStatus','Table empty','#b91c1c'); return; }

//     const header = [
//         {text:'Log #', style:'th', alignment:'center'},
//         {text:'LENGTH', style:'th', alignment:'center'},
//         {text:'WIDTH', style:'th', alignment:'center'},
//         {text:'CFT', style:'th', alignment:'center'}
//     ];

//     const body = [ header ];
//     let totalCFT = 0;
//     rows.forEach(row=>{
//         const log = row.cells[0].innerText.trim();
//         const A = parseFloat(row.cells[1].innerText) || 0;
//         const B = parseFloat(row.cells[2].innerText) || 0;
//         const C = parseFloat(row.cells[3].innerText) || 0;

//         const convertedB = convertB(B);
//         const rawLength = A + (convertedB/100);
//         const lengthTrunc = Math.floor(rawLength * 100) / 100; 

//         const cft = calculateCFT(A,B,C);
//         totalCFT += cft;

//         body.push([
//             {text:log, alignment:'center'},
//             {text: lengthTrunc.toFixed(2), alignment:'center'},
//             {text: C.toString(), alignment:'center'},
//             {text: cft.toFixed(2), alignment:'center'}
//         ]);
//     });

//     const n = parseInt(document.getElementById('firstN').value) || 0;
//     let firstNTotal = 0;
//     if (n>0){
//         for (let i=0;i< Math.min(n, rows.length); i++){
//             firstNTotal += parseFloat(rows[i].cells[4].innerText) || 0;
//         }
//     }

//     const docDefinition = {
//         pageOrientation: 'landscape',
//         pageMargins: [20, 20, 20, 20],
//         content: [
//             { text: 'CFT Measurement Report', style:'title', alignment:'center'},
//             { text: '\n' },
//             {
//                 columns: [
//                     { width: '*', text: `Total Logs: ${rows.length}`, style:'info' },
//                     { width: '*', text: `Total CFT (All Logs): ${totalCFT.toFixed(2)}`, style:'info' },
//                     { width: '*', text: n>0 ? `First ${n} Logs CFT: ${firstNTotal.toFixed(2)}` : '', style:'info' }
//                 ]
//             },
//             { text: '\n' },
//             {
//                 table: {
//                     headerRows: 1,
//                     widths: [ 'auto', '*', '*', '*' ],
//                     body: body
//                 },
//                 layout: {
//                     fillColor: function(rowIndex){ return rowIndex === 0 ? '#1e293b' : (rowIndex % 2 === 0 ? '#f6f8fb' : null); },
//                     hLineColor: '#dbe6f5',
//                     vLineColor: '#e6eef8',
//                     hLineWidth: function(){ return 0.5; },
//                     vLineWidth: function(){ return 0.5; },
//                 }
//             },
//             { text: '\n' },
//             { text: `Total CFT (All Logs): ${totalCFT.toFixed(2)}`, style:'total' },
//             (n>0) ? { text: `First ${n} Logs → Total CFT: ${firstNTotal.toFixed(2)}`, style:'firstN' } : {},
//             { text: '\nGenerated: ' + new Date().toLocaleString(), style:'foot' },
//             { text: 'Developed by Faisal', style:'developerFoot' }
//         ],
//         styles: {
//             title: { fontSize: 22, bold:true, color: '#1e293b' },
//             th: { fontSize: 13, bold: true, color:'#fff' },
//             info: { fontSize: 11, margin:[0,2,0,2] },
//             total: { fontSize: 16, bold:true, margin:[0,15,0,0], color:'#16a34a', alignment: 'right' },
//             firstN: { fontSize: 14, bold:true, margin:[0,6,0,0], color:'#d97706', alignment: 'right' },
//             foot: { fontSize:9, italics:true, alignment:'right', color:'#64748b' },
//             developerFoot: { fontSize:9, alignment:'right', color:'#64748b', margin:[0,5,0,0] }
//         },
//         defaultStyle: { fontSize: 11 }
//     };

//     pdfMake.createPdf(docDefinition).download("CFT_Measurement_Report.pdf");
// }

// function calculateFirstNLogs() {
//     const n = parseInt(document.getElementById("firstN").value);
//     if (isNaN(n) || n <= 0) { setStatusMsg('svStatus','Enter N > 0','#b91c1c'); return; }

//     const rows = document.querySelectorAll("#cftTable tbody tr");
//     if (rows.length === 0) { setStatusMsg('svStatus','Table empty','#b91c1c'); return; }
//     if (n > rows.length) { setStatusMsg('svStatus',`N > total logs (${rows.length})`,'#b91c1c'); return; }

//     let totalCFT = 0;
//     for (let i = 0; i < n; i++) totalCFT += parseFloat(rows[i].cells[4].innerText) || 0;
//     document.getElementById("firstNCFT").innerText = totalCFT.toFixed(2);
// }

// function addBulkLogs() {
//     let text = document.getElementById("bulkInput").value.trim();
//     if (!text) { setStatusMsg('svStatus','Paste logs first','#b91c1c'); return; }

//     const lines = text.split(/[\n,]+/);
//     let count = 0;

//     lines.forEach(line => {
//         const match = line.trim().match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
//         if (match) {
//             addLogFromOCR(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
//             count++;
//         }
//     });

//     if (count === 0) { setStatusMsg('svStatus','No valid logs found','#b91c1c'); return; }
//     updateTable();
//     document.getElementById("bulkInput").value = "";
//     setStatusMsg('svStatus',`${count} logs added`,'#064e3b');
//     setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1200);
// }

// // --------------------------
// // Utilities for status
// // --------------------------
// function setStatusMsg(id, text, color){
//     const el = document.getElementById(id);
//     if (!el) return;
//     el.innerText = text;
//     if (color) el.style.color = color;
// }

// // --------------------------
// // Voice: parsing helpers
// // --------------------------
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// function isValidTriplet(A,B,C) {
//     if (!Number.isInteger(A) || !Number.isInteger(B) || !Number.isInteger(C)) return false;
//     if (A < 0 || A > 99) return false;
//     if (C < 0 || C > 999) return false;
//     if ([0,3,6,9].includes(B) || (B >= 0 && B <= 9)) return true;
//     return false;
// }

// function trySplitMergedDigits(rawDigits) {
//     if (!/^\d+$/.test(rawDigits)) return null;
//     const len = rawDigits.length;

//     if (len >= 3) {
//         const A = parseInt(rawDigits.slice(0,1),10);
//         const B = parseInt(rawDigits.slice(1,2),10);
//         const C = parseInt(rawDigits.slice(2),10);
//         if (isValidTriplet(A,B,C)) return {A,B,C};
//     }
//     if (len === 4) {
//         const A = parseInt(rawDigits.slice(0,1),10);
//         const B = parseInt(rawDigits.slice(1,2),10);
//         const C = parseInt(rawDigits.slice(2),10);
//         if (isValidTriplet(A,B,C)) return {A,B,C};
//     }
//     if (len >= 4) {
//         const A = parseInt(rawDigits.slice(0,2),10);
//         const B = parseInt(rawDigits.slice(2,3),10);
//         const C = parseInt(rawDigits.slice(3),10);
//         if (isValidTriplet(A,B,C)) return {A,B,C};
//     }
//     for (let i = 1; i < Math.min(3, len-1); i++) {
//         const A = parseInt(rawDigits.slice(0,i),10);
//         const B = parseInt(rawDigits.slice(i,i+1),10);
//         const C = parseInt(rawDigits.slice(i+1),10);
//         if (isValidTriplet(A,B,C)) return {A,B,C};
//     }
//     return null;
// }

// function parseVoiceToTriplet(raw) {
//     if (!raw || typeof raw !== 'string') return null;

//     let text = raw.toLowerCase().trim();

//     text = text
//         .replace(/comma|full stop/gi, ",")
//         .replace(/dash|minus/gi, ",")
//         .replace(/\band\b/gi, " ")
//         .replace(/\bzero\b/gi, "0")
//         .replace(/\boh\b/gi, "0")
//         .replace(/\bone\b/gi, "1")
//         .replace(/\btwo\b/gi, "2")
//         .replace(/\bthree\b/gi, "3")
//         .replace(/\bfour\b/gi, "4")
//         .replace(/\bfive\b/gi, "5")
//         .replace(/\bsix\b/gi, "6")
//         .replace(/\bseven\b/gi, "7")
//         .replace(/\beight\b/gi, "8")
//         .replace(/\bnine\b/gi, "9")
//         .replace(/[^0-9, ]+/g, " ")
//         .replace(/\s+/g, " ")
//         .trim();

//     let groups = text.split(/[, ]+/).map(s => s.trim()).filter(s => s !== '');
//     groups = groups.map(g => g.replace(/\D/g,'')).filter(g => g !== '');

//     if (groups.length >= 3) {
//         const A = parseInt(groups[0],10);
//         const B = parseInt(groups[1],10);
//         const C = parseInt(groups[2],10);
//         if (isValidTriplet(A,B,C)) return {A,B,C};
//     }

//     if (groups.length === 1) {
//         const merged = groups[0];
//         const split = trySplitMergedDigits(merged);
//         if (split) return split;
//     }

//     const fallback = text.match(/(\d{1,2})[^\d]+(\d{1})[^\d]+(\d{1,3})/);
//     if (fallback) {
//         const A = parseInt(fallback[1],10);
//         const B = parseInt(fallback[2],10);
//         const C = parseInt(fallback[3],10);
//         if (isValidTriplet(A,B,C)) return {A,B,C};
//     }

//     return null;
// }

// // --------------------------
// // SINGLE voice (one-shot)
// // --------------------------
// function setupSingleVoice() {
//     const btn = document.getElementById("singleVoiceBtn");
//     if (!btn) return;
//     btn.addEventListener("click", () => {
//         if (!SpeechRecognition) { setStatusMsg('svStatus','Use Google Chrome','#b91c1c'); return; }

//         const recog = new SpeechRecognition();
//         recog.lang = "en-US";
//         recog.interimResults = false;
//         recog.continuous = false;

//         setStatusMsg('svStatus','Listening… 🎤','#059669');

//         recog.start();

//         recog.onresult = (e) => {
//             const raw = e.results[0][0].transcript;
//             const parsed = parseVoiceToTriplet(raw);
//             if (!parsed) {
//                 setStatusMsg('svStatus','Could not parse. Say: 4, 0, 48','#b91c1c');
//                 setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1200);
//                 return;
//             }
//             addLogFromOCR(parsed.A, parsed.B, parsed.C);
//             updateTable();
//             setStatusMsg('svStatus',`Added: ${parsed.A}, ${parsed.B}, ${parsed.C}`,'#064e3b');
//             setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1200);
//         };

//         recog.onerror = () => { setStatusMsg('svStatus','Error','#b91c1c'); setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1000); };
//     });
// }

// // --------------------------
// // MULTI voice (continuous)
// // --------------------------
// let multiRecog = null;
// let multiListening = false;

// function setupMultiVoice() {
//     const startBtn = document.getElementById("startVoiceBtn");
//     const stopBtn  = document.getElementById("stopVoiceBtn");
//     if (!startBtn || !stopBtn) return;

//     startBtn.addEventListener("click", () => {
//         if (!SpeechRecognition) { setStatusMsg('voiceStatus','Use Google Chrome','#b91c1c'); return; }
//         if (multiListening) { setStatusMsg('voiceStatus','Already listening','#b91c1c'); return; }

//         multiRecog = new SpeechRecognition();
//         multiRecog.lang = "en-US";
//         multiRecog.interimResults = false;
//         multiRecog.continuous = true;

//         multiRecog.onstart = () => { multiListening = true; setStatusMsg('voiceStatus','Listening… 🎤','#059669'); };
//         multiRecog.onresult = (event) => {
//             const last = event.results[event.results.length-1][0].transcript;
//             if (/^\s*stop\s*$/i.test(last)) { stopMultiVoice(); return; }
//             const parsed = parseVoiceToTriplet(last);
//             if (parsed) {
//                 addLogFromOCR(parsed.A, parsed.B, parsed.C);
//                 updateTable();
//                 setStatusMsg('voiceStatus',`Added: ${parsed.A}, ${parsed.B}, ${parsed.C}`,'#064e3b');
//                 setTimeout(()=> setStatusMsg('voiceStatus','Listening… 🎤','#059669'),900);
//             } else {
//                 setStatusMsg('voiceStatus','Could not parse - say like: 4, 0, 48','#b45309');
//                 setTimeout(()=> setStatusMsg('voiceStatus','Listening… 🎤','#059669'),1200);
//             }
//         };
//         multiRecog.onerror = () => {};
//         multiRecog.onend = () => { if (multiListening) { setTimeout(()=> { try { multiRecog.start(); } catch(e){} },200); } else { setStatusMsg('voiceStatus','Stopped','#ef4444'); } };

//         try { multiRecog.start(); } catch(e) { setStatusMsg('voiceStatus','Start failed','#b91c1c'); }
//     });

//     stopBtn.addEventListener("click", stopMultiVoice);
// }

// function stopMultiVoice() {
//     if (multiRecog) {
//         multiListening = false;
//         try { multiRecog.stop(); } catch(e){}
//         setStatusMsg('voiceStatus','Stopped','#ef4444');
//     } else {
//         setStatusMsg('voiceStatus','Idle','#334155');
//     }
// }

// // --------------------------
// // Init: bind regular buttons + voice
// // --------------------------
// document.addEventListener("DOMContentLoaded", () => {
//     // regular UI
//     // The addRowBtn is now only bound here, fixing the double-add bug.
//     document.getElementById('addRowBtn').addEventListener('click', addRow);
    
//     // Voice setup
//     setupSingleVoice();
//     setupMultiVoice();

//     // ensure table updates on edits
//     const tb = document.getElementById('tableBody');
//     if (tb) tb.addEventListener('input', updateTable);
// });
// --------------------------
// Core calculation & table
// --------------------------

function convertB(B) {
    const map = {0:0, 3:25, 6:50, 9:75};
    return map[B] || 0;
}

function calculateCFT(A, B, C){
    let convertedB = convertB(B);
    let value = (C * C * (A + convertedB / 100)) / 2304;
    return Math.floor(value * 100) / 100;
}

function updateTable(){
    const table = document.getElementById('tableBody');
    let total = 0;

    for(let i=0; i < table.rows.length; i++){
        const row = table.rows[i];
        row.cells[0].innerText = i + 1;

        const A = parseFloat(row.cells[1].innerText) || 0;
        const B = parseFloat(row.cells[2].innerText) || 0;
        const C = parseFloat(row.cells[3].innerText) || 0;

        const cft = calculateCFT(A,B,C);
        row.cells[4].innerText = cft.toFixed(2);
        total += cft;
    }

    document.getElementById('totalCFT').innerText = total.toFixed(2);
    document.getElementById("firstNCFT").innerText = "0.00";
}

function addRow() {
    const table = document.getElementById("tableBody");
    const idx = table.rows.length + 1;

    const row = table.insertRow();
    row.classList.add("row-animate");

    row.innerHTML = `
        <td>${idx}</td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td>0.00</td>
        <td><button class="delete-btn" onclick="deleteRow(this)">🗑</button></td>
    `;
}

function addLogFromOCR(A, B, C) {
    const table = document.getElementById("tableBody");
    const idx = table.rows.length + 1;

    const cft = calculateCFT(A, B, C);

    const row = table.insertRow();
    row.classList.add("row-animate");

    row.innerHTML = `
        <td>${idx}</td>
        <td contenteditable="true">${A}</td>
        <td contenteditable="true">${B}</td>
        <td contenteditable="true">${C}</td>
        <td>${cft.toFixed(2)}</td>
        <td><button class="delete-btn" onclick="deleteRow(this)">🗑</button></td>
    `;
}

function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    row.remove();
    updateTable();
}

document.addEventListener('click', (e)=>{
    // Prevent accidental table focus behavior when clicking controls
});

// Keep live edits updating
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById('tableBody');
    // Ensure table updates on edits
    if (tableBody) tableBody.addEventListener('input', updateTable);
});

// --------------------------
// OCR, PDF, bulk, first N
// --------------------------

async function processPhoto(){
    // Add check for Tesseract loading
    if (typeof Tesseract === 'undefined' || typeof Tesseract.recognize !== 'function') {
        setStatusMsg('svStatus','OCR library not loaded','#b91c1c');
        return;
    }
    
    const fileInput = document.getElementById('photoUpload');
    if (!fileInput.files.length) { setStatusMsg('svStatus','No image chosen','#b91c1c'); return; }
    const file = fileInput.files[0];

    const pre = await preprocessImage(file);

    try {
        const result = await Tesseract.recognize(pre, 'eng'); 
        let text = result.data.text || '';
        text = text.replace(/[O o]/g, '0').replace(/[IIl|]/g, '1').replace(/[Ss]/g,'5');

        const regex = /(\d+)[^\d]+(\d+)[^\d]+(\d+)/g;
        let match, count = 0;
        while((match = regex.exec(text)) !== null){
            const A = parseInt(match[1],10);
            const B = parseInt(match[2],10);
            const C = parseInt(match[3],10);
            addLogFromOCR(A,B,C);
            count++;
        }

        if (count === 0) {
            setStatusMsg('svStatus','No triplets found in image','#b91c1c');
        } else {
            updateTable();
            setStatusMsg('svStatus',`${count} logs added from image`,'#064e3b');
            setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'), 1400);
        }
    } catch(e){
        setStatusMsg('svStatus','OCR failed','#b91c1c');
    }
}

function preprocessImage(file){
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const maxDim = 1600;
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
                const scale = Math.min(maxDim/w, maxDim/h);
                w = Math.round(w * scale); h = Math.round(h * scale);
            }
            canvas.width = w; canvas.height = h;
            ctx.drawImage(img,0,0,w,h);

            const imageData = ctx.getImageData(0,0,w,h);
            for (let i=0;i<imageData.data.length;i+=4){
                const r = imageData.data[i], g = imageData.data[i+1], b = imageData.data[i+2];
                const gray = (r+g+b)/3;
                const t = gray > 170 ? 255 : 0;
                imageData.data[i]=imageData.data[i+1]=imageData.data[i+2]=t;
            }
            ctx.putImageData(imageData,0,0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = URL.createObjectURL(file);
    });
}

function downloadPDF(){
    // Add check for pdfMake loading
    if (typeof pdfMake === 'undefined' || typeof pdfMake.createPdf !== 'function') {
        setStatusMsg('svStatus','PDF library not loaded','#b91c1c');
        return;
    }

    const rows = Array.from(document.querySelectorAll("#cftTable tbody tr"));
    if (rows.length === 0) { setStatusMsg('svStatus','Table empty','#b91c1c'); return; }

    const header = [
        {text:'Log #', style:'th', alignment:'center'},
        {text:'LENGTH', style:'th', alignment:'center'},
        {text:'WIDTH', style:'th', alignment:'center'},
        {text:'CFT', style:'th', alignment:'center'}
    ];

    const body = [ header ];
    let totalCFT = 0;
    rows.forEach(row=>{
        const log = row.cells[0].innerText.trim();
        const A = parseFloat(row.cells[1].innerText) || 0;
        const B = parseFloat(row.cells[2].innerText) || 0;
        const C = parseFloat(row.cells[3].innerText) || 0;

        const convertedB = convertB(B);
        const rawLength = A + (convertedB/100);
        const lengthTrunc = Math.floor(rawLength * 100) / 100; 

        const cft = calculateCFT(A,B,C);
        totalCFT += cft;

        body.push([
            {text:log, alignment:'center'},
            {text: lengthTrunc.toFixed(2), alignment:'center'},
            {text: C.toString(), alignment:'center'},
            {text: cft.toFixed(2), alignment:'center'}
        ]);
    });

    const n = parseInt(document.getElementById('firstN').value) || 0;
    let firstNTotal = 0;
    if (n>0){
        for (let i=0;i< Math.min(n, rows.length); i++){
            firstNTotal += parseFloat(rows[i].cells[4].innerText) || 0;
        }
    }

    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [20, 20, 20, 20],
        content: [
            { text: 'CFT Measurement Report', style:'title', alignment:'center'},
            { text: '\n' },
            {
                columns: [
                    { width: '*', text: `Total Logs: ${rows.length}`, style:'info' },
                    { width: '*', text: `Total CFT (All Logs): ${totalCFT.toFixed(2)}`, style:'info' },
                    { width: '*', text: n>0 ? `First ${n} Logs CFT: ${firstNTotal.toFixed(2)}` : '', style:'info' }
                ]
            },
            { text: '\n' },
            {
                table: {
                    headerRows: 1,
                    widths: [ 'auto', '*', '*', '*' ],
                    body: body
                },
                layout: {
                    fillColor: function(rowIndex){ return rowIndex === 0 ? '#1e293b' : (rowIndex % 2 === 0 ? '#f6f8fb' : null); },
                    hLineColor: '#dbe6f5',
                    vLineColor: '#e6eef8',
                    hLineWidth: function(){ return 0.5; },
                    vLineWidth: function(){ return 0.5; },
                }
            },
            { text: '\n' },
            { text: `Total CFT (All Logs): ${totalCFT.toFixed(2)}`, style:'total' },
            (n>0) ? { text: `First ${n} Logs → Total CFT: ${firstNTotal.toFixed(2)}`, style:'firstN' } : {},
            { text: '\nGenerated: ' + new Date().toLocaleString(), style:'foot' },
            { text: 'Developed by Faisal', style:'developerFoot' }
        ],
        styles: {
            title: { fontSize: 22, bold:true, color: '#1e293b' },
            th: { fontSize: 13, bold: true, color:'#fff' },
            info: { fontSize: 11, margin:[0,2,0,2] },
            total: { fontSize: 16, bold:true, margin:[0,15,0,0], color:'#16a34a', alignment: 'right' },
            firstN: { fontSize: 14, bold:true, margin:[0,6,0,0], color:'#d97706', alignment: 'right' },
            foot: { fontSize:9, italics:true, alignment:'right', color:'#64748b' },
            developerFoot: { fontSize:9, alignment:'right', color:'#64748b', margin:[0,5,0,0] }
        },
        defaultStyle: { fontSize: 11 }
    };

    pdfMake.createPdf(docDefinition).download("CFT_Measurement_Report.pdf");
}

function calculateFirstNLogs() {
    const n = parseInt(document.getElementById("firstN").value);
    if (isNaN(n) || n <= 0) { setStatusMsg('svStatus','Enter N > 0','#b91c1c'); return; }

    const rows = document.querySelectorAll("#cftTable tbody tr");
    if (rows.length === 0) { setStatusMsg('svStatus','Table empty','#b91c1c'); return; }
    if (n > rows.length) { setStatusMsg('svStatus',`N > total logs (${rows.length})`,'#b91c1c'); return; }

    let totalCFT = 0;
    for (let i = 0; i < n; i++) totalCFT += parseFloat(rows[i].cells[4].innerText) || 0;
    document.getElementById("firstNCFT").innerText = totalCFT.toFixed(2);
}

function addBulkLogs() {
    let text = document.getElementById("bulkInput").value.trim();
    if (!text) { setStatusMsg('svStatus','Paste logs first','#b91c1c'); return; }

    const lines = text.split(/[\n,]+/);
    let count = 0;

    lines.forEach(line => {
        const match = line.trim().match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
        if (match) {
            addLogFromOCR(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
            count++;
        }
    });

    if (count === 0) { setStatusMsg('svStatus','No valid logs found','#b91c1c'); return; }
    updateTable();
    document.getElementById("bulkInput").value = "";
    setStatusMsg('svStatus',`${count} logs added`,'#064e3b');
    setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1200);
}

// --------------------------
// Utilities for status
// --------------------------
function setStatusMsg(id, text, color){
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = text;
    if (color) el.style.color = color;
}

// --------------------------
// Voice: parsing helpers
// --------------------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

function isValidTriplet(A,B,C) {
    if (!Number.isInteger(A) || !Number.isInteger(B) || !Number.isInteger(C)) return false;
    if (A < 0 || A > 99) return false;
    if (C < 0 || C > 999) return false;
    if ([0,3,6,9].includes(B) || (B >= 0 && B <= 9)) return true;
    return false;
}

function trySplitMergedDigits(rawDigits) {
    if (!/^\d+$/.test(rawDigits)) return null;
    const len = rawDigits.length;

    if (len >= 3) {
        const A = parseInt(rawDigits.slice(0,1),10);
        const B = parseInt(rawDigits.slice(1,2),10);
        const C = parseInt(rawDigits.slice(2),10);
        if (isValidTriplet(A,B,C)) return {A,B,C};
    }
    if (len === 4) {
        const A = parseInt(rawDigits.slice(0,1),10);
        const B = parseInt(rawDigits.slice(1,2),10);
        const C = parseInt(rawDigits.slice(2),10);
        if (isValidTriplet(A,B,C)) return {A,B,C};
    }
    if (len >= 4) {
        const A = parseInt(rawDigits.slice(0,2),10);
        const B = parseInt(rawDigits.slice(2,3),10);
        const C = parseInt(rawDigits.slice(3),10);
        if (isValidTriplet(A,B,C)) return {A,B,C};
    }
    for (let i = 1; i < Math.min(3, len-1); i++) {
        const A = parseInt(rawDigits.slice(0,i),10);
        const B = parseInt(rawDigits.slice(i,i+1),10);
        const C = parseInt(rawDigits.slice(i+1),10);
        if (isValidTriplet(A,B,C)) return {A,B,C};
    }
    return null;
}

function parseVoiceToTriplet(raw) {
    if (!raw || typeof raw !== 'string') return null;

    let text = raw.toLowerCase().trim();

    // Use a language-agnostic approach by relying on the API to give us digits.
    text = text
        .replace(/comma|full stop/gi, ",")
        .replace(/dash|minus/gi, ",")
        .replace(/\band\b/gi, " ")
        .replace(/[^0-9, ]+/g, " ") // Keep only digits, commas, and spaces
        .replace(/\s+/g, " ")
        .trim();

    let groups = text.split(/[, ]+/).map(s => s.trim()).filter(s => s !== '');
    groups = groups.map(g => g.replace(/\D/g,'')).filter(g => g !== '');

    if (groups.length >= 3) {
        const A = parseInt(groups[0],10);
        const B = parseInt(groups[1],10);
        const C = parseInt(groups[2],10);
        if (isValidTriplet(A,B,C)) return {A,B,C};
    }

    if (groups.length === 1) {
        const merged = groups[0];
        const split = trySplitMergedDigits(merged);
        if (split) return split;
    }

    const fallback = text.match(/(\d{1,2})[^\d]+(\d{1})[^\d]+(\d{1,3})/);
    if (fallback) {
        const A = parseInt(fallback[1],10);
        const B = parseInt(fallback[2],10);
        const C = parseInt(fallback[3],10);
        if (isValidTriplet(A,B,C)) return {A,B,C};
    }

    return null;
}

// --------------------------
// SINGLE voice (one-shot)
// --------------------------
function startSingleVoice() {
    if (!SpeechRecognition) { setStatusMsg('svStatus','Voice input requires Chrome/Safari browser on HTTPS.','#b91c1c'); return; }

    const recog = new SpeechRecognition();
    // Set language to English for best numerical recognition, which should still allow Kashmiri numbers on local device settings
    recog.lang = "en-US"; 
    recog.interimResults = false;
    recog.continuous = false;

    setStatusMsg('svStatus','Listening… 🎤 (Say: 4, 0, 48)','#059669');

    recog.start();

    recog.onresult = (e) => {
        const raw = e.results[0][0].transcript;
        const parsed = parseVoiceToTriplet(raw);
        if (!parsed) {
            setStatusMsg('svStatus','Could not parse. Say: 4, 0, 48','#b91c1c');
            setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1200);
            return;
        }
        addLogFromOCR(parsed.A, parsed.B, parsed.C);
        updateTable();
        setStatusMsg('svStatus',`Added: ${parsed.A}, ${parsed.B}, ${parsed.C}`,'#064e3b');
        setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1200);
    };

    recog.onerror = () => { setStatusMsg('svStatus','Error (Check mic permissions)','#b91c1c'); setTimeout(()=> setStatusMsg('svStatus','Waiting','#334155'),1000); };
}


// --------------------------
// MULTI voice (continuous)
// --------------------------
let multiRecog = null;
let multiListening = false;

function startMultiVoice() {
    if (!SpeechRecognition) { setStatusMsg('voiceStatus','Voice input requires Chrome/Safari browser on HTTPS.','#b91c1c'); return; }
    if (multiListening) { setStatusMsg('voiceStatus','Already listening','#b91c1c'); return; }

    multiRecog = new SpeechRecognition();
    // Set language to English for best numerical recognition
    multiRecog.lang = "en-US";
    multiRecog.interimResults = false;
    multiRecog.continuous = true;

    multiRecog.onstart = () => { multiListening = true; setStatusMsg('voiceStatus','Listening… 🎤','#059669'); };
    multiRecog.onresult = (event) => {
        const last = event.results[event.results.length-1][0].transcript;
        if (/^\s*stop\s*$/i.test(last)) { stopMultiVoice(); return; }
        const parsed = parseVoiceToTriplet(last);
        if (parsed) {
            addLogFromOCR(parsed.A, parsed.B, parsed.C);
            updateTable();
            setStatusMsg('voiceStatus',`Added: ${parsed.A}, ${parsed.B}, ${parsed.C}`,'#064e3b');
            setTimeout(()=> setStatusMsg('voiceStatus','Listening… 🎤','#059669'),900);
        } else {
            setStatusMsg('voiceStatus','Could not parse - say like: 4, 0, 48','#b45309');
            setTimeout(()=> setStatusMsg('voiceStatus','Listening… 🎤','#059669'),1200);
        }
    };
    multiRecog.onerror = () => { setStatusMsg('voiceStatus','Error (Check mic permissions)','#b91c1c'); multiListening = false; };
    multiRecog.onend = () => { 
        if (multiListening) { 
            // Restart the recognition if it stops unexpectedly
            setTimeout(()=> { try { multiRecog.start(); } catch(e){ multiListening=false; setStatusMsg('voiceStatus','Restart failed','#b91c1c'); } },200); 
        } else { 
            setStatusMsg('voiceStatus','Stopped','#ef4444'); 
        } 
    };

    try { multiRecog.start(); } catch(e) { setStatusMsg('voiceStatus','Start failed','#b91c1c'); }
}

function stopMultiVoice() {
    if (multiRecog) {
        multiListening = false;
        try { multiRecog.stop(); } catch(e){}
        setStatusMsg('voiceStatus','Stopped','#ef4444');
    } else {
        setStatusMsg('voiceStatus','Idle','#334155');
    }
}

// --------------------------
// Init: Bind event listeners for table editing (only)
// --------------------------
// All button clicks are now handled by inline onclick in HTML.
