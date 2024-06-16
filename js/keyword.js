let map;
let service;
let infowindow;
let markers = [];

let pagination;

function initMap() {
  var address = JSON.parse(localStorage.getItem("location"));

  setTimeout(() => {
    searchPlacesWithPlace(address);
  }, 1500);
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.867, lng: 151.206 },
    zoom: 15,
  });
  infowindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);

  const addressInput = document.getElementById("address");
  const autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ["geocode"],
  });

  autocomplete.addListener("place_changed", function () {
    const place = autocomplete.getPlace();

    if (!place.geometry) {
      alert("No details available for input: '" + place.name + "'");
      return;
    }

    searchPlacesWithPlace(place);
  });
}

function searchPlacesWithPlace(place) {
  clearMarkers();

  const centerLocation = place.geometry.location;
  map.setCenter(centerLocation);
  createCenterMarker(centerLocation);

  const radius = calculateRadius(map.getBounds());
  searchNearbyBusinesses(centerLocation, null, radius);
}

function searchPlaces() {
  const addressInput = document.getElementById("address").value;
  if (!addressInput) {
    alert("Entry Address");
    return;
  }
}

function createCenterMarker(location) {
  const centerMarker = new google.maps.Marker({
    map: map,
    position: location,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#F00",
      fillOpacity: 0.4,
      strokeWeight: 0,
    },
  });

  markers.push(centerMarker);
}

function calculateRadius(viewport) {
  var sw = viewport.getSouthWest();
  var ne = viewport.getNorthEast();
  var diagonalDistance =
    google.maps.geometry.spherical.computeDistanceBetween(sw, ne);
  var radius = diagonalDistance / 4;

  var maxRadius = 500;
  return Math.min(radius, maxRadius);
}

function createMarker(place) {
  const marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
  });

  google.maps.event.addListener(marker, "click", function () {
    infowindow.setContent(place.name);
    infowindow.open(map, this);

    document.querySelectorAll(".detail").forEach(function (item) {
      item.classList.remove("highlight");
    });
    const detailDiv = document.getElementById(`place-${place.place_id}`);
    if (detailDiv) {
      const detailsStyle = window.getComputedStyle(
        detailDiv.parentElement
      );
      const isHidden = detailsStyle.display === "none";
      if (isHidden) {
        document
          .querySelectorAll(".details")
          .forEach((div) => (div.style.display = "none"));
        document
          .querySelectorAll(".business-header")
          .forEach((header) => header.classList.remove("active"));

        detailDiv.parentElement.style.display = "block";
        detailDiv.parentElement.previousElementSibling.classList.add(
          "active"
        );
      } else {
        detailDiv.parentElement.style.display = "none";
        detailDiv.parentElement.previousElementSibling.classList.remove(
          "active"
        );
      }
      detailDiv.classList.add("highlight");
    }
  });

  markers.push(marker);
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  document.getElementById("business-list").innerHTML = "";
}

function searchNearbyBusinesses(location) {
  const request = {
    location: location,
    radius: "200",
  };

  service.nearbySearch(request, function (results, status, pag) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // console.log(results);
      const addressInput = document.getElementById("address").value;

      const firstWord = addressInput.split(/\s+/)[0];
      const regex = new RegExp("^" + firstWord, "i");

      const filteredResults = results.filter((result) =>
        regex.test(result.vicinity)
      );

      // console.log(filteredResults);
      // results.forEach(createMarker);
      // displayBusinessList(results, !!pag.hasNextPage);

      filteredResults.forEach(createMarker);
      displayBusinessList(filteredResults, !!pag.hasNextPage);

      pagination = pag;
    }
  });
}
function displayBusinessList(places, append = false) {
  const listDiv = document.getElementById("business-list");
  const addresses = {};

  places.forEach((place) => {
    const cleanedVicinity = place.vicinity.replace(/,\s*套房\s*\d+/, "");
    if (!addresses[cleanedVicinity]) {
      addresses[cleanedVicinity] = [];
    }
    addresses[cleanedVicinity].push(place);
  });

  for (const address in addresses) {
    const countDiv = document.createElement("div");
    countDiv.className = "business-header";

    console.log(addresses[address]);

    countDiv.innerHTML = `<strong>${address}</strong> <br/> Number : ${addresses[address].length}<br>`;
    countDiv.onclick = function () {
      this.classList.toggle("active");
      const details = this.nextElementSibling;
      if (details.style.display === "block") {
        details.style.display = "none";
      } else {
        details.innerHTML = "";
        addresses[address].forEach((place) => {
          const detail = document.createElement("div");
          detail.className = "detail";
          detail.id = `place-${place.place_id}`;
          detail.innerHTML = `
  <strong>${place.name}</strong>
  <div>${getTypeTags(place.types)}</div>
  <div class="status">Status: ${place.business_status}</div>
`;
          details.appendChild(detail);
        });
        details.style.display = "block";
      }
    };
    listDiv.appendChild(countDiv);

    const detailsDiv = document.createElement("div");
    detailsDiv.className = "details";
    countDiv.onclick = function () {
      this.classList.toggle("active");
      detailsDiv.style.display =
        detailsDiv.style.display === "block" ? "none" : "block";
    };
    listDiv.appendChild(detailsDiv);

    addresses[address].forEach((place) => {
      const detail = document.createElement("div");
      detail.className = "detail";
      detail.id = `place-${place.place_id}`;

      detail.innerHTML = `
<strong>${place.name}</strong>
<div>${getTypeTags(place.types)}</div>
<div class="status">Status: ${place.business_status}</div>
`;
      detailsDiv.appendChild(detail);
    });
    listDiv.appendChild(detailsDiv);
  }
}

function getTypeTags(types) {
  if (!types) return '<span class="tag tag-default">UnKnow Type</span>';

  return types
    .map((type) => {
      const className =
        `tag tag-${type}` in colorClasses
          ? `tag tag-${type}`
          : "tag tag-default";
      return `<span class="${className}">${type}</span>`;
    })
    .join(" ");
}

const colorClasses = {
  "tag tag-restaurant": true,
  "tag tag-cafe": true,
  "tag tag-bar": true,
  "tag tag-hotel": true,
  "tag tag-store": true,
  "tag tag-default": true,
};

document.addEventListener("DOMContentLoaded", function () {
  var urlParams = new URLSearchParams(window.location.search);
  var keyword = urlParams.get("keyword"); //

  if (keyword) {
    console.log("Search keyword:", keyword);
    document.getElementById("address").value = keyword;
  }
});