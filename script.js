// Convert B (Fractional part of length, e.g., 0->0, 3->25, 6->50, 9->75)
function convertB(B) {
    const map = {0:0, 3:25, 6:50, 9:75};
    return map[B] || 0;
}

// Calculate CFT (truncate to 2 decimal places WITHOUT rounding)
// CFT = (C^2 * (A + B/100)) / 2304
function calculateCFT(A, B, C){
    let convertedB = convertB(B);
    let value = (C * C * (A + convertedB / 100)) / 2304;
    // Truncate to 2 decimal places
    return Math.floor(value * 100) / 100; 
}

// Update table and total
function updateTable(){
    const table = document.getElementById('tableBody');
    let total = 0;
    
    // Recalculate and re-index rows
    for(let i=0; i < table.rows.length; i++){
        const row = table.rows[i];
        // Update Log #
        row.cells[0].innerText = i + 1; 

        // Get values from editable cells
        const A = parseFloat(row.cells[1].innerText) || 0;
        const B = parseFloat(row.cells[2].innerText) || 0;
        const C = parseFloat(row.cells[3].innerText) || 0;
        
        const cft = calculateCFT(A,B,C);
        
        // Update CFT value (5th cell)
        row.cells[4].innerText = cft.toFixed(2); 
        total += cft;
    }
    
    document.getElementById('totalCFT').innerText = total.toFixed(2);
    // Clear first N result when table updates
    document.getElementById("firstNCFT").innerText = "0.00"; 
}

// Add a blank, editable row
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

// Add row populated by OCR or bulk input
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

// Delete row function
function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    row.classList.add("fade-out"); // animation
    setTimeout(() => {
        row.remove();
        updateTable(); // Re-index and re-total
    }, 300);
}


// live update on edits
document.getElementById('tableBody').addEventListener('input', updateTable);

// OCR: basic extraction (preprocess + number extraction)
async function processPhoto(){
    const fileInput = document.getElementById('photoUpload');
    if (!fileInput.files.length) { alert("Please choose an image."); return; }
    const file = fileInput.files[0];

    // Preprocess: small canvas thresholding to help OCR
    const pre = await preprocessImage(file);

    // OCR
    try {
        // Removed logger: m => console.log(m)
        const result = await Tesseract.recognize(pre, 'eng'); 
        let text = result.data.text || '';
        // common corrections
        text = text.replace(/[O o]/g, '0').replace(/[IIl|]/g, '1').replace(/[Ss]/g,'5');

        // extract triplets of numbers: A B C
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
            alert("No numeric triplets detected. Try a clearer photo or use manual entry.");
        } else {
            updateTable();
            // Alert removed here: logs automatically appear in the table.
        }
    } catch(e){
        console.error(e);
        alert("OCR failed. Try again or a clearer photo.");
    }
}

// Preprocess image: grayscale + threshold (returns dataURL)
function preprocessImage(file){
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // scale down if too large for performance
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
                const t = gray > 170 ? 255 : 0; // threshold - adjust if needed
                imageData.data[i]=imageData.data[i+1]=imageData.data[i+2]=t;
            }
            ctx.putImageData(imageData,0,0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = URL.createObjectURL(file);
    });
}


// Download PDF (single attractive PDF — shows LENGTH and WIDTH in the PDF)
function downloadPDF(){
    const rows = Array.from(document.querySelectorAll("#cftTable tbody tr"));

    if (rows.length === 0) {
        alert("The table is empty. Please add logs first!");
        return;
    }

    // Build PDF body (use LENGTH and WIDTH instead of A/B/C)
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
        // Truncate for display in report
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

            // top information block
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
                    widths: [ 'auto', '*', '*', '*' ], // Adjusted widths
                    body: body
                },
                layout: {
                    fillColor: function(rowIndex, node, columnIndex){
                        return rowIndex === 0 ? '#1e293b' : (rowIndex % 2 === 0 ? '#f6f8fb' : null);
                    },
                    hLineColor: '#dbe6f5',
                    vLineColor: '#e6eef8',
                    hLineWidth: function(i,node){ return 0.5; },
                    vLineWidth: function(i,node){ return 0.5; },
                }
            },

            { text: '\n' },
            { text: `Total CFT (All Logs): ${totalCFT.toFixed(2)}`, style:'total' },
            (n>0) ? { text: `First ${n} Logs → Total CFT: ${firstNTotal.toFixed(2)}`, style:'firstN' } : {},
            { text: '\nGenerated: ' + new Date().toLocaleString(), style:'foot' },
            { text: 'Developed by Faisal', style:'developerFoot' }
        ],
        styles: {
            title: { fontSize: 22, bold:true, color: '#1e293b' }, // Darker title
            th: { fontSize: 13, bold: true, color:'#fff' },
            info: { fontSize: 11, margin:[0,2,0,2] },
            total: { fontSize: 16, bold:true, margin:[0,15,0,0], color:'#16a34a', alignment: 'right' }, // Green for total
            firstN: { fontSize: 14, bold:true, margin:[0,6,0,0], color:'#d97706', alignment: 'right' }, // Amber for first N
            foot: { fontSize:9, italics:true, alignment:'right', color:'#64748b' },
            developerFoot: { fontSize:9, alignment:'right', color:'#64748b', margin:[0,5,0,0] } // New style for developer name
        },
        defaultStyle: { fontSize: 11 }
    };

    pdfMake.createPdf(docDefinition).download("CFT_Measurement_Report.pdf");
}

// Highlight & compute first N logs (on-screen)
function calculateFirstNLogs() {
    const n = parseInt(document.getElementById("firstN").value);

    if (isNaN(n) || n <= 0) {
        alert("Please enter a valid number (N > 0)!");
        return;
    }

    const rows = document.querySelectorAll("#cftTable tbody tr");

    if (rows.length === 0) {
        alert("The table is empty. Please add logs first!");
        return;
    }

    if (n > rows.length) {
        alert(`N (${n}) is greater than the total number of logs (${rows.length}).`);
        return;
    }

    let totalCFT = 0;

    for (let i = 0; i < n; i++) {
        const cft = parseFloat(rows[i].cells[4].innerText) || 0;
        totalCFT += cft;
    }

    document.getElementById("firstNCFT").innerText = totalCFT.toFixed(2);
}

// Add logs from bulk textarea
function addBulkLogs() {
    let text = document.getElementById("bulkInput").value.trim();
    if (!text) {
        alert("Please paste logs first!");
        return;
    }

    const lines = text.split(/[\n,]+/); // split by new line or comma
    let count = 0;

    lines.forEach(line => {
        // Match formats like: 4-0-52 OR 4 0 52 OR 4/0/52
        const match = line.trim().match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);

        if (match) {
            const A = parseInt(match[1]);
            const B = parseInt(match[2]);
            const C = parseInt(match[3]);

            if (isNaN(A) || isNaN(B) || isNaN(C)) return;

            addLogFromOCR(A, B, C);
            count++;
        }
    });

    if (count === 0) {
        alert("No valid A-B-C logs detected!");
        return;
    }

    updateTable();
    document.getElementById("bulkInput").value = ""; // clear input box
    // alert(count + " logs added successfully!"); // Commented out
}