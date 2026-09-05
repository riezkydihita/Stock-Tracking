        // CONFIG & AUTH STATE
        const ADMIN_PASSWORD_CORRECT = "amgstock"; // Kata sandi khusus login admin
        let isAdminLoggedIn = false;

        // INITIAL DATA STATE
        let categories = JSON.parse(localStorage.getItem('inv_categories')) || [
            'Kertas & Dokumen', 'Alat Tulis', 'Tinta & Toner', 'Peralatan Kantor', 'Elektronik & Baterai'
        ];

        let inventory = JSON.parse(localStorage.getItem('inv_items')) || [
            { id: 1, name: 'Kertas HVS A4 80gr', category: 'Kertas & Dokumen', stock: 12, unit: 'Rim', lastRestock: '2026-08-01 10:30' },
            { id: 2, name: 'Pulpen Gel Hitam 0.5mm', category: 'Alat Tulis', stock: 15, unit: 'Box', lastRestock: '2026-08-05 14:15' },
            { id: 3, name: 'Toner Printer HP LaserJet', category: 'Tinta & Toner', stock: 2, unit: 'Pcs', lastRestock: '2026-07-20 09:00' },
            { id: 4, name: 'Sticky Notes 3x3 Yellow', category: 'Peralatan Kantor', stock: 18, unit: 'Pad', lastRestock: '2026-08-02 11:45' },
            { id: 5, name: 'Baterai AA Alkaline', category: 'Elektronik & Baterai', stock: 4, unit: 'Pack', lastRestock: '2026-07-28 16:20' },
            { id: 6, name: 'Stapler Heavy Duty', category: 'Peralatan Kantor', stock: 8, unit: 'Pcs', lastRestock: '2026-08-06 08:30' }
        ];

        let globalLastRestock = localStorage.getItem('inv_global_last_restock') || '2026-08-06 08:30';

        let withdrawalHistory = JSON.parse(localStorage.getItem('inv_withdrawals')) || [
            { id: 101, date: '2026-08-07', item: 'Pulpen Gel Hitam 0.5mm', qty: 2, name: 'Budi Santoso', dept: 'HRD', note: 'Keperluan Onboarding Staff Baru' },
            { id: 102, date: '2026-08-06', item: 'Kertas HVS A4 80gr', qty: 1, name: 'Siti Rahma', dept: 'Keuangan', note: 'Cetak Laporan Bulanan' }
        ];

        let restockHistory = JSON.parse(localStorage.getItem('inv_restock_history')) || [
            { id: 201, datetime: '2026-08-06 08:30', item: 'Stapler Heavy Duty', qty: 5, note: 'Pembelian Rutin Bulanan' },
            { id: 202, datetime: '2026-08-05 14:15', item: 'Pulpen Gel Hitam 0.5mm', qty: 10, note: 'Restock Gudang Utama' }
        ];

        let selectedCategoryFilter = 'All';

        function saveData() {
            localStorage.setItem('inv_categories', JSON.stringify(categories));
            localStorage.setItem('inv_items', JSON.stringify(inventory));
            localStorage.setItem('inv_withdrawals', JSON.stringify(withdrawalHistory));
            localStorage.setItem('inv_restock_history', JSON.stringify(restockHistory));
            localStorage.setItem('inv_global_last_restock', globalLastRestock);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('user-input-date').value = today;
            
            const now = new Date();
            const localDatetime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            document.getElementById('restock-input-date').value = localDatetime;

            addWithdrawalRow();
            renderAll();
        });

        function renderAll() {
            renderUserCategoryPills();
            renderUserStockGrid();
            renderUserSelectOptions();
            renderUserHistory();
            renderAdminMasterTable();
            renderAdminDashboard();
            renderAdminRestockHistory();
            renderAdminWithdrawalHistory(); // Panggilan Render History Admin Baru
            renderModalCategoryList();
        }

        // --- AUTHENTICATION & VIEW SWITCHER LOGIC ---
        function switchView(view) {
            const userView = document.getElementById('view-user');
            const adminView = document.getElementById('view-admin');
            const btnUser = document.getElementById('btn-view-user');
            const btnAdmin = document.getElementById('btn-view-admin');
            const btnLogout = document.getElementById('btn-logout-admin');

            if (view === 'admin' && !isAdminLoggedIn) {
                document.getElementById('admin-pass-input').value = '';
                document.getElementById('modal-admin-login').classList.remove('hidden');
                return;
            }

            if (view === 'user') {
                userView.classList.remove('hidden');
                adminView.classList.add('hidden');
                btnLogout.classList.add('hidden');
                btnUser.className = "flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white shadow";
                btnAdmin.className = "flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-indigo-200 hover:text-white hover:bg-indigo-800/50";
            } else {
                userView.classList.add('hidden');
                adminView.classList.remove('hidden');
                btnLogout.classList.remove('hidden');
                btnAdmin.className = "flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white shadow";
                btnUser.className = "flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-indigo-200 hover:text-white hover:bg-indigo-800/50";
            }
        }

        function handleAdminLogin(e) {
            e.preventDefault();
            const passInput = document.getElementById('admin-pass-input').value;
            if (passInput === ADMIN_PASSWORD_CORRECT) {
                isAdminLoggedIn = true;
                closeModal('modal-admin-login');
                showToast('Login Admin berhasil!', 'success');
                switchView('admin');
            } else {
                showToast('Kata sandi salah! Akses ditolak.', 'error');
            }
        }

        function adminLogout() {
            isAdminLoggedIn = false;
            switchView('user');
            showToast('Anda telah keluar dari akun Admin', 'info');
        }

        // --- MULTI-ITEM WITHDRAWAL LOGIC ---
        function addWithdrawalRow() {
            const container = document.getElementById('withdrawal-rows-container');
            const rowId = Date.now() + Math.random().toString(36).substr(2, 4);

            let optionsHtml = '<option value="">-- Pilih Barang --</option>';
            inventory.forEach(item => {
                optionsHtml += `<option value="${item.id}">${item.name} (Sisa: ${item.stock} ${item.unit})</option>`;
            });

            const rowElement = document.createElement('div');
            rowElement.className = "withdrawal-row p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative";
            rowElement.dataset.rowId = rowId;

            rowElement.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex-grow">
                        <select onchange="updateRowStockInfo(this)" required class="row-select-item w-full bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500">
                            ${optionsHtml}
                        </select>
                    </div>
                    <button type="button" onclick="removeWithdrawalRow(this)" class="btn-remove-row text-rose-500 hover:text-rose-700 p-2" title="Hapus Barang Ini">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between gap-2">
                    <div class="w-1/2">
                        <input type="number" min="1" required placeholder="Jumlah" class="row-input-qty w-full bg-white border border-slate-300 text-xs sm:text-sm rounded-lg p-2 focus:ring-indigo-500">
                    </div>
                    <div class="w-1/2 text-right">
                        <span class="row-stock-badge hidden text-[11px] font-bold px-2 py-1 rounded-md"></span>
                    </div>
                </div>
            `;

            container.appendChild(rowElement);
            updateRemoveButtonsVisibility();
        }

        function removeWithdrawalRow(button) {
            const container = document.getElementById('withdrawal-rows-container');
            if (container.children.length > 1) {
                button.closest('.withdrawal-row').remove();
                updateRemoveButtonsVisibility();
            } else {
                showToast('Minimal harus memilih 1 barang.', 'info');
            }
        }

        function updateRemoveButtonsVisibility() {
            const rows = document.querySelectorAll('.withdrawal-row');
            rows.forEach(row => {
                const btn = row.querySelector('.btn-remove-row');
                if (rows.length === 1) {
                    btn.classList.add('hidden');
                } else {
                    btn.classList.remove('hidden');
                }
            });
        }

        function updateRowStockInfo(selectElem) {
            const row = selectElem.closest('.withdrawal-row');
            const badge = row.querySelector('.row-stock-badge');
            const itemId = selectElem.value;

            if (!itemId) {
                badge.classList.add('hidden');
                return;
            }

            const item = inventory.find(i => i.id == itemId);
            if (item) {
                badge.classList.remove('hidden');
                badge.innerText = `Sisa Stok: ${item.stock} ${item.unit}`;
                if (item.stock <= 5) {
                    badge.className = "row-stock-badge text-[11px] font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700 border border-rose-200";
                } else {
                    badge.className = "row-stock-badge text-[11px] font-bold px-2 py-1 rounded-md bg-indigo-100 text-indigo-700";
                }
            }
        }

        function handleWithdrawalSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('user-input-name').value;
            const dept = document.getElementById('user-input-dept').value;
            const date = document.getElementById('user-input-date').value;
            const note = document.getElementById('user-input-note').value;

            const rows = document.querySelectorAll('.withdrawal-row');
            const selectedItems = [];

            for (let row of rows) {
                const itemId = row.querySelector('.row-select-item').value;
                const qty = parseInt(row.querySelector('.row-input-qty').value);

                if (!itemId || isNaN(qty) || qty <= 0) {
                    showToast('Pastikan semua barang dan jumlah telah terisi dengan benar!', 'error');
                    return;
                }

                const item = inventory.find(i => i.id == itemId);
                if (!item) continue;

                if (qty > item.stock) {
                    showToast(`Stok "${item.name}" tidak mencukupi! Sisa stok hanya ${item.stock} ${item.unit}.`, 'error');
                    return;
                }

                selectedItems.push({ itemObj: item, qty: qty });
            }

            if (selectedItems.length === 0) return;

            selectedItems.forEach(group => {
                group.itemObj.stock -= group.qty;
                withdrawalHistory.unshift({
                    id: Date.now() + Math.floor(Math.random() * 100),
                    date: date,
                    item: group.itemObj.name,
                    qty: group.qty,
                    name: name,
                    dept: dept,
                    note: note || '-'
                });
            });

            saveData();
            renderAll();

            document.getElementById('form-withdrawal').reset();
            document.getElementById('withdrawal-rows-container').innerHTML = '';
            addWithdrawalRow();

            showToast(`Berhasil mencatat pengambilan ${selectedItems.length} jenis barang!`, 'success');
        }

        // --- USER & CATALOG RENDERERS ---
        function renderUserCategoryPills() {
            const container = document.getElementById('user-category-pills');
            let html = `<button onclick="filterCategory('All')" class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${selectedCategoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Semua</button>`;
            categories.forEach(cat => {
                const isActive = selectedCategoryFilter === cat;
                html += `<button onclick="filterCategory('${cat}')" class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">${cat}</button>`;
            });
            container.innerHTML = html;
        }

        function filterCategory(cat) {
            selectedCategoryFilter = cat;
            renderUserCategoryPills();
            renderUserStockGrid();
        }

        function renderUserStockGrid() {
            const list = document.getElementById('user-stock-list');
            const searchVal = document.getElementById('user-search').value.toLowerCase();

            const filtered = inventory.filter(item => {
                const matchCat = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
                const matchSearch = item.name.toLowerCase().includes(searchVal);
                return matchCat && matchSearch;
            });

            document.getElementById('user-total-items-count').innerText = `Total: ${filtered.length} Item`;

            if (filtered.length === 0) {
                list.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-xs">Tidak ada item barang ditemukan</div>`;
                return;
            }

            list.innerHTML = filtered.map(item => {
                const isLow = item.stock <= 5;
                const badgeClass = isLow ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-emerald-100 text-emerald-800 font-semibold';
                return `
                    <div class="border border-slate-200 bg-slate-50/50 hover:bg-white rounded-xl p-3 transition shadow-sm hover:shadow flex flex-col justify-between">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <span class="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">${item.category}</span>
                                <h4 class="font-bold text-slate-900 text-sm leading-tight">${item.name}</h4>
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-md ${badgeClass} shrink-0">
                                ${item.stock} ${item.unit}
                            </span>
                        </div>
                        <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Last Restock:</span>
                            <span class="font-medium text-slate-700">${item.lastRestock || '-'}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderUserSelectOptions() {
            const selectRestock = document.getElementById('restock-select-item');
            let optionsHtml = '<option value="">-- Pilih Barang --</option>';
            inventory.forEach(item => {
                optionsHtml += `<option value="${item.id}">${item.name} (Stok: ${item.stock} ${item.unit})</option>`;
            });
            selectRestock.innerHTML = optionsHtml;
        }

        function renderUserHistory() {
            const tbody = document.getElementById('table-user-history');
            if (withdrawalHistory.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-3 py-4 text-center text-slate-400">Belum ada data pengambilan stok</td></tr>`;
                return;
            }
            tbody.innerHTML = withdrawalHistory.slice(0, 15).map(row => `
                <tr class="hover:bg-slate-50">
                    <td class="px-3 py-2.5 whitespace-nowrap font-medium text-slate-700">${row.date}</td>
                    <td class="px-3 py-2.5 font-bold text-slate-900">${row.item}</td>
                    <td class="px-3 py-2.5 whitespace-nowrap"><span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">${row.qty}</span></td>
                    <td class="px-3 py-2.5 whitespace-nowrap">${row.name}</td>
                    <td class="px-3 py-2.5 whitespace-nowrap">${row.dept}</td>
                    <td class="px-3 py-2.5 text-slate-500">${row.note}</td>
                </tr>
            `).join('');
        }

        // --- ADMIN RENDERERS ---
        function renderAdminDashboard() {
            document.getElementById('dash-global-last-restock').innerText = globalLastRestock || 'Belum Ada Update';
            const lowStockItems = inventory.filter(i => i.stock <= 5);
            document.getElementById('dash-low-stock-count').innerText = lowStockItems.length;
            const reminderSection = document.getElementById('section-low-stock-reminder');
            const badgesContainer = document.getElementById('container-low-stock-badges');

            if (lowStockItems.length === 0) {
                reminderSection.classList.add('hidden');
                document.getElementById('badge-alert-count').classList.add('hidden');
            } else {
                reminderSection.classList.remove('hidden');
                const alertBadge = document.getElementById('badge-alert-count');
                alertBadge.innerText = lowStockItems.length;
                alertBadge.classList.remove('hidden');
                badgesContainer.innerHTML = lowStockItems.map(item => `
                    <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center space-x-2 text-xs">
                        <span class="font-bold text-white">${item.name}</span>
                        <span class="bg-white text-rose-700 font-extrabold px-2 py-0.5 rounded-md text-[11px]">${item.stock} ${item.unit}</span>
                    </div>
                `).join('');
            }
            const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
            document.getElementById('dash-total-stats').innerText = `${inventory.length} Item / ${totalStock} Unit`;
        }

        function renderAdminMasterTable() {
            const tbody = document.getElementById('table-admin-master');
            const searchVal = document.getElementById('admin-search-item').value.toLowerCase();

            const filtered = inventory.filter(item => 
                item.name.toLowerCase().includes(searchVal) || 
                item.category.toLowerCase().includes(searchVal)
            );

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="px-3 py-6 text-center text-slate-400">Tidak ada item barang dalam master inventory</td></tr>`;
                return;
            }

            tbody.innerHTML = filtered.map(item => {
                const isLow = item.stock <= 5;
                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="px-3 py-3 text-slate-400 font-mono text-[11px]">#${item.id}</td>
                        <td class="px-3 py-3 font-bold text-slate-900">${item.name}</td>
                        <td class="px-3 py-3"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">${item.category}</span></td>
                        <td class="px-3 py-3 text-center">
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${isLow ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800'}">
                                ${item.stock}
                            </span>
                        </td>
                        <td class="px-3 py-3 text-slate-600">${item.unit}</td>
                        <td class="px-3 py-3 font-medium ${item.lastRestock ? 'text-indigo-700 font-semibold' : 'text-slate-400'}">
                            <i class="fa-solid fa-clock text-[10px] mr-1"></i>${item.lastRestock || 'Belum Restock'}
                        </td>
                        <td class="px-3 py-3 text-center space-x-1">
                            <button onclick="quickRestockItem(${item.id})" title="Restock Direct" class="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition">
                                <i class="fa-solid fa-plus-circle"></i>
                            </button>
                            <button onclick="deleteItem(${item.id})" title="Hapus Barang" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // FUNGSI BARU: Logika Perpindahan Tab Admin yang lebih rapi
        function switchAdminTab(tab) {
            const tabs = ['master', 'restock', 'history', 'export'];
            
            tabs.forEach(t => {
                // Sembunyikan semua tab content
                document.getElementById(`admin-tab-content-${t}`).classList.add('hidden');
                
                // Kembalikan semua warna button menjadi tidak aktif
                const btn = document.getElementById(`admin-tab-btn-${t}`);
                btn.className = "px-4 py-2 rounded-xl text-xs font-bold transition text-slate-600 hover:bg-slate-100 flex items-center space-x-1.5";
            });

            // Tampilkan konten dan aktifkan tombol pada tab yg dipilih
            document.getElementById(`admin-tab-content-${tab}`).classList.remove('hidden');
            document.getElementById(`admin-tab-btn-${tab}`).className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-sm flex items-center space-x-1.5";
        }

        // --- FITUR BARU: RENDER ADMIN HISTORY (Kelola Pengambilan) ---
        function renderAdminWithdrawalHistory() {
            const tbody = document.getElementById('table-admin-withdrawal-history');
            if (withdrawalHistory.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="px-3 py-4 text-center text-slate-400">Belum ada riwayat pengambilan</td></tr>`;
                return;
            }

            tbody.innerHTML = withdrawalHistory.map(row => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-3 py-3 whitespace-nowrap text-slate-600 font-medium">${row.date}</td>
                    <td class="px-3 py-3 font-bold text-slate-900">${row.item}</td>
                    <td class="px-3 py-3 text-center"><span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded font-bold">${row.qty}</span></td>
                    <td class="px-3 py-3 whitespace-nowrap">${row.name}</td>
                    <td class="px-3 py-3 whitespace-nowrap">${row.dept}</td>
                    <td class="px-3 py-3 text-slate-500">${row.note}</td>
                    <td class="px-3 py-3 text-center">
                        <button onclick="deleteWithdrawalHistory(${row.id})" title="Hapus Riwayat (Kembalikan Stok)" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function deleteWithdrawalHistory(id) {
            const recordIndex = withdrawalHistory.findIndex(r => r.id == id);
            if (recordIndex === -1) return;

            const record = withdrawalHistory[recordIndex];
            
            if (confirm(`Hapus data pengambilan ini? Sistem akan otomatis mengembalikan +${record.qty} stok barang "${record.item}"`)) {
                // Cari item pada master barang berdasarkan nama
                const item = inventory.find(i => i.name === record.item);
                if (item) {
                    item.stock += record.qty; // Kembalikan stok
                } else {
                    alert(`Perhatian: Barang "${record.item}" tidak ditemukan di master data. Data riwayat akan dihapus namun stok tidak diubah.`);
                }

                // Hapus data riwayat dari Array
                withdrawalHistory.splice(recordIndex, 1);
                
                saveData();
                renderAll();
                showToast('Riwayat dihapus & stok telah diperbarui!', 'success');
            }
        }

        function openAdminAddHistoryModal() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('admin-history-date').value = today;
            
            const selectElem = document.getElementById('admin-history-item');
            let optionsHtml = '<option value="">-- Pilih Barang --</option>';
            inventory.forEach(item => {
                optionsHtml += `<option value="${item.id}">${item.name} (Sisa: ${item.stock} ${item.unit})</option>`;
            });
            selectElem.innerHTML = optionsHtml;
            
            document.getElementById('modal-admin-add-history').classList.remove('hidden');
        }

        function handleAdminAddHistorySubmit(e) {
            e.preventDefault();
            const date = document.getElementById('admin-history-date').value;
            const itemId = document.getElementById('admin-history-item').value;
            const qty = parseInt(document.getElementById('admin-history-qty').value);
            const name = document.getElementById('admin-history-name').value;
            const dept = document.getElementById('admin-history-dept').value;
            const note = document.getElementById('admin-history-note').value;

            const item = inventory.find(i => i.id == itemId);
            if (!item) return;

            if (qty > item.stock) {
                showToast(`Gagal! Sisa stok "${item.name}" hanya ${item.stock} ${item.unit}.`, 'error');
                return;
            }

            // Kurangi Stok
            item.stock -= qty;

            // Tambahkan ke Riwayat
            withdrawalHistory.unshift({
                id: Date.now() + Math.floor(Math.random() * 100),
                date: date,
                item: item.name,
                qty: qty,
                name: name,
                dept: dept,
                note: note || '-'
            });

            saveData();
            renderAll();
            closeModal('modal-admin-add-history');
            showToast(`Data riwayat tersimpan, stok telah disesuaikan!`, 'success');
        }

        function updateRestockItemInfo() {
            const itemId = document.getElementById('restock-select-item').value;
            const preview = document.getElementById('restock-item-preview');
            if (!itemId) {
                preview.classList.add('hidden');
                return;
            }
            const item = inventory.find(i => i.id == itemId);
            if (item) {
                preview.classList.remove('hidden');
                document.getElementById('restock-current-stock').innerText = `${item.stock} ${item.unit}`;
                document.getElementById('restock-last-date').innerText = item.lastRestock || 'Belum Ada';
            }
        }

        function handleDirectRestockSubmit(e) {
            e.preventDefault();
            const itemId = document.getElementById('restock-select-item').value;
            const addQty = parseInt(document.getElementById('restock-input-qty').value);
            const rawDatetime = document.getElementById('restock-input-date').value;
            const note = document.getElementById('restock-input-note').value;

            const item = inventory.find(i => i.id == itemId);
            if (!item) return;

            const formattedDate = rawDatetime.replace('T', ' ');
            item.stock += addQty;
            item.lastRestock = formattedDate;
            globalLastRestock = formattedDate;

            restockHistory.unshift({
                id: Date.now(),
                datetime: formattedDate,
                item: item.name,
                qty: addQty,
                note: note || 'Restock Direct Apps'
            });

            saveData();
            renderAll();
            document.getElementById('form-restock-direct').reset();
            document.getElementById('restock-item-preview').classList.add('hidden');
            showToast(`Restock ${addQty} ${item.unit} ${item.name} berhasil!`, 'success');
        }

        function openRestockModal() { switchAdminTab('restock'); }
        function quickRestockItem(itemId) {
            switchAdminTab('restock');
            document.getElementById('restock-select-item').value = itemId;
            updateRestockItemInfo();
        }

        function renderAdminRestockHistory() {
            const tbody = document.getElementById('table-admin-restock-history');
            if (restockHistory.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="px-3 py-4 text-center text-slate-400">Belum ada history restock barang</td></tr>`;
                return;
            }
            tbody.innerHTML = restockHistory.slice(0, 10).map(row => `
                <tr class="hover:bg-slate-50">
                    <td class="px-3 py-2.5 whitespace-nowrap text-indigo-700 font-semibold">${row.datetime}</td>
                    <td class="px-3 py-2.5 font-bold text-slate-900">${row.item}</td>
                    <td class="px-3 py-2.5 whitespace-nowrap"><span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">+${row.qty}</span></td>
                    <td class="px-3 py-2.5 text-slate-500">${row.note}</td>
                </tr>
            `).join('');
        }

        function openNewItemModal() {
            const selectCat = document.getElementById('modal-item-category');
            selectCat.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
            document.getElementById('modal-new-item').classList.remove('hidden');
        }

        function handleAddNewItemSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('modal-item-name').value;
            const category = document.getElementById('modal-item-category').value;
            const stock = parseInt(document.getElementById('modal-item-stock').value);
            const unit = document.getElementById('modal-item-unit').value;

            const newItem = {
                id: Date.now(),
                name: name,
                category: category,
                stock: stock,
                unit: unit,
                lastRestock: stock > 0 ? new Date().toISOString().slice(0,16).replace('T',' ') : ''
            };

            inventory.push(newItem);
            saveData();
            renderAll();
            closeModal('modal-new-item');
            showToast(`Barang baru "${name}" berhasil ditambahkan!`, 'success');
        }

        function deleteItem(id) {
            const item = inventory.find(i => i.id == id);
            if (!item) return;

            if (confirm(`Hapus item "${item.name}" dari master inventory?`)) {
                inventory = inventory.filter(i => i.id != id);
                saveData();
                renderAll();
                showToast(`Item "${item.name}" telah dihapus!`, 'info');
            }
        }

        function openCategoryModal() {
            renderModalCategoryList();
            document.getElementById('modal-category').classList.remove('hidden');
        }

        function renderModalCategoryList() {
            const list = document.getElementById('modal-category-list');
            list.innerHTML = categories.map(cat => `
                <div class="flex items-center justify-between bg-slate-50 border p-2 rounded-xl text-xs">
                    <span class="font-medium text-slate-700">${cat}</span>
                    <button onclick="deleteCategory('${cat}')" class="text-rose-500 hover:text-rose-700"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        }

        function handleAddCategorySubmit(e) {
            e.preventDefault();
            const input = document.getElementById('modal-cat-name');
            const val = input.value.trim();

            if (val && !categories.includes(val)) {
                categories.push(val);
                saveData();
                renderAll();
                input.value = '';
                showToast(`Kategori "${val}" berhasil ditambahkan!`, 'success');
            }
        }

        function deleteCategory(cat) {
            if (confirm(`Hapus kategori "${cat}"?`)) {
                categories = categories.filter(c => c !== cat);
                saveData();
                renderAll();
                showToast(`Kategori dihapus`, 'info');
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        function exportToExcel(type) {
            let data = [];
            let fileName = '';

            if (type === 'master') {
                fileName = `Master_Inventory_Stock_${new Date().toISOString().slice(0,10)}.xlsx`;
                data = inventory.map(item => ({
                    'ID Item': item.id,
                    'Nama Barang': item.name,
                    'Kategori': item.category,
                    'Sisa Stok': item.stock,
                    'Satuan': item.unit,
                    'Tanggal Terakhir Restock': item.lastRestock || 'Belum Ada'
                }));
            } else if (type === 'withdrawal') {
                fileName = `History_Pengambilan_Stok_${new Date().toISOString().slice(0,10)}.xlsx`;
                data = withdrawalHistory.map(row => ({
                    'ID Transaksi': row.id,
                    'Tanggal Pengambilan': row.date,
                    'Nama Barang': row.item,
                    'Jumlah Taken': row.qty,
                    'Nama Pemohon': row.name,
                    'Divisi/Unit': row.dept,
                    'Keterangan': row.note
                }));
            } else if (type === 'restock') {
                fileName = `History_Restock_${new Date().toISOString().slice(0,10)}.xlsx`;
                data = restockHistory.map(row => ({
                    'ID Restock': row.id,
                    'Waktu/Tanggal': row.datetime,
                    'Nama Barang': row.item,
                    'Jumlah Masuk': row.qty,
                    'Keterangan/Supplier': row.note
                }));
            }

            if (data.length === 0) {
                showToast('Tidak ada data untuk diexport!', 'error');
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Export");
            XLSX.writeFile(workbook, fileName);
            showToast(`File ${fileName} berhasil diunduh!`, 'success');
        }

        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            let bgClass = 'bg-slate-800 text-white';
            let icon = 'fa-circle-info';

            if (type === 'success') {
                bgClass = 'bg-emerald-600 text-white';
                icon = 'fa-circle-check';
            } else if (type === 'error') {
                bgClass = 'bg-rose-600 text-white';
                icon = 'fa-triangle-exclamation';
            }

            toast.className = `${bgClass} p-3.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold pointer-events-auto transition transform duration-300 translate-y-2 opacity-0 max-w-xs`;
            toast.innerHTML = `<i class="fa-solid ${icon} text-sm"></i><span>${message}</span>`;

            container.appendChild(toast);

            setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }
