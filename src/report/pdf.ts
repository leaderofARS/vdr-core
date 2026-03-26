import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { AnchorResult } from '../types'

export interface ReportOptions {
  organizationName?: string
  dateRangeStr?: string
  anchors: AnchorResult[]
  solanaNetwork: string
  programId: string
}

export async function generatePdfReport(options: ReportOptions): Promise<Buffer> {
  const { anchors, organizationName = 'Organization', dateRangeStr = '', solanaNetwork, programId } = options

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { height } = page.getSize()

  const margin = 50
  let y = height - margin

  const drawText = (text: string, x: number, currY: number, size: number, isBold = false, color = rgb(0,0,0)) => {
    page.drawText(text, {
      x,
      y: currY,
      size,
      font: isBold ? fontBold : font,
      color,
    })
    return currY - size - 4
  }

  // --- Cover Page ---
  y = drawText('Cryptographic Integrity Report', margin, y, 24, true)
  y -= 20
  y = drawText(`Organization: ${organizationName}`, margin, y, 14, true)
  if (dateRangeStr) {
    y = drawText(`Date Range: ${dateRangeStr}`, margin, y, 12)
  }
  y = drawText(`Total Documents: ${anchors.length}`, margin, y, 12)
  y -= 40

  // --- Executive Summary ---
  const anchored = anchors.filter(a => a.status === 'confirmed').length
  const revoked = anchors.filter(a => a.status === 'revoked').length
  const verified = anchors.length

  y = drawText('Executive Summary', margin, y, 18, true)
  y -= 10
  y = drawText(`${verified} documents verified`, margin, y, 12)
  y = drawText(`${anchored} anchored`, margin, y, 12, false, rgb(0, 0.5, 0))
  if (revoked > 0) y = drawText(`${revoked} revoked`, margin, y, 12, false, rgb(0.8, 0, 0))
  y -= 30

  // --- Blockchain Proof Summary ---
  y = drawText('Blockchain Proof Summary', margin, y, 18, true)
  y -= 10
  y = drawText(`Solana Network: ${solanaNetwork}`, margin, y, 12)
  y = drawText(`Program ID: ${programId}`, margin, y, 12)
  y = drawText(`Total Transactions: ${anchored}`, margin, y, 12)
  y -= 30

  // --- Independent Verification Instructions ---
  y = drawText('Independent Verification Instructions', margin, y, 18, true)
  y -= 10
  y = drawText('Any independent auditor may verify these documents using the open-source SipHeron CLI:', margin, y, 10)
  y -= 10
  y = drawText('  sipheron verify --hash <document_hash>', margin, y, 10, true)
  y -= 10
  y = drawText('Or via the public explorer on Solana checking the program ID to ensure the tx includes the SHA-256 hash.', margin, y, 10)
  
  // Create Next Page for Document Inventory
  page = pdfDoc.addPage([595.28, 841.89])
  y = height - margin

  y = drawText('Document Inventory Table', margin, y, 18, true)
  y -= 20

  const colX = [margin, margin + 110, margin + 240, margin + 310, margin + 375]
  
  // Headers
  const drawRow = (row: string[], isHeader = false) => {
    if (y < margin + 40) {
      page = pdfDoc.addPage([595.28, 841.89])
      y = height - margin
    }
    const fontSize = isHeader ? 10 : 9
    page.drawText(row[0] || 'Unknown', { x: colX[0], y, size: fontSize, font: isHeader ? fontBold : font })
    page.drawText(row[1], { x: colX[1], y, size: fontSize, font: isHeader ? fontBold : font })
    page.drawText(row[2], { x: colX[2], y, size: fontSize, font: isHeader ? fontBold : font })
    page.drawText(row[3], { x: colX[3], y, size: fontSize, font: isHeader ? fontBold : font })
    
    // Attempt verification URL if given
    if (row[4]) {
      const maxUrlLen = 35
      const urlText = row[4].length > maxUrlLen ? row[4].substring(0, maxUrlLen - 3) + '...' : row[4]
      page.drawText(urlText, { x: colX[4], y, size: 7, font, color: rgb(0, 0, 0.8) })
    }
    y -= 15
  }

  drawRow(['Name', 'Hash', 'Date', 'Status', 'Verify URL'], true)
  y -= 5

  anchors.forEach(a => {
    const name = a.name ? (a.name.length > 20 ? a.name.substring(0, 17) + '...' : a.name) : 'Untitled'
    const shortHash = a.hash.substring(0, 18) + '...'
    const date = a.timestamp ? new Date(a.timestamp).toISOString().split('T')[0] : 'Unknown'
    const status = a.status.toUpperCase()
    drawRow([name, shortHash, date, status, a.verificationUrl || ''])
  })

  // Appendix Page
  page = pdfDoc.addPage([595.28, 841.89])
  y = height - margin

  y = drawText('Appendix - Full Hashes and Transaction Signatures', margin, y, 18, true)
  y -= 20

  anchors.forEach(a => {
    if (y < margin + 60) {
      page = pdfDoc.addPage([595.28, 841.89])
      y = height - margin
    }
    const name = a.name || 'Untitled'
    y = drawText(`Document: ${name}`, margin, y, 12, true)
    y = drawText(`Hash (SHA-256): ${a.hash}`, margin, y, 10)
    y = drawText(`Solana Tx: ${a.transactionSignature || 'None'}`, margin, y, 10, false, rgb(0,0,0.8))
    y -= 15
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
