let data = null;
let city = null;
let fileType = 'jpg'; // Default file type


function showHideMaps(idToShow, idToHide) {
    document.getElementById(idToShow).style.display = 'flex';
    document.getElementById(idToHide).style.display = 'none';
}

async function displayMap(year, mapPage, pushState = true) {
    showHideMaps('maps', 'osm');

    const mapDiv = document.getElementById('maps');
    mapDiv.innerHTML = '';
    const mapData = data.find((map) => map.page === mapPage);
    
    // Track loaded images to ensure consistent heights
    let loadedImages = 0;
    const totalImages = mapData.maps.length;
    const images = [];
    
    for(let i = 0; i < mapData.maps.length; i++) {
        const mapUrl = `https://maptime.z8.web.core.windows.net/maps/${city}/${year}/${mapData.maps[i]}.${fileType ?? "jpg"}`;
        const map = mapData.maps[i];
        const img = document.createElement('img');
        img.classList.add('map');
        img.id = `map${i+1}`;
        img.src = mapUrl;
        img.alt =  `Map ${mapData.maps[i]} from ${year}`;
        img.onclick = () => openModal(mapUrl);
        
        // Ensure images maintain aspect ratio and equal heights
        img.style.height = '100%';
        img.style.width = 'auto'; // Let width adjust to maintain aspect ratio
        img.style.flex = 'none'; // Don't allow flex to change size
        img.style.objectFit = 'contain'; // Preserve aspect ratio
        img.style.display = 'block';
        img.style.margin = '0';
        img.style.padding = '0';
        img.style.border = 'none';
        img.style.outline = 'none';
        img.style.boxSizing = 'border-box';
        img.style.maxWidth = 'none';
        img.style.minWidth = '0';
        img.style.float = 'none';
        img.style.position = 'static';
        
        // Wait for image to load to ensure proper sizing
        img.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages && totalImages > 1) {
                // Ensure all images have the same height
                equalizeImageHeights(images);
            }
            
            // Force layout recalculation after image loads
            if (loadedImages === totalImages) {
                ensureConsistentLayout();
            }
        };
        
        images.push(img);
        mapDiv.appendChild(img);
    }
    
    updateNavigationButtonEnabledState();
    
    // Force immediate layout recalculation
    ensureConsistentLayout();
    
    if (pushState) {    
        // Rewrite URL to show current year and page
        const url = new URL(window.location.href);
        url.searchParams.set('year', year);
        url.searchParams.set('page', mapPage);
        window.history.pushState({}, '', url);
    }
}

function ensureConsistentLayout() {
    // Force reflow to ensure consistent layout
    document.body.offsetHeight;
    
    // Ensure navigation buttons maintain consistent positioning
    const mapContainer = document.querySelector('.mapContainer');
    const goSouth = document.getElementById('goSouth');
    
    if (mapContainer && goSouth) {
        // Force style recalculation
        mapContainer.style.display = 'flex';
        goSouth.style.display = 'flex';
        
        // Trigger reflow
        mapContainer.offsetHeight;
        goSouth.offsetHeight;
        
        console.log('Layout recalculated');
    }
}

function equalizeImageHeights(images) {
    if (images.length <= 1) return;
    
    // Get the container height
    const container = document.getElementById('maps');
    const containerHeight = container.clientHeight;
    
    // Set all images to maintain aspect ratio with equal heights
    images.forEach(img => {
        img.style.height = `${containerHeight}px`;
        img.style.width = 'auto'; // Let width adjust to maintain aspect ratio
        img.style.objectFit = 'contain'; // Preserve aspect ratio
        img.style.flex = 'none'; // Don't allow flex to change size
        img.style.display = 'block';
        img.style.margin = '0';
        img.style.padding = '0';
        img.style.border = 'none';
        img.style.outline = 'none';
        img.style.boxSizing = 'border-box';
        img.style.maxWidth = 'none';
        img.style.minWidth = '0';
        img.style.float = 'none';
        img.style.position = 'static';
    });
}

function go(direction) {
    console.log(`Navigation triggered: ${direction}`); // Debug log
    const mapData = data.find((map) => map.page === currentPage);
    if (mapData[direction]) {
        console.log(`Moving from ${currentPage} to ${mapData[direction]}`); // Debug log
        currentPage = mapData[direction];
        if (currentYear === "today") {
            showGoogleMap();
        } else {
            displayMap(currentYear, currentPage);
        }
    } else {
        console.log(`Cannot move ${direction} from ${currentPage}`); // Debug log
    }
}

