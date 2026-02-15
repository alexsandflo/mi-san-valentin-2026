// =============================================
//  ADMIN PANEL — Lógica del configurador
//  Gestión de fotos, frases y generación de link
// =============================================

// =============================================
//  1. ESTADO
// =============================================

const MAX_PHOTOS = 15;
const MAX_PHRASES = 25;

const state = {
    partnerName: '',
    anniversaryDate: '',
    musicFile: '',
    photos: [],      // base64 comprimidas
    phrases: [
        'Te amo ❤️',
        'Eres mi universo 🌌',
        'Juntos por siempre 💕',
        'Mi corazón es tuyo 💝',
        'Eres la luz de mi vida ✨',
        'Contigo todo es mejor 🌹',
    ],
};

const phraseEmojis = ['💗', '💖', '💘', '✨', '🌹', '💕', '💞', '🌟', '💝', '❤️', '🌌', '💫', '🥰', '😍', '🌷'];

// (Fondo animado manejado 100% con CSS para máximo rendimiento)

// =============================================
//  3. DATOS DE LA PAREJA
// =============================================

function initPartnerInputs() {
    const nameInput = document.getElementById('partner-name');
    const dateInput = document.getElementById('anniversary-date');

    nameInput.addEventListener('input', () => { state.partnerName = nameInput.value.trim(); });
    dateInput.addEventListener('input', () => { state.anniversaryDate = dateInput.value; });
}

// =============================================
//  4. GESTIÓN DE FOTOS (con compresión)
// =============================================

function initPhotoUpload() {
    const input = document.getElementById('photo-input');
    const grid = document.getElementById('photo-grid');
    const addLabel = document.getElementById('add-photo-label');
    const info = document.getElementById('photo-info');

    input.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Mostrar estado de carga (opcional, visualmente simple cambiando texto del label)
        const originalText = addLabel.querySelector('.add-text').textContent;
        addLabel.querySelector('.add-text').textContent = '⏳';
        addLabel.style.pointerEvents = 'none';

        for (const file of files) {
            if (state.photos.length >= MAX_PHOTOS) {
                alert(`Límite de ${MAX_PHOTOS} fotos alcanzado.`);
                break;
            }
            try {
                const compressed = await compressImage(file, 300, 0.6); // Un poco más de calidad (300px, 0.6)
                state.photos.push(compressed);
                renderPhotoItem(compressed, state.photos.length - 1);
            } catch (err) {
                console.error('Error al procesar imagen', err);
            }
        }
        updatePhotoUI();
        input.value = '';

        // Restaurar botón
        addLabel.querySelector('.add-text').textContent = originalText;
        addLabel.style.pointerEvents = 'auto';
    });

    function renderPhotoItem(dataUrl, index) {
        const div = document.createElement('div');
        div.classList.add('photo-item');
        div.dataset.index = index;

        const img = document.createElement('img');
        img.src = dataUrl;

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('photo-remove');
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
            state.photos.splice(index, 1);
            rebuildPhotoGrid();
        });

        div.appendChild(img);
        div.appendChild(removeBtn);
        grid.insertBefore(div, addLabel);
    }

    function rebuildPhotoGrid() {
        grid.querySelectorAll('.photo-item').forEach(el => el.remove());
        state.photos.forEach((url, i) => renderPhotoItem(url, i));
        updatePhotoUI();
    }

    function updatePhotoUI() {
        info.textContent = `${state.photos.length} / ${MAX_PHOTOS} fotos`;
        if (state.photos.length >= MAX_PHOTOS) {
            addLabel.style.display = 'none';
        } else {
            addLabel.style.display = '';
        }
    }
}

function compressImage(file, maxSize, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
                else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// =============================================
//  5. GESTIÓN DE FRASES
// =============================================

function initPhrases() {
    renderAllPhrases();

    const newInput = document.getElementById('new-phrase-input');
    const addBtn = document.getElementById('add-phrase-btn');

    function addPhrase() {
        const text = newInput.value.trim();
        if (!text || state.phrases.length >= MAX_PHRASES) return;
        state.phrases.push(text);
        newInput.value = '';
        renderAllPhrases();
    }

    addBtn.addEventListener('click', addPhrase);
    newInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPhrase(); });
}

