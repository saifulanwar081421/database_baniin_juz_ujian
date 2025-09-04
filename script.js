
// URL Web App - GANTI_DENGAN_URL_DEPLOYMENT_ANDA
const scriptURL = "https://script.google.com/macros/s/AKfycbz3_JWNhB_cMMbKao-jTI8GZe2eqHM_2rgJwfEtmJ8W7qntykRAc3QVYl4OdshnRUnrqw/exec";

// Variabel global
let selectedJuz = [];
let loadingElement = null;
let submitBtn = null;
let sheetSelector = null;

// Fungsi untuk memuat daftar sheet
async function loadSheets() {
    try {
        const response = await fetch(`${scriptURL}?action=getSheets`);
        const result = await response.json();
        
        if (result.result === "success" && result.sheets) {
            sheetSelector.innerHTML = '<option value="">Pilih Sheet</option>';
            result.sheets.forEach(sheet => {
                const option = document.createElement('option');
                option.value = sheet.name;
                option.textContent = sheet.name;
                sheetSelector.appendChild(option);
            });
        } else {
            sheetSelector.innerHTML = '<option value="">Error loading sheets</option>';
        }
    } catch (error) {
        console.error('Error loading sheets:', error);
        sheetSelector.innerHTML = '<option value="">Error loading sheets</option>';
    }
}


// Fungsi untuk mengirim data ke Google Sheets
async function simpanData() {
    const selectedSheet = sheetSelector.value;
    const nama = document.getElementById('nama').value;
    const kelas = document.getElementById('kelas').value;
    const selectedJuzValues = Array.from(document.querySelectorAll('.juz-checkbox input:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (!selectedSheet) {
        alert('Silakan pilih sheet terlebih dahulu!');
        return;
    }
    
    if (!nama) {
        alert('Nama santri harus diisi!');
        return;
    }

    if (!kelas) {
        alert('Kelas harus dipilih!');
        return;
    }
    
    if (selectedJuzValues.length === 0) {
        alert('Pilih minimal satu juz!');
        return;
    }
    
    // Tampilkan loading
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // Siapkan data untuk spreadsheet
    const rowData = [
        "", // No. akan diisi otomatis oleh spreadsheet
        nama,
        kelas,
        selectedJuzValues.length
    ];
    
    // Tambahkan data untuk setiap juz (1 = terpilih, kosong = tidak terpilih)
    for (let i = 1; i <= 30; i++) {
        rowData.push(selectedJuzValues.includes(i) ? 1 : "");
    }
    
    const data = {
        sheetName: selectedSheet,
        data: rowData
    };
    
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.result === "success") {
            alert(`Data berhasil disimpan ke sheet ${selectedSheet}!`);
            document.getElementById('nama').value = '';
            document.getElementById('kelas').value = '';
            
            // Reset checkbox
            document.querySelectorAll('.juz-checkbox input:checked').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Update tampilan
            selectedJuz = [];
            updateResult();
        } else {
            alert('Error: ' + result.message);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan data. Pastikan Apps Script sudah di-deploy dengan benar.');
    } finally {
        // Sembunyikan loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
}

// Fungsi untuk memperbarui tampilan hasil
function updateResult() {
    // Update nama output
    const nama = document.getElementById('nama').value.trim() || '-';
    document.getElementById('nama-output').textContent = `Nama: ${nama}`;
    
    // Update kelas output
    const kelas = document.getElementById('kelas').value || '-';
    document.getElementById('kelas-output').textContent = `Kelas: ${kelas}`;
    
    // Update juz output
    if (selectedJuz.length > 0) {
        document.getElementById('juz-output').textContent = selectedJuz.join(', ');
    } else {
        document.getElementById('juz-output').textContent = '-';
    }
    
    // Update total juz
    document.getElementById('total-juz').textContent = selectedJuz.length;
    
    // Update selected juz badges
    const selectedJuzContainer = document.getElementById('selected-juz');
    selectedJuzContainer.innerHTML = '';
    selectedJuz.forEach(juz => {
        const badge = document.createElement('span');
        badge.className = 'juz-badge';
        badge.textContent = `Juz ${juz}`;
        selectedJuzContainer.appendChild(badge);
    });
}

// Fungsi untuk menangani perubahan checkbox juz
function updateSelectedJuz(e) {
    const juzValue = parseInt(e.target.value);
    
    if (e.target.checked) {
        // Add to selected juz if not already present
        if (!selectedJuz.includes(juzValue)) {
            selectedJuz.push(juzValue);
        }
    } else {
        // Remove from selected juz
        selectedJuz = selectedJuz.filter(j => j !== juzValue);
    }
    
    // Sort selected juz in descending order
    selectedJuz.sort((a, b) => b - a);
    
    updateResult();
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    const juzContainer = document.getElementById('juz-container');
    const namaInput = document.getElementById('nama');
    const kelasInput = document.getElementById('kelas');
    submitBtn = document.getElementById('submit-btn');
    loadingElement = document.getElementById('loading');
    sheetSelector = document.getElementById('sheet-selector');
    
    // Generate juz checkboxes (1-30)
    for (let i = 1; i <= 30; i++) {
        const juzCheckbox = document.createElement('div');
        juzCheckbox.className = 'juz-checkbox';
        juzCheckbox.innerHTML = `
            <input type="checkbox" id="juz-${i}" value="${i}">
            <label for="juz-${i}">Juz ${i}</label>
        `;
        juzContainer.appendChild(juzCheckbox);
        
        // Add event listener to each checkbox
        const checkbox = juzCheckbox.querySelector('input');
        checkbox.addEventListener('change', updateSelectedJuz);
    }
    
    // Add event listener to nama input
    namaInput.addEventListener('input', updateResult);

    // Add event listener to kelas input
    kelasInput.addEventListener('change', updateResult);
    
    // Add event listener to submit button
    submitBtn.addEventListener('click', simpanData);
    
    // Pastikan loading element disembunyikan saat pertama kali load
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Muat daftar sheet
    loadSheets();

});


