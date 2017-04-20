
//map setup
var map;

function initMap() {

	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 13,
		center: new google.maps.LatLng(center.lat, center.lon),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false
	});

	var styles = {
			 default: null,
			 hide: [
				 {
					 featureType: 'poi',
					 stylers: [{visibility: 'off'}]
				 }
			 ]
		 };

	map.setOptions({styles: styles['hide']});

	var infowindow = new google.maps.InfoWindow({});

	var marker, i;

	for (i = 0; i < locations.length; i++) {
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(locations[i][1], locations[i][2]),
			map: map
		});

		google.maps.event.addListener(marker, 'click', (function (marker, i) {
			return function () {
				map.setCenter(marker.getPosition());
				infowindow.setContent(locations[i][0]);
				infowindow.open(map, marker);
			}
		})(marker, i));
	}


	var stop_marker, i;
	if (stops) {
		for (i = 0; i < stops.length; i++) {
			stop_marker = new google.maps.Marker({
				position: new google.maps.LatLng(stops[i].lat,stops[i].lon),
				map: map
			});

			stop_marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')


			google.maps.event.addListener(stop_marker, 'click', (function (stop_marker, i) {
				return function () {
					map.setCenter(stop_marker.getPosition());
					infowindow.setContent("<p>"+stops[i].name+"</p>");
					infowindow.open(map, stop_marker);
				}
			})(stop_marker, i));
		}
	}
}