function updateNavigationButtonEnabledState() {
    const mapData = data.find((map) => map.page === currentPage);
    
    // Use setTimeout to ensure DOM updates are complete before updating button states
    // This fixes mobile-specific timing issues with touch events
    setTimeout(() => {
        const goWestButton = document.getElementById('goWest');
        if (mapData.west === null) {
            goWestButton.classList.add('disabled');
        }  
        else {
            goWestButton.classList.remove('disabled');
        }

        const goNorthButton = document.getElementById('goNorth');
        if (mapData.north === null) {
            goNorthButton.classList.add('disabled');
        }  
        else {
            goNorthButton.classList.remove('disabled');
        }

        const goEastButton = document.getElementById('goEast');
        if (mapData.east === null) {
            goEastButton.classList.add('disabled');
        }  
        else {
            goEastButton.classList.remove('disabled');
        }

        const goSouthButton = document.getElementById('goSouth');
        if (mapData.south === null) {
            goSouthButton.classList.add('disabled');
        }  
        else {
            goSouthButton.classList.remove('disabled');
        }
        
        // Debug: Log south button position
        logSouthButtonPosition();
        
    }, 10); // Small delay to ensure DOM is ready
}

function logSouthButtonPosition() {
    const goSouthButton = document.getElementById('goSouth');
    if (goSouthButton) {
        const rect = goSouthButton.getBoundingClientRect();
        console.log(`South button position - Top: ${rect.top}, Bottom: ${rect.bottom}, Height: ${rect.height}, Width: ${rect.width}`);
        console.log(`South button computed style:`, window.getComputedStyle(goSouthButton));
    }
}

function setYear(year) {
    currentYear = year;
    setTabSelectionClasses(year);
    
    // Force a clean state reset before displaying the new map
    // This helps prevent mobile touch event issues
    const navButtons = ['goNorth', 'goSouth', 'goEast', 'goWest'];
    navButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('disabled');
        }
    });
    
    displayMap(year, currentPage);
    
    // Re-setup navigation events after layout changes to ensure they work properly
    setTimeout(() => {
        setupNavigationButtonEvents();
        logSouthButtonPosition();
    }, 100);
}

function setTabSelectionClasses(year)
{
    // Remove selected class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        tab.classList.remove('selected');
    });
    // Add selected class to the clicked tab
    const selectedTab = document.getElementById(`year-${year}`);
    selectedTab.classList.add('selected');
}

function getQueryStringParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

let mapInstance = null;

function showOSM() {
    currentYear = "today";
    const mapData = data.find((map) => map.page === currentPage);
    showHideMaps('osm', 'maps');
    const osmDiv = document.getElementById('osm');
    // Check if mapInstance is already initialized
    if (mapInstance !== null) {
        mapInstance.remove();
        mapInstance = null;
    }

    mapInstance = L.map(osmDiv); 
    // Add OSM tile layer to the Leaflet map.
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    // Target's GPS coordinates.
    var target = L.latLng(mapData.centre[0], mapData.centre[1]);

    // Set map's center to target with zoom 
    const zoom = mapData.zoom ? mapData.zoom : 14;
    mapInstance.setView(target, zoom);    
    setTabSelectionClasses("today");
}

