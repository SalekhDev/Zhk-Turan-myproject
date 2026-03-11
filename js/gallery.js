const images = [
    { src: '/assets/images/facade.jpg', altKey: 'gallery-img1' },
    { src: '/assets/images/lobby.jpg', altKey: 'gallery-img2' },
    { src: '/assets/images/apartment.jpg', altKey: 'gallery-img3' },
    { src: '/assets/images/apartment.jpg', altKey: 'gallery-img4' },
    { src: '/assets/images/parking.jpg', altKey: 'gallery-img5' }
];

const galleryGrid = document.getElementById('galleryGrid');
if (galleryGrid) {
    images.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${img.src}" alt="${img.alt}" onclick="openModal('${img.src}')">
            <div class="gallery-overlay">
                <span>${img.alt}</span>
            </div>
        `;
        galleryGrid.appendChild(item);
    });
}

function openModal(src) {
    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:2000; display:flex; align-items:center; justify-content:center;';
    modal.innerHTML = `
        <img src="${src}" style="max-width:90%; max-height:90%; border-radius:8px;">
        <span onclick="this.parentElement.remove()" style="position:absolute; top:20px; right:40px; color:white; font-size:40px; cursor:pointer;">&times;</span>
    `;
    document.body.appendChild(modal);
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// При смене языка обновлять alt и текст в overlay
document.addEventListener('languageChanged', function() {
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
        const img = item.querySelector('img');
        const overlaySpan = item.querySelector('.gallery-overlay span');
        const altKey = images[index].altKey;
        const newText = translations[currentLang]?.[altKey] || 'Gallery image';
        img.alt = newText;
        overlaySpan.textContent = newText;
    });
});