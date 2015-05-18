/**
 * A class which stores data about all the stations.
 */
var _ = require('lodash'),
	geolib = require('geolib');

var Stations = module.exports = function (stations) {
	this.stations = stations;
};

/**
 * Get the nearest stations given a latitude and longitude of a point.
 * @param {Float} lat The latitude of the point.
 * @param {Float} long The longitude of the point.
 * @param {Integer} limit The number of stations to return.
 * @returns {Station[]} The nearest stations.
 */
Stations.prototype.getNearest = function(lat, long, limit) {
	return _.chain(this.stations)
		.map(function (station) {
			station.distance = geolib.getDistance(
				{latitude: lat, longitude: long},
				{latitude: station.lat, longitude: station.long}
			);

			return station;
		})
		.sortByOrder('distance', true)
		.take(limit)
		.value();
};
