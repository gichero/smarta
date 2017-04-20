const express = require("express");
const bodyParser = require('body-parser');
const request = require("request-promise");
const pgp = require('pg-promise')();
const config = require('./config');
const Yelp = require('yelp-api-v3');
const Promise = require('bluebird');
var yelp = new Yelp({
  app_id: config.yelp.APPID,
  app_secret: config.yelp.APPSECRET
});
var db = pgp(config.dbconfig);
var current_result_set = [];
var min_rating, search_error;

var app = express();

app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static("public"));


app.get("/", function(req, res, next){
    var stops, routes;
    db.any('select stop_name, route_id, stop_id from stops inner join route_stop using (stop_id)')
        .then((data)=>{
            stops = data.map((element)=>{
                return {name: element.stop_name, route_id: `route_id${element.route_id}`, stop_id: element.stop_id};
            });
            return db.any('select route_long_name, route_id, route_type from routes')
        })
        .then((data)=>{
            routes = data.map((element)=>{
                var t = element.route_type === "3" ? "bus" : "train";
                return {name: element.route_long_name, route_id: `route_id${element.route_id}`, route_type: t};
            });
            res.render('home.hbs', {
                routes: routes,
                stops: stops,
                search_error: search_error
            });
            search_error = {};
        })
        .catch(next);
});

app.post("/search_result", function(req, res, next){
      current_result_set = [];
      var search_term = req.body.search_term;
      var limit = req.body.limit;
      if (req.body.rating !== undefined) {
        min_rating = req.body.rating;
      } else {
        min_rating = 0;
      }
      if (req.body.price === undefined) {
        var price = "1,2,3,4";
      } else {
        var p = parseInt(req.body.price);
        var price = "1";
        price += p > 3 ? ",2,3,4" : (p > 2 ? ",2,3" : (p > 1 ? ",2" : ""));
      }
      if (req.body.time === undefined) {
        var time = 1800;
      } else {
        var time = req.body.time;
      }
      var radius = parseInt(parseInt(time) * 1.38582);
      var viewtype = req.body.viewtype;
      var stop = req.body.stop;
      if (req.body.route === undefined) {
        search_error = {
          check: true,
          message: 'Route must be specified. Please choose a route below.'
        };
        res.redirect('/');
      }
      var route = req.body.route.replace("route_id","");
      var base = 'select distinct on(stop_lat, stop_lon) stop_lat, stop_lon, stop_name from stops inner join route_stop using (stop_id) ';
      var route_query = 'where route_id = $1'
      var stop_query = 'where stop_id = $1';
      if (stop === "all_stops") {
        var dbq = base + route_query;
        var filter_by = route;
      } else {
        var dbq = base + stop_query;
        var filter_by = stop;
      }
      db.any(dbq, filter_by)
        .then((data)=> {
          var checker = data.length;
          var stop_names = [];
          for (var i = 0; i < data.length; i++) {
            var stop_name = data[i].stop_name;
            stop_names.push(stop_name);
            Promise.all([
              i,
              yelp.search({latitude: data[i].stop_lat, longitude: data[i].stop_lon, term: search_term, limit: limit, price: price, radius: radius})
            ])
              .spread((i, data)=> {
                data=JSON.parse(data)
                data["stop_name"]=stop_names[i];
                data.businesses.forEach((element) => {
                  element["stop_name"] = stop_names[i];
                })
                current_result_set.push(data);
                if (current_result_set.length === checker) {
                  if (viewtype === 'map') {
                    res.redirect('/map');
                  } else if (viewtype === 'table') {
                    res.redirect('/table');
                  }
                }
              })
              .catch(next);
          }
        })
        .catch(next);
});

app.get("/map", function(req, res, next){
  var num_flag;
  var centers = [];
  num_flag = true;
  var locations = [];
  var coord = {
    lat: 0,
    lon: 0
  };
  current_result_set.forEach((element)=> {
    centers.push({
      name:
      element.stop_name,
      lat: element.region.center.latitude,
      lon: element.region.center.longitude
    });
    var current = element.businesses.filter((element) => {
      return (element.rating >= parseInt(min_rating));
    });
    locations = locations.concat(current);
    coord.lat += element.region.center.latitude;
    coord.lon += element.region.center.longitude;
  });

  coord.lat = coord.lat/current_result_set.length;
  coord.lon = coord.lon/current_result_set.length;

  locations = locations.map((element) => {
    var html_string = `<img src="${element.image_url}"  style="width:150px;"><br><strong>${element.name.replace("'","&#39;")}</strong><br><a href="${element.url}">Check out on Yelp</a><br><span>Rating: ${element.rating}</span><br><span>Price: ${element.price}`;
    return {
      info: html_string,
      lat: element.coordinates.latitude,
      long: element.coordinates.longitude
    };
  });

  res.render("map.hbs", {
    yelp_locations: locations,
    coord: coord,
    centers: centers,
    num_flag: num_flag
  });
});

app.get("/table", function(req, res, next){
  var rest = [];
  current_result_set.forEach((element)=> {
    var current = element.businesses.map((element) => {
      return {
        name: element.name,
        rating: element.rating,
        price: element.price,
        url: element.url,
        stop_name: element.stop_name
      };
    });
    rest = rest.concat(current);
  });

  res.render("table.hbs", {
    locations: rest
  });
});

app.get("/about", function(req, res, next){
  res.render("about.hbs");
})

app.get("/contact", function(req, res, next){
  res.render("contact_us.hbs");
})

app.listen(9001, function(){
    console.log("listening on 9001");
});
