
//map setup
var map;

function initMap() {

	var av_lat = 0;
	var av_lon = 0;
	if (stops !== undefined) {
		stops.forEach((element)=>{
			av_lat += element.lat;
			av_lon += element.lon;
		});
		av_lat = av_lat/stops.length;
		av_lon = av_lon/stops.length;
	}

	if (center !== undefined) {
		av_lat = center.lat;
		av_lon = center.lon;
	}

	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 13,
		center: new google.maps.LatLng(av_lat, av_lon),
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


	if (stops) {
		for (var i = 0; i< stops.length; i++) {
			var center_marker = new google.maps.Marker({
				position: new google.maps.LatLng(stops[i].lat,stops[i].lon),
				map: map
			});

			center_marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
		}
	}

	if (center) {
		var center_marker = new google.maps.Marker({
			position: new google.maps.LatLng(center.lat,center.lon),
			map: map
		});

		center_marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
	}


}
