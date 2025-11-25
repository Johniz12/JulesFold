document.addEventListener('DOMContentLoaded', () => {
    // Make content editable on double-click
    const editableElements = document.querySelectorAll('h1, h2, h3, h4, h5, p, li, span');
    editableElements.forEach(element => {
        element.addEventListener('dblclick', () => {
            element.setAttribute('contenteditable', 'true');
            element.focus();
        });

        element.addEventListener('blur', () => {
            element.setAttribute('contenteditable', 'false');
        });
    });

    // Save as HTML
    document.getElementById('save-html').addEventListener('click', () => {
        fetch('style.css')
            .then(response => response.text())
            .then(css => {
                const resumeHTML = document.getElementById('resume-container').outerHTML;
                const blob = new Blob([`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Modern Professional Resume</title>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
                        <style>
                            ${css}
                        </style>
                    </head>
                    <body>
                        ${resumeHTML}
                    </body>
                    </html>
                `], { type: 'text/html' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'resume.html';
                link.click();
            });
    });

    // Save as PDF
    document.getElementById('save-pdf').addEventListener('click', () => {
        const resume = document.getElementById('resume-container');
        const opt = {
            margin:       0,
            filename:     'resume.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Hide buttons before generating PDF
        document.querySelector('.button-container').style.display = 'none';

        html2pdf().set(opt).from(resume).save().then(() => {
            // Show buttons again after PDF is generated
            document.querySelector('.button-container').style.display = 'block';
        });
    });
});
