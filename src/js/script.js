const BASE_URL =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes";

const provinceSelect = document.getElementById("province");
const municipalitySelect = document.getElementById("municipality");
const fuelTypeSelect = document.getElementById("fuelType");
const openNowCheckbox = document.getElementById("openNow");
const stationList = document.getElementById("stationList");

let provincesData = [];
let municipalitiesData = [];
let fuelTypesData = [];
let stationsData = [];

// Load provinces
async function loadProvinces() {
  try {
    const response = await fetch(`${BASE_URL}/Listados/Provincias/`);
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    provincesData = data.map((province) => ({
      IDProvincia: province.IDPovincia,
      Provincia: province.Provincia,
    }));
    populateSelect(provinceSelect, provincesData, "IDProvincia", "Provincia");
  } catch (error) {
    console.error("Error loading provinces:", error);
  }
}

// Load municipalities according to the selected province
async function loadMunicipalities(provinceId) {
  try {
    municipalitySelect.disabled = true;
    const response = await fetch(
      `${BASE_URL}/Listados/MunicipiosPorProvincia/${provinceId}`
    );
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    municipalitiesData = data.map((municipality) => ({
      IDMunicipio: municipality.IDMunicipio,
      Municipio: municipality.Municipio,
    }));
    populateSelect(
      municipalitySelect,
      municipalitiesData,
      "IDMunicipio",
      "Municipio"
    );
    municipalitySelect.disabled = false;
  } catch (error) {
    console.error("Error loading municipalities:", error);
  }
}

// Load fuel types
async function loadFuelTypes() {
  try {
    const response = await fetch(`${BASE_URL}/Listados/ProductosPetroliferos/`);
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    fuelTypesData = data.map((fuel) => ({
      IDProducto: fuel.IDProducto,
      NombreProducto: fuel.NombreProducto,
    }));
    populateSelect(
      fuelTypeSelect,
      fuelTypesData,
      "IDProducto",
      "NombreProducto"
    );
  } catch (error) {
    console.error("Error loading fuel types:", error);
  }
}

// Put a <select> with data
function populateSelect(selectElement, data, valueKey, textKey) {
  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = item[textKey];
    selectElement.appendChild(option);
  });
}

// Search filtered stations
async function filterStations() {
  const provinceId = provinceSelect.value;
  const municipalityId = municipalitySelect.value;
  const fuelType = fuelTypeSelect.value;
  const openNow = openNowCheckbox.checked;

  if (!provinceId || !municipalityId || !fuelType) {
    stationList.innerHTML = "<li>Please select all filters.</li>";
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/EstacionesTerrestres/FiltroMunicipioProducto/${municipalityId}/${fuelType}`
    );
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    stationsData = data.ListaEESSPrecio || [];
    const filteredStations = stationsData.filter((station) =>
      openNow ? isStationInService(station.Horario) : true
    );
    displayStations(filteredStations);
  } catch (error) {
    console.error("Error fetching stations:", error);
  }
}

// Check if the station is open now
function isStationInService(schedule) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (schedule.includes("L-D: 24H")) return true;

  const daysMap = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };
  const hours = schedule.split(";");

  for (const hour of hours) {
    const [days, timeRange] = hour.split(": ");
    const [startDay, endDay] = days.split("-").map((d) => daysMap[d.trim()]);
    const [start, end] = timeRange
      .split("-")
      .map((t) => t.split(":").reduce((h, m) => h * 60 + Number(m)));

    if (
      ((currentDay >= startDay && currentDay <= endDay) ||
        (endDay < startDay &&
          (currentDay >= startDay || currentDay <= endDay))) &&
      ((currentTime >= start && currentTime <= end) ||
        (end < start && (currentTime >= start || currentTime <= end)))
    ) {
      return true;
    }
  }
  return false;
}

// Show filtered stations
function displayStations(stations) {
  stationList.innerHTML = "";
  if (stations.length === 0) {
    stationList.innerHTML = "<li>No results found.</li>";
    return;
  }

  stations.forEach((station) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <strong>Province:</strong> ${station.Provincia}<br>
      <strong>Municipality:</strong> ${station.Municipio}<br>
      <strong>Sign:</strong> ${station.Rótulo}<br>
      <strong>Address:</strong> ${station.Dirección}<br>
      <strong>Schedule:</strong> ${station.Horario}<br>
      <strong>Price:</strong> ${station.PrecioProducto + " €" || "N/A"}<br>
    `;
    stationList.appendChild(listItem);
  });
}

// Event Listeners
provinceSelect.addEventListener("change", () => {
  if (provinceSelect.value) loadMunicipalities(provinceSelect.value);
});

municipalitySelect.addEventListener("change", () => {
  if (municipalitySelect.value) fuelTypeSelect.disabled = false;
});

fuelTypeSelect.addEventListener("change", filterStations);
openNowCheckbox.addEventListener("change", filterStations);

// Initialize
loadProvinces();
loadFuelTypes();
