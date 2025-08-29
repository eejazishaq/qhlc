import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface CertificateData {
  id: string
  user_id: string
  exam_id: string
  issued_date: string
  exam: {
    title: string
    exam_type: string
    total_marks: number
    passing_marks: number
  }
  user?: {
    full_name: string
    mobile: string
  }
}

export async function generateCertificatePDF(certificateData: CertificateData): Promise<Blob> {
  // Create a temporary HTML element for the certificate
  const certificateElement = createCertificateHTML(certificateData)
  document.body.appendChild(certificateElement)

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(certificateElement, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Create PDF
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    
    // Calculate dimensions to fit A4 landscape
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // Calculate image dimensions to maintain aspect ratio
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    
    const finalWidth = imgWidth * ratio
    const finalHeight = imgHeight * ratio
    
    // Center the image on the page
    const x = (pdfWidth - finalWidth) / 2
    const y = (pdfHeight - finalHeight) / 2
    
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
    
    // Generate PDF blob
    const pdfBlob = pdf.output('blob')
    
    return pdfBlob
  } finally {
    // Clean up
    document.body.removeChild(certificateElement)
  }
}

function createCertificateHTML(certificateData: CertificateData): HTMLElement {
  const certificateDiv = document.createElement('div')
  certificateDiv.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 1200px;
    height: 800px;
    background: #f8f9fa;
    padding: 20px;
    font-family: 'Arial', sans-serif;
    color: #2c3e50;
    overflow: hidden;
  `

  certificateDiv.innerHTML = `
    <!-- Main Certificate Container -->
    <div style="
      width: 100%;
      height: 100%;
      background: white;
      border: 2px solid #000;
      position: relative;
      padding: 20px;
      box-sizing: border-box;
    ">
      <!-- Thick Light Blue Border -->
      <div style="
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        border: 15px solid #87ceeb;
      "></div>
      
      <!-- Inner White Border -->
      <div style="
        position: absolute;
        top: 17px;
        left: 17px;
        right: 17px;
        bottom: 17px;
        border: 4px solid white;
      "></div>
      
      <!-- Inner Light Blue Border -->
      <div style="
        position: absolute;
        top: 21px;
        left: 21px;
        right: 21px;
        bottom: 21px;
        border: 2px solid #87ceeb;
      "></div>

      <!-- Corner Circles -->
      <div style="
        position: absolute;
        top: 15px;
        left: 15px;
        width: 50px;
        height: 50px;
        background: #87ceeb;
        border-radius: 50%;
        z-index: 10;
      "></div>
      
      <div style="
        position: absolute;
        top: 15px;
        right: 15px;
        width: 50px;
        height: 50px;
        background: #87ceeb;
        border-radius: 50%;
        z-index: 10;
      "></div>
      
      <div style="
        position: absolute;
        bottom: 15px;
        left: 15px;
        width: 50px;
        height: 50px;
        background: #87ceeb;
        border-radius: 50%;
        z-index: 10;
      "></div>
      
      <div style="
        position: absolute;
        bottom: 15px;
        right: 15px;
        width: 50px;
        height: 50px;
        background: #87ceeb;
        border-radius: 50%;
        z-index: 10;
      "></div>

      <!-- Top Ornamental Scrollwork -->
      <div style="
        position: absolute;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 150px;
        height: 40px;
        background: 
          radial-gradient(circle at 25% 50%, #87ceeb 0%, #87ceeb 30%, transparent 30%),
          radial-gradient(circle at 75% 50%, #87ceeb 0%, #87ceeb 30%, transparent 30%),
          linear-gradient(45deg, transparent 40%, #87ceeb 40%, #87ceeb 60%, transparent 60%),
          linear-gradient(-45deg, transparent 40%, #87ceeb 40%, #87ceeb 60%, transparent 60%);
        background-size: 25px 25px, 25px 25px, 15px 15px, 15px 15px;
        background-position: 0 0, 100px 0, 25px 10px, 25px 10px;
        background-repeat: no-repeat;
      "></div>

      <!-- Main Title -->
      <div style="
        text-align: center;
        margin-top: 120px;
        margin-bottom: 60px;
      ">
        <h1 style="
          font-size: 44px;
          font-weight: bold;
          color: #1e3a8a;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        ">QUALIFICATION CERTIFICATE</h1>
      </div>

      <!-- Main Body Text -->
      <div style="
        text-align: center;
        margin-bottom: 50px;
      ">
        <p style="
          font-size: 24px;
          color: #1e3a8a;
          margin: 0;
          line-height: 1.4;
          font-weight: 500;
        ">This Certificate is Hereby issued to you!</p>
      </div>

      <!-- Recipient Name -->
      <div style="
        text-align: center;
        margin-bottom: 40px;
      ">
        <div style="
          font-size: 52px;
          font-weight: bold;
          color: #1e3a8a;
          margin: 0;
        ">${certificateData.user?.full_name || 'Student Name'}</div>
      </div>

      <!-- Dotted Lines Around Name -->
      <div style="
        text-align: center;
        margin-bottom: 30px;
      ">
        <div style="
          width: 350px;
          height: 2px;
          background: repeating-linear-gradient(to right, #87ceeb 0, #87ceeb 8px, transparent 8px, transparent 16px);
          margin: 0 auto 15px;
        "></div>
        
        <div style="
          width: 350px;
          height: 2px;
          background: repeating-linear-gradient(to right, #87ceeb 0, #87ceeb 8px, transparent 8px, transparent 16px);
          margin: 0 auto;
        "></div>
      </div>

      <!-- Center Seal/Medal -->
      <div style="
        text-align: center;
        margin: 30px 0;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
          border-radius: 50%;
          border: 3px solid #1e3a8a;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          margin: 0 auto;
          position: relative;
          display: inline-block;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 22px;
            font-weight: bold;
            color: #1e3a8a;
          ">QHLC</div>
        </div>
        
        <!-- Blue Base/Ribbon -->
        <div style="
          width: 60px;
          height: 20px;
          background: #1e3a8a;
          margin: 0 auto;
          position: relative;
          border-radius: 0 0 10px 10px;
        "></div>
      </div>

      <!-- Congratulatory Message -->
      <div style="
        text-align: center;
        margin-bottom: 50px;
      ">
        <p style="
          font-size: 22px;
          color: #000;
          margin: 0;
          line-height: 1.4;
          font-weight: 500;
        ">Congratulation that you have passed</p>
      </div>

      <!-- Bottom Section with Date and Signature -->
      <div style="
        position: absolute;
        bottom: 60px;
        left: 50px;
        right: 50px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      ">
        <!-- Date Section -->
        <div style="text-align: left;">
          <div style="
            font-size: 18px;
            color: #000;
            margin-bottom: 12px;
            font-weight: bold;
            text-transform: uppercase;
          ">DATE</div>
          <div style="
            font-size: 16px;
            color: #000;
            padding-bottom: 6px;
            min-width: 160px;
            border-bottom: 2px dashed #87ceeb;
          ">${new Date(certificateData.issued_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
        </div>

        <!-- Signature Section -->
        <div style="text-align: right;">
          <div style="
            font-size: 18px;
            color: #000;
            margin-bottom: 12px;
            font-weight: bold;
            text-transform: uppercase;
          ">SIGNATURE</div>
          <div style="
            font-size: 16px;
            color: #000;
            padding-bottom: 6px;
            min-width: 160px;
            text-align: right;
            border-bottom: 2px dashed #87ceeb;
          ">(Issued by QHLC)</div>
        </div>
      </div>
    </div>
  `

  return certificateDiv
 }

// Alternative: Generate PDF using jsPDF directly (without HTML)
export function generateCertificatePDFDirect(certificateData: CertificateData): Blob {
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Set font
  pdf.setFont('helvetica')
  
  // Background
  pdf.setFillColor(248, 249, 250)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Main certificate container
  const certWidth = pageWidth - 20
  const certHeight = pageHeight - 20
  const certX = 10
  const certY = 10
  
  // Outer black border
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(2)
  pdf.rect(certX, certY, certWidth, certHeight)
  
  // Thick light blue border
  pdf.setDrawColor(135, 206, 235) // #87ceeb
  pdf.setLineWidth(15)
  pdf.rect(certX + 2, certY + 2, certWidth - 4, certHeight - 4)
  
  // Inner white border
  pdf.setDrawColor(255, 255, 255)
  pdf.setLineWidth(4)
  pdf.rect(certX + 17, certY + 17, certWidth - 34, certHeight - 34)
  
  // Inner light blue border
  pdf.setDrawColor(135, 206, 235)
  pdf.setLineWidth(2)
  pdf.rect(certX + 21, certY + 21, certWidth - 42, certHeight - 42)
  
  // Corner circles
  const cornerSize = 25
  
  // Top-left corner
  pdf.setFillColor(135, 206, 235)
  pdf.circle(certX + 20, certY + 20, cornerSize, 'F')
  
  // Top-right corner
  pdf.circle(certX + certWidth - 20, certY + 20, cornerSize, 'F')
  
  // Bottom-left corner
  pdf.circle(certX + 20, certY + certHeight - 20, cornerSize, 'F')
  
  // Bottom-right corner
  pdf.circle(certX + certWidth - 20, certY + certHeight - 20, cornerSize, 'F')
  
  // Top ornamental scrollwork (simplified)
  const scrollY = certY + 50
  for (let i = 0; i < 150; i += 25) {
    pdf.setFillColor(135, 206, 235)
    pdf.circle(certX + 60 + i, scrollY, 6, 'F')
  }
  
  // Main title
  pdf.setFontSize(36)
  pdf.setTextColor(30, 58, 138) // #1e3a8a
  pdf.text('QUALIFICATION CERTIFICATE', pageWidth / 2, 110, { align: 'center' })
  
  // Main body text
  pdf.setFontSize(20)
  pdf.setTextColor(30, 58, 138)
  pdf.text('This Certificate is Hereby issued to you!', pageWidth / 2, 140, { align: 'center' })
  
  // Recipient name
  pdf.setFontSize(42)
  pdf.setTextColor(30, 58, 138)
  pdf.text(certificateData.user?.full_name || 'Student Name', pageWidth / 2, 190, { align: 'center' })
  
  // Dotted lines around name
  const lineY1 = 210
  const lineY2 = 225
  const lineWidth = 200
  
  // Draw dotted lines
  for (let i = 0; i < lineWidth; i += 10) {
    pdf.setDrawColor(135, 206, 235)
    pdf.setLineWidth(2)
    pdf.line(pageWidth / 2 - lineWidth / 2 + i, lineY1, pageWidth / 2 - lineWidth / 2 + i + 6, lineY1)
    pdf.line(pageWidth / 2 - lineWidth / 2 + i, lineY2, pageWidth / 2 - lineWidth / 2 + i + 6, lineY2)
  }
  
  // Center seal/medal
  const sealX = pageWidth / 2
  const sealY = 270
  
  // Gold circle
  pdf.setFillColor(255, 215, 0) // #ffd700
  pdf.circle(sealX, sealY, 20, 'F')
  
  // Blue border
  pdf.setDrawColor(30, 58, 138)
  pdf.setLineWidth(2)
  pdf.circle(sealX, sealY, 20)
  
  // QHLC text in seal
  pdf.setFontSize(14)
  pdf.setTextColor(30, 58, 138)
  pdf.text('QHLC', sealX, sealY + 2, { align: 'center' })
  
  // Blue base/ribbon below seal
  pdf.setFillColor(30, 58, 138)
  const baseWidth = 30
  const baseHeight = 10
  pdf.rect(sealX - baseWidth / 2, sealY + 20, baseWidth, baseHeight, 'F')
  
  // Congratulatory message
  pdf.setFontSize(18)
  pdf.setTextColor(0, 0, 0)
  pdf.text('Congratulation that you have passed', pageWidth / 2, 320, { align: 'center' })
  
  // Date section (left)
  pdf.setFontSize(14)
  pdf.setTextColor(0, 0, 0)
  pdf.text('DATE', 70, pageHeight - 80)
  
  const issueDate = new Date(certificateData.issued_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  pdf.setFontSize(12)
  pdf.setTextColor(0, 0, 0)
  pdf.text(issueDate, 70, pageHeight - 65)
  
  // Draw dashed underline for date
  for (let i = 0; i < 100; i += 5) {
    pdf.setDrawColor(135, 206, 235)
    pdf.setLineWidth(1)
    pdf.line(70 + i, pageHeight - 60, 70 + i + 2, pageHeight - 60)
  }
  
  // Signature section (right)
  pdf.setFontSize(14)
  pdf.setTextColor(0, 0, 0)
  pdf.text('SIGNATURE', pageWidth - 70, pageHeight - 80)
  
  pdf.setFontSize(12)
  pdf.setTextColor(0, 0, 0)
  pdf.text('(Issued by QHLC)', pageWidth - 70, pageHeight - 65)
  
  // Draw dashed underline for signature
  for (let i = 0; i < 100; i += 5) {
    pdf.setDrawColor(135, 206, 235)
    pdf.setLineWidth(1)
    pdf.line(pageWidth - 170 + i, pageHeight - 60, pageWidth - 170 + i + 2, pageHeight - 60)
  }
  
  return pdf.output('blob')
} 