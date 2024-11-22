// State management
let currentBuildingType = null;
let buildingPieces = null;
let uniqueResources = new Set();

// DOM Elements
const buildingTypeSelect = document.getElementById('buildingType');
const piecesTable = document.getElementById('piecesTable');
const piecesTableBody = document.getElementById('piecesTableBody');
const summaryTableBody = document.getElementById('summaryTableBody');
const addPieceButton = document.getElementById('addPiece');

// Initialize the application
async function init() {
    try {
        // Load building types
        const response = await fetch('data/building-types.json');
        const data = await response.json();
        
        // Populate building type dropdown
        data.building_types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.key.toLowerCase();
            option.textContent = type.key;
            buildingTypeSelect.appendChild(option);
        });

        // Event listeners
        buildingTypeSelect.addEventListener('change', handleBuildingTypeChange);
        addPieceButton.addEventListener('click', addNewPieceRow);
        
        // Initially disable the add piece button until a building type is selected
        addPieceButton.disabled = true;
    } catch (error) {
        console.error('Failed to initialize:', error);
    }
}

// Handle building type change
async function handleBuildingTypeChange(event) {
    const selectedType = event.target.value;
    if (!selectedType) {
        addPieceButton.disabled = true;
        clearTables();
        return;
    }

    try {
        // Load building pieces data
        const response = await fetch(`data/${selectedType}-building-pieces.json`);
        buildingPieces = await response.json();
        currentBuildingType = selectedType;
        
        // Enable add piece button
        addPieceButton.disabled = false;
        
        // Reset tables
        clearTables();
        
        // Update table headers based on available resources
        updateTableHeaders();
    } catch (error) {
        console.error('Failed to load building pieces:', error);
    }
}

// Update table headers based on available resources
function updateTableHeaders() {
    // Get all unique resources from the building pieces
    uniqueResources = new Set();
    Object.values(buildingPieces.pieces).forEach(piece => {
        Object.keys(piece.resources).forEach(resource => uniqueResources.add(resource));
    });

    // Create header row
    const headerRow = piecesTable.querySelector('thead tr');
    headerRow.innerHTML = `
        <th>Piece Type</th>
        <th>Quantity</th>
        ${Array.from(uniqueResources).map(resource => `<th>${formatResourceName(resource)}</th>`).join('')}
    `;
}

// Add new piece row
function addNewPieceRow() {
    const row = document.createElement('tr');
    
    // Create piece type select
    const pieceSelect = document.createElement('select');
    pieceSelect.className = 'select-styled';
    pieceSelect.innerHTML = `
        <option value="">Select Piece</option>
        ${Object.entries(buildingPieces.pieces)
            .map(([key, piece]) => `<option value="${key}">${piece.name}</option>`)
            .join('')}
    `;

    // Create quantity input
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = '0';
    quantityInput.value = '0';
    quantityInput.className = 'quantity-input';

    // Add cells to row
    row.innerHTML = `
        <td></td>
        <td></td>
        ${Array.from(uniqueResources).map(() => '<td class="resource-amount">0</td>').join('')}
    `;
    
    row.firstElementChild.appendChild(pieceSelect);
    row.children[1].appendChild(quantityInput);

    // Add event listeners
    pieceSelect.addEventListener('change', () => updateRowResources(row));
    quantityInput.addEventListener('input', () => updateRowResources(row));

    // Add delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-icon delete-row';
    deleteButton.innerHTML = '×';
    deleteButton.onclick = () => {
        row.remove();
        updateTotalResources();
    };
    row.appendChild(document.createElement('td')).appendChild(deleteButton);

    piecesTableBody.appendChild(row);
}

// Update resources for a specific row
function updateRowResources(row) {
    const pieceSelect = row.querySelector('select');
    const quantityInput = row.querySelector('input');
    const piece = buildingPieces.pieces[pieceSelect.value];
    const quantity = parseInt(quantityInput.value) || 0;

    // Update resource amounts in the row
    Array.from(uniqueResources).forEach((resource, index) => {
        const amount = piece ? (piece.resources[resource] || 0) * quantity : 0;
        row.querySelectorAll('.resource-amount')[index].textContent = amount;
    });

    updateTotalResources();
}

// Update total resources summary
function updateTotalResources() {
    const totals = {};
    
    // Calculate totals
    Array.from(uniqueResources).forEach(resource => {
        totals[resource] = Array.from(piecesTableBody.querySelectorAll('tr')).reduce((sum, row) => {
            const resourceIndex = Array.from(uniqueResources).indexOf(resource);
            return sum + parseInt(row.querySelectorAll('.resource-amount')[resourceIndex].textContent || 0);
        }, 0);
    });

    // Update summary table
    summaryTableBody.innerHTML = Object.entries(totals)
        .filter(([, amount]) => amount > 0)
        .map(([resource, amount]) => `
            <tr>
                <td>${formatResourceName(resource)}</td>
                <td>${amount}</td>
            </tr>
        `).join('');
}

// Clear all tables
function clearTables() {
    piecesTableBody.innerHTML = '';
    summaryTableBody.innerHTML = '';
}

// Format resource name for display
function formatResourceName(resource) {
    return resource
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Initialize the application
init(); 