// Configuração da API - URL DO SEU BACKEND NO RAILWAY
const API_URL = 'https://bauzil-lab-server-production.up.railway.app';

// Estado da aplicação
let currentProducts = [];
let deleteProductId = null;

// Elementos DOM
const productForm = document.getElementById('productForm');
const productId = document.getElementById('productId');
const nomeInput = document.getElementById('nome');
const precoInput = document.getElementById('preco');
const descricaoInput = document.getElementById('descricao');
const productsTableBody = document.getElementById('productsTableBody');
const productCount = document.getElementById('productCount');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');

// Modais
const deleteModal = document.getElementById('deleteModal');
const messageModal = document.getElementById('messageModal');
const deleteProductName = document.getElementById('deleteProductName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Funções auxiliares
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    } catch (error) {
        return dateString;
    }
}

function showMessage(title, message, isError = false) {
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    const messageHeader = document.getElementById('messageHeader');
    
    messageTitle.innerHTML = isError ? '<i class="fas fa-exclamation-circle"></i> ' + title : '<i class="fas fa-check-circle"></i> ' + title;
    messageText.textContent = message;
    
    if (isError) {
        messageHeader.style.background = '#dc3545';
        messageHeader.style.color = 'white';
    } else {
        messageHeader.style.background = '#28a745';
        messageHeader.style.color = 'white';
    }
    
    messageModal.style.display = 'block';
}

function closeMessageModal() {
    messageModal.style.display = 'none';
}

// CRUD Operations - COMPLETAMENTE AJUSTADO PARA AS ROTAS DO SEU BACKEND
async function loadProducts() {
    try {
        showLoading();
        // Rota GET "/" - lista todos os produtos
        const response = await fetch(`${API_URL}/`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        currentProducts = Array.isArray(data) ? data : [];
        renderProductsTable();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showMessage('Erro', 'Não foi possível carregar os produtos. Verifique se o backend está rodando.', true);
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-database" style="font-size: 48px; color: #dc3545;"></i>
                    <p style="margin-top: 10px;">Erro ao conectar com o backend</p>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">Verifique se o servidor está rodando em ${API_URL}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Tentar novamente
                    </button>
                </td>
            </tr>
        `;
    }
}

function showLoading() {
    productsTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
                <div class="loading">
                    <i class="fas fa-spinner fa-pulse"></i>
                    Carregando produtos...
                </div>
            </td>
        </tr>
    `;
}

function renderProductsTable() {
    if (!currentProducts.length) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #999;"></i>
                    <p style="margin-top: 10px;">Nenhum produto cadastrado</p>
                    <p style="font-size: 12px; color: #999;">Preencha o formulário acima para adicionar produtos</p>
                </td>
            </tr>
        `;
        return;
    }
    
    productsTableBody.innerHTML = currentProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><strong>${escapeHtml(product.nome)}</strong></td>
            <td style="color: #28a745; font-weight: bold;">${formatCurrency(product.preco)}</td>
            <td>${escapeHtml(product.descricao || '-')}</td>
            <td>${formatDate(product.createdAt)}</td>
            <td>${formatDate(product.updatedAt)}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="confirmDelete(${product.id}, '${escapeHtml(product.nome)}')">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    productCount.textContent = currentProducts.length;
}

async function saveProduct(event) {
    event.preventDefault();
    
    const product = {
        nome: nomeInput.value.trim(),
        preco: parseFloat(precoInput.value),
        descricao: descricaoInput.value.trim()
    };
    
    if (!product.nome) {
        showMessage('Erro', 'O nome do produto é obrigatório!', true);
        return;
    }
    
    if (isNaN(product.preco) || product.preco <= 0) {
        showMessage('Erro', 'Informe um preço válido!', true);
        return;
    }
    
    const isEditing = productId.value !== '';
    
    // Rotas corretas baseadas no seu backend
    const url = isEditing ? `${API_URL}/atualizar/${productId.value}` : `${API_URL}/cadastro`;
    const method = 'POST'; // Seu backend usa POST para cadastro e POST para atualizar
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Salvando...';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product)
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${responseText}`);
        }
        
        showMessage('Sucesso', isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        
        resetForm();
        await loadProducts();
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showMessage('Erro', `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o produto. Verifique a conexão com o backend.`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto';
    }
}

async function editProduct(id) {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;
    
    productId.value = product.id;
    nomeInput.value = product.nome;
    precoInput.value = product.preco;
    descricaoInput.value = product.descricao || '';
    
    formTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Produto';
    cancelBtn.style.display = 'inline-block';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Produto';
    
    // Scroll para o formulário
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function confirmDelete(id, nome) {
    deleteProductId = id;
    deleteProductName.textContent = nome;
    deleteModal.style.display = 'block';
}

async function deleteProduct() {
    if (!deleteProductId) return;
    
    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Excluindo...';
        
        // Rota DELETE "/deletar/:id" - conforme seu backend
        const response = await fetch(`${API_URL}/deletar/${deleteProductId}`, {
            method: 'DELETE'
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${responseText}`);
        }
        
        showMessage('Sucesso', 'Produto excluído com sucesso!');
        closeDeleteModal();
        await loadProducts();
        
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showMessage('Erro', 'Não foi possível excluir o produto. Verifique a conexão com o backend.', true);
        closeDeleteModal();
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Excluir';
    }
}

function resetForm() {
    productId.value = '';
    nomeInput.value = '';
    precoInput.value = '';
    descricaoInput.value = '';
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Novo Produto';
    cancelBtn.style.display = 'none';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deleteProductId = null;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
if (productForm) productForm.addEventListener('submit', saveProduct);
if (clearBtn) clearBtn.addEventListener('click', resetForm);
if (cancelBtn) cancelBtn.addEventListener('click', resetForm);
if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteProduct);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Fechar modais ao clicar no X
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
        messageModal.style.display = 'none';
    });
});

const messageCloseBtn = document.getElementById('messageCloseBtn');
if (messageCloseBtn) messageCloseBtn.addEventListener('click', closeMessageModal);

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    if (event.target === messageModal) {
        closeMessageModal();
    }
});

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    // Adicionar atalho para tecla ESC fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDeleteModal();
            closeMessageModal();
        }
    });
});

// Tornar funções globais para acesso no HTML
window.editProduct = editProduct;
window.confirmDelete = confirmDelete;
window.loadProducts = loadProducts;