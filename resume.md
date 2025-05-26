---
layout: page
title: "Resume"
subtitle: "Last Updated: 11/22/24"
use-site-title: true
css : "assets/css/pdf.css"
---


<script src="../assets/js/pdfobject.min.js"></script>

<div class="pdf-container" id="pdf-viewer">
    <embed src="../Naynee_Singh_CV_PDF.pdf" type="application/pdf" width="100%" height="100%">
</div>

<!-- Download Button (hidden by default) -->
<div class="download-button" id="download-btn">
    <a href="../Naynee_Singh_CV_PDF.pdf" download>Download</a>
</div>

<script>
    // Check if user is on mobile
    function isMobileDevice() {
        return (typeof window.orientation !== "undefined") 
            || (navigator.userAgent.indexOf('IOS') !== -1)
            || (navigator.userAgent.indexOf('Android') !== -1);
    }
    
    // When page loads
    window.onload = function() {
        const pdfViewer = document.getElementById('pdf-viewer');
        const downloadBtn = document.getElementById('download-btn');
        
        if (isMobileDevice()) {
            // On mobile: hide PDF viewer, show download button
            pdfViewer.style.display = 'none';
            downloadBtn.style.display = 'block';
        } else {
            // On desktop: show PDF viewer, hide download button
            pdfViewer.style.display = 'block';
            downloadBtn.style.display = 'none';
        }
    }
</script>
<!-- 

<div id="pdf" style="height: 800px;"></div>
<script src="../assets/js/pdfobject.min.js"></script>
<script>
PDFObject.embed("../Naynee_Singh_CV_PDF.pdf", "#pdf");
</script> -->
