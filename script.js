async function processImages() {
    const files = document.getElementById('upload').files;
    let fileName = document.getElementById('fileName').value.trim();
    const icoSize = parseInt(document.getElementById('icoSize').value); 
    const processedImages = [];
    const progressBar = document.getElementById('progressBar');
    const maxTotalSizeMB = 20; // 20MB limit
    const maxTotalSizeBytes = maxTotalSizeMB * 1024 * 1024;

    if (files.length === 0) {
        showPopup('Please select images to upload.');
        return;
    }

    progressBar.value = 0; 
    progressBar.max = files.length; 

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'image/png') {
            // Use the original file name if the input is empty
            if (fileName === '') {
                fileName = file.name.replace(/\.[^/.]+$/, "");
            }
            await convertToICO(file, icoSize, fileName, i, processedImages, files.length, progressBar);
        } else {
            showPopup(`File ${file.name} is not a PNG image.`);
        }
    }
}

async function convertToICO(file, size, fileName, index, processedImages, totalFiles, progressBar) {
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);

                canvas.toBlob(blob => {
                    const icoData = URL.createObjectURL(blob);
                    processedImages.push({
                        filename: `${fileName}_${index + 1}.ico`,
                        data: icoData
                    });

                    progressBar.value = processedImages.length;

                    if (processedImages.length === totalFiles) {
                        saveImagesToZip(processedImages);
                    }
                }, 'image/vnd.microsoft.icon');
            };
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

function saveImagesToZip(images) {
    const zip = new JSZip();
    const folder = zip.folder('ICO');

    images.forEach(image => {
        fetch(image.data)
            .then(res => res.blob())
            .then(blob => {
                folder.file(image.filename, blob);
                if (images.indexOf(image) === images.length - 1) {
                    zip.generateAsync({ type: 'blob' }).then(function(content) {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(content);
                        link.download = 'ICO.zip';
                        link.click();
                    });
                }
            });
    });
}

function previewImage() {
    const file = document.getElementById('upload').files[0];
    let fileName = document.getElementById('fileName').value.trim();
    const icoSize = parseInt(document.getElementById('icoSize').value); 
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = ''; // Clear previous preview

    if (file && file.type === 'image/png') {
        // Use the original file name if the input is empty
        if (fileName === '') {
            fileName = file.name.replace(/\.[^/.]+$/, "");
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = icoSize;
                canvas.height = icoSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, icoSize, icoSize);

                const icoPreview = new Image();
                icoPreview.src = canvas.toDataURL('image/vnd.microsoft.icon');
                icoPreview.width = icoSize;
                icoPreview.height = icoSize;
                previewContainer.appendChild(icoPreview);
            };
        };
        reader.readAsDataURL(file);
    } else {
        showPopup('Please select a valid PNG image for preview.');
    }
}

function showPopup(message) {
    let popup = document.getElementById("popup");
    popup.textContent = message;
    popup.classList.add("show");
    setTimeout(() => {
        popup.classList.remove("show");
    }, 3000);
}