function renderAllPhrases() {
    const list = document.getElementById('phrases-list');
    list.innerHTML = '';

    state.phrases.forEach((phrase, idx) => {
        const div = document.createElement('div');
        div.classList.add('phrase-item');

        const emoji = document.createElement('span');
        emoji.classList.add('phrase-emoji');
        emoji.textContent = phraseEmojis[idx % phraseEmojis.length];

        const text = document.createElement('span');
        text.classList.add('phrase-text');
        text.textContent = phrase;

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('phrase-remove');
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
            state.phrases.splice(idx, 1);
            renderAllPhrases();
        });

        div.appendChild(emoji);
        div.appendChild(text);
        div.appendChild(removeBtn);
        list.appendChild(div);
    });
}

// =============================================
//  6. GENERACIÓN DE LINK
// =============================================

function initGenerate() {
    const generateBtn = document.getElementById('generate-btn');
    const validationMsg = document.getElementById('validation-msg');
    const linkResult = document.getElementById('link-result');
    const linkInput = document.getElementById('generated-link');
    const copyBtn = document.getElementById('copy-btn');
    const copyFeedback = document.getElementById('copy-feedback');
    const previewBtn = document.getElementById('preview-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');

    generateBtn.addEventListener('click', () => {
        // Validación
        if (!state.partnerName) {
            showValidation('⚠️ Por favor, ingresa el nombre de tu pareja');
            return;
        }

        hideValidation();

        // Generar config
        const config = {
            n: state.partnerName,
            d: state.anniversaryDate || '',
            p: state.phrases.length > 0 ? state.phrases : ['Te amo ❤️'],
            i: state.photos,
            m: state.musicFile || '',
        };

        const json = JSON.stringify(config);
        const compressed = window.LZString.compressToEncodedURIComponent(json);

        // Guardar también en localStorage como respaldo
        localStorage.setItem('valentine_config', json);

        // Construir link — usar la raíz "/" en lugar de "/index.html"
        // porque el servidor redirige /index.html a / y pierde el hash
        const origin = window.location.origin;
        const fullLink = `${origin}/#cfg=${compressed}`;

        linkInput.value = fullLink;

        // Vista previa
        previewBtn.href = fullLink;

        // WhatsApp
        const waText = encodeURIComponent(`💝 ¡Tengo algo especial para ti! Abre este link:\n${fullLink}`);
        whatsappBtn.href = `https://wa.me/?text=${waText}`;

        // Mostrar resultado
        linkResult.classList.remove('hidden');
        linkResult.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Vibración (móvil)
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    });

    // Copiar
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(linkInput.value);
            copyFeedback.classList.remove('hidden');
            copyFeedback.textContent = '✅ ¡Link copiado al portapapeles!';
            setTimeout(() => copyFeedback.classList.add('hidden'), 3000);
        } catch {
            linkInput.select();
            document.execCommand('copy');
            copyFeedback.classList.remove('hidden');
            copyFeedback.textContent = '✅ ¡Link copiado!';
            setTimeout(() => copyFeedback.classList.add('hidden'), 3000);
        }
    });

    function showValidation(msg) {
        validationMsg.textContent = msg;
        validationMsg.classList.remove('hidden');
    }

    function hideValidation() {
        validationMsg.classList.add('hidden');
    }
}

// =============================================
//  7. MÚSICA MP3
// =============================================

function initMusic() {
    const fileInput = document.getElementById('music-file-input');
    const preview = document.getElementById('music-preview');
    const audioEl = document.getElementById('music-audio-preview');
    const fileNameEl = document.getElementById('music-file-name');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('⚠️ El archivo es muy grande. Máximo 10MB.');
            return;
        }

        state.musicFile = file.name;
        fileNameEl.textContent = `✅ Archivo: ${file.name}`;

        // Preview local
        const url = URL.createObjectURL(file);
        audioEl.src = url;
        preview.classList.remove('hidden');
    });
}

// =============================================
//  8. INICIALIZACIÓN
// =============================================

initPartnerInputs();
initPhotoUpload();
initPhrases();
initMusic();
initGenerate();
