const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Escape helper
function esc(str = '') {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function buildHtml(data) {
  const { month, year, entries } = data;
  const monthInt = Number(month);
  const yearInt = Number(year);
  const monthName = new Date(yearInt, monthInt - 1).toLocaleString('default', { month: 'long' });
  const today = new Date();
  const todayDateStr = [
    String(today.getDate()).padStart(2,'0'),
    String(today.getMonth() + 1).padStart(2,'0'),
    yearInt
  ].join('.');

  const tableRows = entries.map((e,i)=>{
    const fullDate = `${String(e.day).padStart(2,'0')}.${String(monthInt).padStart(2,'0')}.${yearInt}`;
    return `<tr>
      <td>${i+1}</td>
      <td>${fullDate}</td>
      <td>${esc(e.venue)}</td>
      <td>${esc(e.block)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>MMU Schedule ${esc(monthName)} ${yearInt}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  @page { size: A4; margin: 0; }
  html, body { margin:0; padding:0; font-family: Arial, sans-serif; font-size:11pt; line-height:1.3; color:#111; }
  .pdf-page {
    width:210mm; height:297mm; box-sizing:border-box;
    padding:20mm 20mm 15mm 20mm; position:relative;
  }
  .header { text-align:center; margin-bottom:10px; }
  .header h1 { font-size:14pt; font-weight:700; margin:0 0 5px; }
  .header h2 { font-size:12pt; font-weight:600; margin:0 0 3px; }
  .header p { font-size:9pt; margin:0 0 2px; }
  .header hr { border:none; border-top:1px solid #9ca3af; margin:10px 0 15px; }
  .title { text-align:center; margin:0 0 10px; }
  .title h3 { font-size:16pt; font-weight:700; margin:0 0 5px; }
  .title h4 { font-size:14pt; font-weight:600; margin:0; }
  table { width:100%; border-collapse:collapse; margin-top:10px; font-size:10.5pt; }
  th, td { border:1.5px solid #6b7280; padding:6px 10px; text-align:left; vertical-align:top; }
  th { background:#f3f4f6; font-weight:600; white-space:nowrap; }
  .signatures { display:flex; justify-content:space-between; margin-top:15mm; font-size:10pt; }
  .signatures div { width:45%; }
  .signatures .right { text-align:right; }
  .signatures p { margin:2px 0; }
  .footer { margin-top:5mm; font-size:9.5pt; }
  .footer p { margin:3px 0; }
  .footer ol { margin:5px 0 0; padding-left:20px; }
  .footer li { margin-bottom:2px; }
  h1,h2,h3,h4 { page-break-after:avoid; }
</style>
</head>
<body>
  <div class="pdf-page">
    <div class="header">
      <h1>Government of Jammu &amp; Kashmir</h1>
      <h2>Office of the Chief Medical Officer/Convenor, DHS Kupwara</h2>
      <p>E-mail: damkup@gmail.com, cmokupwara@yahoo.com Telephone/Fax No: 01955-25227</p>
      <hr />
    </div>
    <div class="title">
      <h3>Tour Schedule of Medical Mobile Unit (MMU) Kupwara</h3>
      <h4>for the month of ${esc(monthName)} ${yearInt}</h4>
    </div>
    <table>
      <thead>
        <tr>
          <th>S. No</th>
          <th>Date of Event</th>
          <th>Name of Venue</th>
          <th>Name of Block</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="signatures">
      <div>
        <p>District Programme Manager</p>
        <p>NHM, Kupwara.</p>
      </div>
      <div class="right">
        <p>Convener</p>
        <p>District Health Society/</p>
        <p>Chief Medical Officer</p>
        <p>Kupwara</p>
      </div>
    </div>
    <div class="footer">
      <p>No: CMO/NHM/Kap/ <strong>752-63</strong></p>
      <p>Dated: <strong>${todayDateStr}</strong></p>
      <p style="font-weight:600; margin-top:10px;">Copy to:</p>
      <ol>
        <li>Mission Director National Health Mission J&amp;K for favour of Information.</li>
        <li>Chairperson District Health Society /DDC Kupwara for favour of Information.</li>
        <li>Block Medical Officer Concerned for information and n/a</li>
        <li>MMU Team for information and compliance.</li>
      </ol>
    </div>
  </div>
</body>
</html>`;
}

// Optional: in-file function config (alternative to vercel.json)
module.exports.config = {
  runtime: 'nodejs20.x'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { month, year, entries } = req.body || {};
  if (!month || !year) {
    return res.status(400).json({ error: 'Missing month or year' });
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'Entries array required with at least one entry' });
  }

  const valid = entries.filter(e => e && e.day && +e.day >=1 && +e.day <=31);
  if (valid.length === 0) {
    return res.status(400).json({ error: 'No valid day entries in payload' });
  }

  const html = buildHtml({ month, year, entries: valid });

  let browser;
  try {
    // Ensure headless mode (new Chrome uses headless "new" by default in recent versions; explicit is safe)
    const executablePath = await chromium.executablePath();
    if (!executablePath) {
      throw new Error('Chromium executable path not found (chromium.executablePath returned null)');
    }

    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="schedule.pdf"');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('Error generating PDF:', err);
    return res.status(500).json({ error: 'PDF generation failed', details: err.message });
  } finally {
    if (browser) {
      try { await browser.close(); } catch(_) {}
    }
  }
};