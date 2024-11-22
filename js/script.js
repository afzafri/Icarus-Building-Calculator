function updateRowResources(row, pieceSelect, quantityInput) {
    console.log('Updating resources for:', {
        selectValue: pieceSelect.value,
        quantity: quantityInput.value
    });
    
    // Split the value to get building type and piece key
    const [buildingType, pieceKey] = pieceSelect.value.split(':');
    
    console.log('Parsed values:', {
        buildingType,
        pieceKey
    });
    
    const piece = buildingType && pieceKey ? allBuildingPieces[buildingType].pieces[pieceKey] : null;
    const quantity = parseInt(quantityInput.value) || 0;

    console.log('Found piece:', piece);
    console.log('Quantity:', quantity);

    // Store the resources data on the row
    row.dataset.resources = piece ? JSON.stringify(piece.resources) : '{}';
    row.dataset.quantity = quantity;

    // Update in the correct order
    updateResourceColumns();
    updateTotalResources();
} 
// State management
let buildingPieces = null;
let uniqueResources = new Set();
let allBuildingPieces = {}; // Store all loaded building pieces
let buildingTypes = []; // Store the ordered building types
let buildingPiecesOrder = {}; // Store the order of pieces

// DOM Elements
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
        // Store the building types array to maintain order
        buildingTypes = data.building_types;
        
        // Load all building pieces data at startup
        await Promise.all(buildingTypes.map(async type => {
            const response = await fetch(`data/${type.file}`);
            const pieceData = await response.json();
            allBuildingPieces[type.key] = pieceData;
            // Store the original order of pieces
            buildingPiecesOrder[type.key] = Object.keys(pieceData.pieces);
        }));

        // Enable add piece button immediately since we have all data
        addPieceButton.disabled = false;
        
        // Update table headers with all possible resources
        updateTableHeaders();
        
        // Event listeners
        addPieceButton.addEventListener('click', addNewPieceRow);
    } catch (error) {
        console.error('Failed to initialize:', error);
    }
}

// Update table headers based on available resources
function updateTableHeaders() {
    // Get all unique resources from all building pieces
    uniqueResources = new Set();
    Object.values(allBuildingPieces).forEach(buildingType => {
        Object.values(buildingType.pieces).forEach(piece => {
            Object.keys(piece.resources).forEach(resource => uniqueResources.add(resource));
        });
    });

    // Initialize with basic columns
    const headerRow = piecesTable.querySelector('thead tr');
    headerRow.innerHTML = `
        <th>Piece Type</th>
        <th>Quantity</th>
        <th></th>
    `;

    // Track active resources for dynamic column management
    window.activeResources = new Set();
}

// Add new piece row
function addNewPieceRow() {
    const row = document.createElement('tr');
    
    // Create cells
    const selectCell = document.createElement('td');
    const quantityCell = document.createElement('td');
    const deleteCell = document.createElement('td');
    
    // Create select element
    const pieceSelect = document.createElement('select');
    pieceSelect.className = 'select-styled';
    
    // Add initial option
    let selectOptions = '<option value="">Select Piece</option>';
    
    // Add all building types and pieces
    buildingTypes.forEach(type => {
        const data = allBuildingPieces[type.key];
        selectOptions += `<optgroup label="${data.name}">`;
        buildingPiecesOrder[type.key].forEach(key => {
            const piece = data.pieces[key];
            selectOptions += `<option value="${type.key}:${key}">${piece.name}</option>`;
        });
        selectOptions += '</optgroup>';
    });
    
    pieceSelect.innerHTML = selectOptions;
    selectCell.appendChild(pieceSelect);
    
    // Create quantity input
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = '0';
    quantityInput.value = '0';
    quantityInput.className = 'quantity-input';
    quantityCell.appendChild(quantityInput);
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-icon delete-row';
    deleteButton.innerHTML = '×';
    deleteButton.onclick = () => {
        row.remove();
        updateResourceColumns();
        updateTotalResources();
    };
    deleteCell.appendChild(deleteButton);
    
    // Append cells to row
    row.appendChild(selectCell);
    row.appendChild(quantityCell);
    row.appendChild(deleteCell);
    
    // Append row to table
    piecesTableBody.appendChild(row);
    
    // Initialize Choices
    const choices = new Choices(pieceSelect, {
        searchEnabled: true,
        searchPlaceholderValue: "Search for a piece...",
        placeholder: true,
        placeholderValue: "Select a piece",
        removeItemButton: false,
        searchFields: ['label'],
        position: 'bottom',
        itemSelectText: '',
        shouldSort: false,
        renderChoiceLimit: -1,
        searchResultLimit: 1000,
        loadingText: 'Loading...',
        noResultsText: 'No results found',
        noChoicesText: 'No choices to choose from',
        maxItemCount: -1,
        duplicateItemsAllowed: false
    });

    // Add event listeners
    choices.passedElement.element.addEventListener('change', (e) => {
        console.log('Select changed', e.target.value);
        updateRowResources(row, pieceSelect, quantityInput);
        updateResourceColumns();
    });
    
    quantityInput.addEventListener('input', (e) => {
        console.log('Quantity changed', e.target.value);
        updateRowResources(row, pieceSelect, quantityInput);
        updateTotalResources();
    });

    pieceSelect.addEventListener('click', (e) => {
        console.log('Select clicked', e);
    });
}

