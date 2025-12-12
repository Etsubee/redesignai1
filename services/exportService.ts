import { jsPDF } from "jspdf";
import { RealEstateAnalysis } from "../types";

const APP_NAME = "Redesign Ai";

const downloadFile = (filename: string, content: string, contentType: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const exportToHTML = (
  beforeImage: string | null,
  afterImages: string[], // Changed to accept multiple images
  analysis: RealEstateAnalysis | null,
  prompt: string,
  style: string
) => {
  const date = new Date().toLocaleDateString();
  
  // CSS for the slider and general layout
  const css = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
    header { border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; color: #f8fafc; font-size: 24px; }
    .date { color: #94a3b8; font-size: 14px; }
    .card { background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); margin-bottom: 30px; border: 1px solid #334155; }
    .variation-title { font-size: 14px; font-weight: bold; color: #818cf8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-title { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #6366f1; padding-left: 10px; }
    
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .info-item { background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155; }
    .info-label { font-size: 11px; text-transform: uppercase; color: #818cf8; font-weight: bold; display: block; margin-bottom: 4px; }
    .info-value { font-weight: 500; font-size: 14px; color: #f1f5f9; }
    
    .analysis-box { background: #0f172a; border: 1px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    ul { margin: 0; padding-left: 20px; color: #cbd5e1; }
    li { margin-bottom: 5px; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #334155; font-size: 14px; color: #cbd5e1; }
    th { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 12px; }
    
    /* Comparison Slider CSS */
    .comparison-slider {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: 8px;
        cursor: ew-resize;
        user-select: none;
    }
    
    /* The container height is determined by the After image (relative) */
    .after-image {
        display: block;
        width: 100%;
        height: auto;
        position: relative; 
        z-index: 1;
    }
    
    /* The Before image wrapper sits on top, absolute, clipped by width */
    .before-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 50%; /* Initial Split */
        height: 100%;
        overflow: hidden;
        z-index: 2;
        border-right: 3px solid #ffffff;
        box-shadow: 5px 0 20px rgba(0,0,0,0.5);
    }
    
    /* The Before image must be same size as container to align perfectly */
    .before-container img {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        /* Width is set by JS to match parent container width */
        max-width: none;
        object-fit: cover; 
    }
    
    /* Handle Icon */
    .slider-handle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        color: #0f172a;
        pointer-events: none; /* Let clicks pass to slider */
    }

    /* Print styles */
    @media print { 
        body { padding: 0; max-width: 100%; background: white; color: black; } 
        .card, .info-item, .analysis-box { background: white; border: 1px solid #ccc; color: black; box-shadow: none; }
        .no-print { display: none; }
        h1, h2, h3, h4, p, td, th { color: black !important; }
    }
    @media screen and (max-width: 600px) {
        body { padding: 15px; }
        header { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  `;

  // JS for Slider Mechanics
  const script = `
    document.addEventListener('DOMContentLoaded', () => {
        let activeSlider = null;
        let activeHandle = null;
        let activeBeforeContainer = null;

        // Initialize all sliders found on page
        document.querySelectorAll('.comparison-slider').forEach(slider => {
            const beforeContainer = slider.querySelector('.before-container');
            const beforeImg = beforeContainer.querySelector('img');
            
            // Sync width function to ensuring 'cropping' works correctly
            const syncWidth = () => {
                if(slider && beforeImg) {
                    beforeImg.style.width = slider.offsetWidth + 'px';
                }
            };
            
            window.addEventListener('resize', syncWidth);
            // Ensure width is synced when images load
            if(beforeImg.complete) syncWidth();
            beforeImg.onload = syncWidth;
            
            // Mouse Down Event
            const startDrag = (e) => {
                 activeSlider = slider;
                 activeBeforeContainer = beforeContainer;
                 activeHandle = slider.querySelector('.slider-handle');
                 updatePos(e.touches ? e.touches[0].clientX : e.clientX);
            };
            
            slider.addEventListener('mousedown', startDrag);
            slider.addEventListener('touchstart', startDrag, { passive: false });
        });

        // Global Move Logic
        const updatePos = (clientX) => {
            if(!activeSlider) return;
            const rect = activeSlider.getBoundingClientRect();
            let pos = clientX - rect.left;
            pos = Math.max(0, Math.min(pos, rect.width));
            const percent = (pos / rect.width) * 100;
            
            activeBeforeContainer.style.width = percent + "%";
            activeHandle.style.left = percent + "%";
        };

        const onMove = (e) => {
            if(!activeSlider) return;
            // Prevent default to stop scrolling while dragging on touch
            if(e.touches) e.preventDefault();
            updatePos(e.touches ? e.touches[0].clientX : e.clientX);
        };

        const onEnd = () => {
            activeSlider = null;
            activeHandle = null;
            activeBeforeContainer = null;
        };

        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
    });
  `;

  // Render Image Cards
  const renderCards = afterImages.map((img, idx) => `
    <div class="card">
        <div class="variation-title">Variation ${idx + 1}</div>
        ${beforeImage ? `
        <!-- Comparison Slider -->
        <div class="comparison-slider">
            <!-- After Image (Background) -->
            <img class="after-image" src="${img}" alt="Designed Space ${idx + 1}">
            
            <!-- Before Image (Overlay, Clipped) -->
            <div class="before-container">
                <img src="${beforeImage}" alt="Original Space">
            </div>

            <!-- Handle -->
            <div class="slider-handle">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/><path d="m15 18-6-6 6-6" style="transform: translateX(-6px)"/></svg>
            </div>
        </div>
        ` : `
        <!-- Single Image View (No Before Image available) -->
        <img style="width:100%; border-radius:6px; display:block;" src="${img}" alt="Generated Design ${idx + 1}">
        `}
    </div>
  `).join('');

  // Generate HTML Content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_NAME} Design Export - ${date}</title>
    <style>${css}</style>
</head>
<body>
    <header>
        <div>
            <h1>${APP_NAME}</h1>
            <span class="date">Generated on ${date}</span>
        </div>
    </header>

    ${renderCards}

    <div class="section-title">Design Configuration</div>
    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">Style</span>
            <span class="info-value">${style}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Instructions</span>
            <span class="info-value">${prompt || 'None'}</span>
        </div>
    </div>

    ${analysis ? `
    <div class="section-title">AI Property Analysis</div>
    <div class="analysis-box">
        <p style="color: #e2e8f0; margin-bottom: 20px;"><strong>Overview:</strong> ${analysis.description}</p>
        
        <div class="info-grid">
             <div class="info-item" style="border-color: #059669;">
                 <span class="info-label" style="color: #34d399;">Est. Value Increase</span>
                 <div style="font-size: 20px; font-weight: bold; color: #34d399;">${analysis.estimatedValueIncrease}</div>
             </div>
             <div class="info-item">
                 <span class="info-label">Est. Renovation Cost</span>
                 <div style="font-size: 18px;">${analysis.costEstimate}</div>
             </div>
        </div>

        <div style="margin-top: 20px;">
             <span class="info-label" style="margin-bottom: 10px;">Renovation Tips</span>
             <ul>
                ${analysis.renovationTips.map(t => `<li>${t}</li>`).join('')}
             </ul>
        </div>
        
        <div style="margin-top: 20px;">
            <span class="info-label" style="margin-bottom: 10px;">Cost Breakdown</span>
            <table>
                <thead>
                    <tr><th>Category</th><th style="text-align:right;">Estimated Cost</th></tr>
                </thead>
                <tbody>
                    ${analysis.costBreakdown.map(c => `<tr><td>${c.category}</td><td style="text-align:right; font-family: monospace;">${c.cost}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 50px; color: #64748b; font-size: 12px;">
        Generated by ${APP_NAME} &bull; Offline Compatible Export
    </div>

    ${beforeImage ? `<script>${script}</script>` : ''}
</body>
</html>
  `;

  downloadFile(`redesign-export-${Date.now()}.html`, htmlContent, 'text/html');
};

export const exportToPDF = (
  beforeImage: string | null,
  afterImage: string,
  analysis: RealEstateAnalysis | null,
  prompt: string,
  style: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text(APP_NAME, margin, y);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: 'right' });
  
  y += 15;

  // Images
  const imgWidth = beforeImage ? (pageWidth - (margin * 3)) / 2 : pageWidth - (margin * 2);
  const imgHeight = imgWidth * 0.75; // 4:3 aspect ratio approx

  if (beforeImage) {
      try {
          doc.addImage(beforeImage, 'JPEG', margin, y, imgWidth, imgHeight);
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text("Original", margin, y - 2);
      } catch (e) {
          console.error("Error adding before image to PDF", e);
      }
  }

  try {
      const x = beforeImage ? margin + imgWidth + margin : margin;
      doc.addImage(afterImage, 'JPEG', x, y, imgWidth, imgHeight);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("Design", x, y - 2);
  } catch (e) {
      console.error("Error adding after image to PDF", e);
  }

  y += imgHeight + 15;

  // Design Details
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Design Configuration", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Style: ${style}`, margin, y);
  y += 6;
  
  // Wrap Prompt text
  const splitPrompt = doc.splitTextToSize(`Prompt: ${prompt}`, pageWidth - (margin * 2));
  doc.text(splitPrompt, margin, y);
  y += (splitPrompt.length * 5) + 10;

  // Analysis Section
  if (analysis) {
      if (y > 200) { doc.addPage(); y = margin; } // Simple page break check

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("AI Market Analysis", margin, y);
      y += 8;

      // Stats
      doc.setFontSize(12);
      doc.setTextColor(22, 163, 74); // Green
      doc.text(`Est. Value Increase: ${analysis.estimatedValueIncrease}`, margin, y);
      doc.setTextColor(51, 65, 85);
      doc.text(`Est. Cost: ${analysis.costEstimate}`, margin + 80, y);
      y += 10;

      // Description
      doc.setFontSize(10);
      const desc = doc.splitTextToSize(`Overview: ${analysis.description}`, pageWidth - (margin * 2));
      doc.text(desc, margin, y);
      y += (desc.length * 5) + 5;

      // Tips
      doc.setFontSize(11);
      doc.text("Renovation Tips:", margin, y);
      y += 6;
      doc.setFontSize(10);
      analysis.renovationTips.forEach(tip => {
          doc.text(`• ${tip}`, margin + 5, y);
          y += 5;
      });
      y += 5;

      // Cost Table
      doc.setFontSize(11);
      doc.text("Cost Breakdown:", margin, y);
      y += 6;
      
      // Simple table header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(9);
      doc.text("Category", margin + 2, y + 5);
      doc.text("Cost", pageWidth - margin - 30, y + 5);
      y += 8;

      // Table rows
      analysis.costBreakdown.forEach((item, i) => {
          doc.text(item.category, margin + 2, y + 4);
          doc.text(item.cost, pageWidth - margin - 30, y + 4);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + 6, pageWidth - margin, y + 6);
          y += 7;
      });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated by ${APP_NAME} - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }

  doc.save(`redesign-ai-report-${Date.now()}.pdf`);
};