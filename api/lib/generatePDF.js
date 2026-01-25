/**
 * Generate PDF from HTML using PDFShift API
 */
async function generatePDF(html) {
  const PDFSHIFT_API_KEY = process.env.PDFSHIFT_API_KEY || 'sk_e73390e3fb607518bd835b3abf4034682e40ae01';

  try {
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'X-API-Key': PDFSHIFT_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        use_print: true,
        format: 'A4',
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✓ PDF generated: ${buffer.length} bytes`);

    return buffer;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

module.exports = { generatePDF };
