const mymap = L.map('sample_map', {zoomControl: false}).setView([40.5432515, -4.0130074], 15);

mymap.on("moveend", onViewChange);

// change icon for location when map is moved
function onViewChange() {
    location_image.src = "assets/location_not_fixed_icon.svg";
}

// change icon for location when location is fixed
function altSetView (coords) {
    setTimeout(() => (location_image.src = "assets/location_icon.svg"), 500);
    mymap.setView(coords, 15);
}

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
  maxZoom: 18
}).addTo(mymap);

// icon for the marker to the alert
const alert_marker_icon = L.icon({
    iconUrl: "assets/alert_marker.png",
    iconSize: [40, 40],
    iconAnchor: [20, 35],
    popupAnchor: [0, -60]
});

var distance_container = document.getElementById("distance_to_marker_container");
var distance_text = document.getElementById("distance_to_marker");

var alert_marker;
// create a marker by clicking on the map
mymap.on('click', function(click_event) {
    alerted = false;  // make sure the alert triggers again
    delete_element(alert_marker);
    alert_marker = new L.marker(click_event.latlng, {icon: alert_marker_icon, draggable: true, autoPan: true}).addTo(mymap);
    alert_marker.on("dragend", () => {
        alerted = false
        update_distance_to_marker();
    });
    alert_marker.on("drag", update_alert_area);
    alert_marker.on("click", () => {
        delete_element(alert_marker);
        delete_element(alert_radius);
        distance_container.style.visibility = "hidden";
    });
    update_alert_area();
    setTimeout(update_distance_to_marker, 100);
})

function update_distance_to_marker() {
    check_distance_to_marker();
    if (distance_to_marker == 10000) {
        distance_container.style.visibility = "hidden";
    } else {
        distance_container.style.visibility = "visible";
        distance_text.textContent = parseInt(distance_to_marker);
    }
}

// check if an element is in the DOM, and if it is remove it
function delete_element(element_to_delete) {
    if (!element_to_delete) {
        return;
    }
    element_to_delete.remove();
}

// when user position changes, call check_location
navigator.geolocation.watchPosition(check_location);

const user_marker_icon = L.icon({
    iconUrl: "assets/user_marker.png",
    iconSize: [40, 40],
    iconAnchor: [20, 35],
    popupAnchor: [0, -60]
});

var user_marker;
var first = true;
// create user marker in user location and move the map there
function check_location(position) {
    if (first) {
    altSetView([position.coords.latitude, position.coords.longitude]);
    first = false;
    }
    var user_position = [position.coords.latitude, position.coords.longitude]
    delete_element(user_marker);
    user_marker = new L.marker(user_position, {icon: user_marker_icon}).addTo(mymap);

    update_distance_to_marker();
}

var alert_radius;
function update_alert_area () {
    delete_element(alert_radius);
    alert_radius = L.circle(alert_marker.getLatLng(), {
        color: "rgba(0, 0, 0, 0)",
        fillColor: '#0fb7ff',
        fillOpacity: 0.2,
        radius: distance_to_alert
    }).addTo(mymap);
}

var distance_to_alert = 500
var alerted = false;
var distance_to_marker;
// check if the user is 100m or less to the marker, if so vibrate the device and alert the user
function check_distance_to_marker() {
    if (!user_marker || !alert_marker) {
        // if there is no marker, get a really high distance to avoid triggering the alert
        distance_to_marker = 10000;
    } else {
        distance_to_marker = user_marker.getLatLng().distanceTo(alert_marker.getLatLng());
    } 

    // if the user is close to the marker, trigger the alert and vibrate, then stop
    if ((distance_to_marker <= distance_to_alert) && !alerted) {
        window.alert("Less than " + distance_to_alert +" meters from marker")
        navigator.vibrate(5000);
        alerted = true;  // make sure the alert doesn´t trigger multiple times
    } else if (distance_to_marker > distance_to_alert) {
        alerted = false;  // when the user moves away from the marker, the alert can be triggered again
    }
}

// settings button to change distance to alert
const settings_button = L.Control.extend({
    // button position
    options: {
        position: "topleft",
    },

    onAdd: function () {
        // create button
        var btn = L.DomUtil.create("button", "image-button");
        var settings_image = L.DomUtil.create("img", "image-content");
        settings_image.src = "assets/settings_icon.svg";
        settings_image.alt = "Settings Button";
        settings_image.style.width = "50px";
        settings_image.style.height = "50px";
        btn.appendChild(settings_image);
        btn.title = "Options";
        btn.setAttribute(
            "style",
            "background-color: transparent; width: 30px; height: 30px; border: none; display: flex; cursor: pointer; justify-content: center; font-size: 2rem;"
        );

        // when clicked, prompt the user to change the location to marker for alerts
        btn.onclick = function(click_event) {
            click_event.stopPropagation();
            var user_prompt = prompt("Insert custom distance to marker: ");
            if (user_prompt == null) {
                return;
            }
            user_prompt = parseFloat(user_prompt);
            if (isNaN(user_prompt)) {
                window.alert("Input must be a number");
            } else if (user_prompt < 100){
                window.alert("Minimum distance is of 100 meters");
            } else if (user_prompt >= 10000) {
                window.alert("Distance must be lower than 10.000 meters");
            } else {
                distance_to_alert = user_prompt;
                update_alert_area();
                setTimeout(check_distance_to_marker, 100);
            }
        };

        return btn;
    },
});

var location_image;
// settings button to change distance to alert
const home_button = L.Control.extend({
    // button position
    options: {
        position: "topleft",
    },

    onAdd: function () {
        // create button
        var btn = L.DomUtil.create("button", "image-button");
        location_image = L.DomUtil.create("img", "image-content");
        location_image.src = "assets/location_icon.svg";
        location_image.alt = "Home Button";
        location_image.style.width = "40px";
        location_image.style.height = "40px";
        btn.appendChild(location_image);
        btn.title = "Options";
        btn.setAttribute(
            "style",
            "background-color: transparent; width: 30px; height: 30px; border: none; display: flex; cursor: pointer; justify-content: center;"
        );

        // when clicked, prompt the user to change the location to marker for alerts
        btn.onclick = function(click_event) {
            click_event.stopPropagation();
            altSetView(user_marker.getLatLng());
        };

        return btn;
    },
});

mymap.addControl(new home_button());
mymap.addControl(new settings_button());

// custom zoom location
L.control.zoom({ position: "bottomleft" }).addTo(mymap);