function showGoogleMap() {
    currentYear = "today";
    const mapData = data.find((map) => map.page === currentPage);
    showHideMaps('osm', 'maps');
    const osmDiv = document.getElementById('osm');
    osmDiv.innerHTML = '';
    
    const zoom = mapData.zoom ? mapData.zoom : 15;
    var iframe = document.createElement('iframe');
    const apiKey = "AIzaSyDSCBBtys1CgjJzyKzGVNoG5koL12WkvoA";
    const googleEmbedUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${mapData.centre[0]},${mapData.centre[1]}&zoom=${zoom}`;

    iframe.src = googleEmbedUrl;
    osmDiv.appendChild(iframe);
    setTabSelectionClasses("today");

    // Rewrite URL to show current year and page
    const url = new URL(window.location.href);
    url.searchParams.set('year', currentYear);
    url.searchParams.set('page', currentPage);
    window.history.pushState({}, '', url);
}

function openModal(src) {
    const modal = document.getElementById('myModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'block';
    modalImg.src = src;
}

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('myModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

function enableImageDragging() {
    const modalImg = document.getElementById('modalImage');
    const modalContent = document.querySelector('.modal-content');

    // Mouse events
    modalImg.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - modalContent.offsetLeft;
        startY = e.pageY - modalContent.offsetTop;
        scrollLeft = modalContent.scrollLeft;
        scrollTop = modalContent.scrollTop;
        modalContent.style.cursor = 'grabbing';
        e.preventDefault(); // Prevent default drag behavior
    });

    modalImg.addEventListener('mouseup', () => {
        isDragging = false;
        modalContent.style.cursor = 'zoom-out';
    });

    modalImg.addEventListener('mouseleave', () => {
        isDragging = false;
        modalContent.style.cursor = 'zoom-out';
    });

    modalImg.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - modalContent.offsetLeft;
        const y = e.pageY - modalContent.offsetTop;
        const walkX = (x - startX) * 1; // Adjust the multiplier for faster/slower panning
        const walkY = (y - startY) * 1; // Adjust the multiplier for faster/slower panning
        modalContent.scrollLeft = scrollLeft - walkX;
        modalContent.scrollTop = scrollTop - walkY;
    });

    // Touch events for mobile
    modalImg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.pageX - modalContent.offsetLeft;
            startY = touch.pageY - modalContent.offsetTop;
            scrollLeft = modalContent.scrollLeft;
            scrollTop = modalContent.scrollTop;
            e.preventDefault();
        }
    });

    modalImg.addEventListener('touchend', () => {
        isDragging = false;
    });

    modalImg.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.pageX - modalContent.offsetLeft;
        const y = touch.pageY - modalContent.offsetTop;
        const walkX = (x - startX) * 1;
        const walkY = (y - startY) * 1;
        modalContent.scrollLeft = scrollLeft - walkX;
        modalContent.scrollTop = scrollTop - walkY;
    });

    modalImg.addEventListener('dragstart', (e) => {
        e.preventDefault(); // Prevent default drag behavior
    });
}

document.addEventListener('DOMContentLoaded', () => {
    enableImageDragging();
    
    // Add explicit touch event handlers for navigation buttons to fix mobile issues
    setupNavigationButtonEvents();
});

function setupNavigationButtonEvents() {
    console.log('Setting up navigation button events'); // Debug log
    const directions = ['north', 'south', 'east', 'west'];
    
    directions.forEach(direction => {
        const button = document.getElementById(`go${direction.charAt(0).toUpperCase() + direction.slice(1)}`);
        if (button) {
            console.log(`Setting up events for ${direction} button`); // Debug log
            
            // Remove any existing inline onclick to prevent conflicts
            button.removeAttribute('onclick');
            
            // Clone the button to remove all existing event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add a unified event handler that works for both touch and click
            const handleNavigation = (e) => {
                console.log(`${direction} button clicked/touched`); // Debug log
                e.preventDefault();
                e.stopPropagation();
                
                if (!newButton.classList.contains('disabled')) {
                    console.log(`${direction} button is enabled, executing navigation`); // Debug log
                    // Add visual feedback for touch
                    newButton.style.backgroundColor = '#d0d0d0';
                    setTimeout(() => {
                        newButton.style.backgroundColor = '';
                    }, 150);
                    
                    go(direction);
                } else {
                    console.log(`${direction} button is disabled`); // Debug log
                }
            };
            
            // Use both touchend and click for maximum compatibility
            newButton.addEventListener('touchend', handleNavigation, { passive: false });
            newButton.addEventListener('click', handleNavigation);
            
            // Prevent default touch behaviors that might interfere
            newButton.addEventListener('touchstart', (e) => {
                console.log(`${direction} button touchstart`); // Debug log
                if (!newButton.classList.contains('disabled')) {
                    e.preventDefault();
                    newButton.style.backgroundColor = '#d0d0d0';
                }
            }, { passive: false });
            
            newButton.addEventListener('touchcancel', (e) => {
                console.log(`${direction} button touchcancel`); // Debug log
                newButton.style.backgroundColor = '';
            });
        } else {
            console.log(`Button not found for direction: ${direction}`); // Debug log
        }
    });
}


addEventListener("popstate", function (e) {
    currentPage = getQueryStringParameter('page');
    currentYear = getQueryStringParameter('year');
    displayMap(currentYear, currentPage, false);
    e.preventDefault();
  });

// Function to load data.json file
async function loadData(cityToLoad, mapfileType = 'jpg') {
    try {
        city = cityToLoad;
        fileType = mapfileType; 
        const response = await fetch(`citycontent/${city}/data.json`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function showInitialMap() {
    setTabSelectionClasses(currentYear);
    if (currentYear === "today") {
        showGoogleMap();
    } else {
        displayMap(currentYear, currentPage);
    }
}

// Handle window resize for mobile orientation changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentYear !== "today") {
            displayMap(currentYear, currentPage, false);
        }
    }, 100); // Reduced timeout for faster response
});

// Function to load data.json file

