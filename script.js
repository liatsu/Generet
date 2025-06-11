document.addEventListener('DOMContentLoaded', () => {
    // Seleksi elemen UI
    const apiKeyInput = document.getElementById('apiKey');
    const promptInput = document.getElementById('prompt');
    const ratioSelect = document.getElementById('ratio');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const loader = document.getElementById('loader');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');

    // Event listener untuk tombol "Buat Gambar"
    generateBtn.addEventListener('click', handleGeneration);

    // Event listener untuk tombol "Unduh Gambar"
    downloadBtn.addEventListener('click', downloadImage);

    async function handleGeneration() {
        const apiKey = apiKeyInput.value.trim();
        const prompt = promptInput.value.trim();

        if (!apiKey || !prompt) {
            alert('Harap isi API Key dan Prompt terlebih dahulu.');
            return;
        }
        
        // Atur UI untuk status loading
        uiSetLoading(true);

        try {
            const generatedText = await callGeminiAPI(apiKey, prompt);
            drawTextOnCanvas(generatedText);
            uiSetLoading(false, true); // Selesai loading, tampilkan hasil
        } catch (error) {
            console.error('Error:', error);
            alert(`Terjadi kesalahan: ${error.message}`);
            uiSetLoading(false, false); // Selesai loading, gagal
        }
    }

    async function callGeminiAPI(apiKey, prompt) {
        // Ini adalah URL dan struktur body sesuai permintaan Anda
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const requestBody = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Ekstrak teks dari respons API
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Tidak ada konten yang dihasilkan oleh API.");
        }
    }

    function drawTextOnCanvas(text) {
        const selectedRatio = ratioSelect.value;
        const baseWidth = 1024; // Resolusi dasar
        let width, height;

        // Atur ukuran canvas berdasarkan rasio
        switch (selectedRatio) {
            case '16:9':
                width = baseWidth;
                height = baseWidth * 9 / 16;
                break;
            case '9:16':
                width = baseWidth * 9 / 16;
                height = baseWidth;
                break;
            case '1:1':
            default:
                width = baseWidth;
                height = baseWidth;
                break;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Latar belakang gradien gelap
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Pengaturan font
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Logika untuk membungkus teks (wrap text)
        wrapText(ctx, text, width / 2, height / 2, width * 0.8, 50); // Ukuran font 50px
    }
    
    // Fungsi untuk membuat teks bisa turun baris jika terlalu panjang
    function wrapText(context, text, x, y, maxWidth, initialFontSize) {
        let fontSize = initialFontSize;
        context.font = `${fontSize}px Inter`;

        // Kecilkan font jika teks terlalu panjang untuk muat
        while (context.measureText(text).width > maxWidth * (text.split('\n').length > 1 ? 1 : 5) && fontSize > 10) {
            fontSize--;
            context.font = `${fontSize}px Inter`;
        }
        
        const lineHeight = fontSize * 1.2;
        const words = text.split(' ');
        let line = '';
        let lines = [];
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        const startY = y - (lines.length - 1) * lineHeight / 2;
        
        for (let i = 0; i < lines.length; i++) {
            context.fillText(lines[i].trim(), x, startY + i * lineHeight);
        }
    }

    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'github-image-generator.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    function uiSetLoading(isLoading, isSuccess = false) {
        if (isLoading) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Membuat...';
            loader.classList.remove('hidden');
            downloadBtn.classList.add('hidden');
            canvas.style.display = 'none';
        } else {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Buat Gambar';
            loader.classList.add('hidden');
            if (isSuccess) {
                canvas.style.display = 'block';
                downloadBtn.classList.remove('hidden');
            }
        }
    }
});