// Update resources for a specific row
function updateRowResources(row, pieceSelect, quantityInput) {
    console.log('Updating resources for:', {
        selectValue: pieceSelect.value,
        quantity: quantityInput.value
    });
    
    // Split the value to get building type and piece key
    const [buildingType, pieceKey] = pieceSelect.value.split(':');
    
    console.log('Parsed values:', {
        buildingType,
        pieceKey
    });
    
    const piece = buildingType && pieceKey ? allBuildingPieces[buildingType].pieces[pieceKey] : null;
    const quantity = parseInt(quantityInput.value) || 0;

    console.log('Found piece:', piece);
    console.log('Quantity:', quantity);

    // Store the resources data on the row
    row.dataset.resources = piece ? JSON.stringify(piece.resources) : '{}';
    row.dataset.quantity = quantity;

    // Update in the correct order
    updateResourceColumns();
    updateTotalResources();
}

// Update resource columns based on selected pieces
function updateResourceColumns() {
    const headerRow = piecesTable.querySelector('thead tr');
    const rows = piecesTableBody.querySelectorAll('tr');
    
    // Collect all currently used resources
    const usedResources = new Set();
    rows.forEach(row => {
        if (row.dataset.resources) {
            const resources = JSON.parse(row.dataset.resources);
            Object.keys(resources).forEach(resource => usedResources.add(resource));
        }
    });

    // Update headers
    const resourceHeaders = Array.from(usedResources).map(resource => 
        `<th>${formatResourceName(resource)}</th>`
    ).join('');
    
    headerRow.innerHTML = `
        <th>Piece Type</th>
        <th>Quantity</th>
        ${resourceHeaders}
        <th></th>
    `;

    // Update each row
    rows.forEach(row => {
        const resources = row.dataset.resources ? JSON.parse(row.dataset.resources) : {};
        const quantity = parseInt(row.dataset.quantity) || 0;
        
        // Remove only resource cells, keeping the first two and last cells intact
        const cells = Array.from(row.children);
        cells.slice(2, -1).forEach(cell => cell.remove());
        
        // Add resource cells
        usedResources.forEach(resource => {
            const td = document.createElement('td');
            td.className = 'resource-amount';
            td.textContent = (resources[resource] || 0) * quantity;
            // Insert before the last cell (delete button)
            row.insertBefore(td, row.lastElementChild);
        });
    });

    updateTotalResources();
}

// Update total resources summary
function updateTotalResources() {
    const rows = piecesTableBody.querySelectorAll('tr');
    const totals = {};
    
    // Get current resource columns
    const resourceColumns = Array.from(piecesTable.querySelectorAll('thead th'))
        .slice(2, -1) // Exclude first two columns and last column
        .map(th => th.textContent);
    
    // Calculate totals
    rows.forEach(row => {
        const resourceCells = Array.from(row.querySelectorAll('.resource-amount'));
        resourceCells.forEach((cell, index) => {
            const resourceName = resourceColumns[index];
            const amount = parseInt(cell.textContent) || 0;
            totals[resourceName] = (totals[resourceName] || 0) + amount;
        });
    });

    // Update summary table
    summaryTableBody.innerHTML = Object.entries(totals)
        .filter(([, amount]) => amount > 0)
        .map(([resource, amount]) => `
            <tr>
                <td>${resource}</td>
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

// Add this at the end of your script
console.log('Choices available:', typeof Choices !== 'undefined');
console.log('Choices version:', Choices.version); 