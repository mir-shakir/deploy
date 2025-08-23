const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// This is the HTML template for the final PDF.
function getHtml(data) {
    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthPadded = String(today.getMonth() + 1).padStart(2, '0');
    const docDate = `${day}.${monthPadded}.${data.year}`;

    let tableRows = '';
    data.entries.forEach((entry, i) => {
        const fullDate = String(entry.day).padStart(2, '0') + '.' + String(data.month).padStart(2, '0') + '.' + data.year;
        tableRows += `<tr>
            <td style="border: 1.5px solid #6b7280; padding: 6px 10px; vertical-align: top;">${i + 1}</td>
            <td style="border: 1.5px solid #6b7280; padding: 6px 10px; vertical-align: top;">${fullDate}</td>
            <td style="border: 1.5px solid #6b7280; padding: 6px 10px; vertical-align: top;">${entry.venue}</td>
            <td style="border: 1.5px solid #6b7280; padding: 6px 10px; vertical-align: top;">${entry.block}</td>
        </tr>`;
    });

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Inter', Arial, sans-serif; font-size: 11pt; line-height: 1.3; color: #333; }
            .page { padding: 20mm; position: relative; width: 210mm; height: 297mm; box-sizing: border-box; }
            table { width:100%; border-collapse:collapse; font-size:10.5pt; }
            p { margin: 2px 0; }
        </style>
    </head>
    <body>
        <div class="page">
            <div style="text-align:center; position:relative; height: 80px;">
                <svg style="position:absolute; left:0; top:0; width:75px; height:auto;" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg"><defs><path id="arc" d="M 60,150 A 140,140 0 0,1 340,150" fill="none" /></defs><circle cx="200" cy="150" r="120" fill="#d40f29"/><text font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#000" letter-spacing="2"><textPath href="#arc" startOffset="50%" text-anchor="middle">NATIONAL HEALTH MISSION</textPath></text><g fill="white"><g transform="translate(200, 100)" fill="#fddc02"><circle r="10"/><path d="M 0 -12 L 0 -16 M 12 0 L 16 0 M 0 12 L 0 16 M -12 0 L -16 0 M 9 -9 L 12 -12 M -9 9 L -12 12 M -9 -9 L -12 -12 M 9 9 L 12 12" stroke="#fddc02" stroke-width="2"/></g><g transform="translate(130, 140)"><circle cx="0" cy="0" r="12"/><rect x="-10" y="12" width="20" height="30" rx="5"/><rect x="-12" y="42" width="8" height="35" rx="4"/><rect x="4" y="42" width="8" height="35" rx="4"/></g><g transform="translate(270, 140)"><circle cx="0" cy="0" r="12"/><path d="M -15,12 L 15,12 L 8,42 L -8,42 Z"/><rect x="-10" y="42" width="8" height="35" rx="4"/><rect x="2" y="42" width="8" height="35" rx="4"/></g><g transform="translate(200, 160)"><circle cx="0" cy="0" r="9"/><path d="M -12,9 L 12,9 L 7,32 L -7,32 Z"/><rect x="-8" y="32" width="6" height="25" rx="3"/><rect x="2" y="32" width="6" height="25" rx="3"/></g><path d="M 148 160 C 160 172, 180 172, 192 165 M 252 160 C 240 172, 220 172, 208 165" stroke="white" stroke-width="4" fill="none"/></g><path d="M 100,275 L 300,275" stroke="#000" stroke-width="2"/><text x="200" y="300" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" font-weight="bold">राष्ट्रीय स्वास्थ्य मिशन</text></svg>
                <h1 style="font-size: 14pt; font-weight: bold; margin:0;">Government of Jammu & Kashmir</h1>
                <h2 style="font-size: 12pt; font-weight: 600; margin: 3px 0;">Office of the Chief Medical Officer/Convenor, DHS Kupwara</h2>
                <p style="font-size: 9pt; margin: 2px 0;">E-mail:damkup@gmail.com,cmokupwara@yahoo.com Telephone/Fax No: 01955-25227</p>
            </div>
            <hr style="border:none; border-top: 1px solid #9ca3af; margin-top: 15px; margin-bottom: 20px;">
            <div style="text-align:center; margin-bottom: 20px;">
                <h3 style="font-size: 16pt; font-weight: bold; margin: 5px 0;">Tour Schedule of Medical Mobile Unit (MMU) Kupwara</h3>
                <h4 style="font-size: 14pt; font-weight: 600; margin:0;">for the month of ${monthName} ${data.year}</h4>
            </div>
            <table>
                <thead><tr style="background-color: #f3f4f6;"><th style="border: 1.5px solid #6b7280; padding: 6px 10px; white-space: nowrap;">S. No</th><th style="border: 1.5px solid #6b7280; padding: 6px 10px; white-space: nowrap;">Date of Event</th><th style="border: 1.5px solid #6b7280; padding: 6px 10px; white-space: nowrap;">Name of Venue</th><th style="border: 1.5px solid #6b7280; padding: 6px 10px; white-space: nowrap;">Name of Block</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div style="display:flex; justify-content:space-between; margin-top: 40px; font-size:10pt; page-break-inside: avoid;"><div><p>District Programme Manager</p><p>NHM, Kupwara.</p></div><div style="text-align:right;"><p>Convener</p><p>District Health Society/</p><p>Chief Medical Officer</p><p>Kupwara</p></div></div>
            <div style="margin-top: 20px; font-size: 9.5pt; page-break-inside: avoid;"><p style="margin-bottom: 3px;">No:CMO/NHM/Kap/ <span style="font-weight:bold;">752-63</span></p><p style="margin-bottom: 3px;">Dated: <span style="font-weight:bold;">${docDate}</span></p><p style="font-weight:600; margin-top: 1rem;">Copy to:</p><ol style="list-style:decimal; padding-left: 20px; margin-top:5px; margin-bottom:0;"><li style="margin-bottom: 2px;">Mission Director National Health Mission J&K for favour of Information.</li><li style="margin-bottom: 2px;">Chairperson District Health Society /DDC Kupwara for favour of Information.</li><li style="margin-bottom: 2px;">Block Medical Officer Concerned for information and n/a</li><li>MMU Team for information and compliance.</li></ol></div>
        </div>
    </body>
    </html>`;
}

module.exports = async (req, res) => {
    let browser = null;
    try {
        const html = getHtml(req.body);

        // ** UPDATED BROWSER LAUNCH CONFIGURATION **
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=schedule.pdf');
        res.status(200).send(pdf);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating PDF: " + error.message);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};