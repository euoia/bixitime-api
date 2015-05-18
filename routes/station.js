var check = require('check-types'),
	Stations = require('../lib/Stations.js');

exports.index = function *() {
	var stationId = this.query['station_id'] || null;

	var whereClause = '',
		params = [];
	if (stationId !== null) {
		whereClause = `
			WHERE id = ?
		`;
		params = [stationId];
	}

	yield this.connection.queryAsync(`
			SELECT
				*
			FROM
				station
			${whereClause}
		`,
		params
	).then(function (results) {
		var stations = results[0];
		this.body = JSON.stringify(stations);
	}.bind(this));
};

exports.nearest = function *() {
	var limit = this.query.limit || 3;
	var lat = parseFloat(this.query.lat);
	var long = parseFloat(this.query.long);

	// Validate the request.
	var errors = [];
	if (check.number(lat) === false) {
		errors.push({
			resource: 'station',
			field: 'lat',
			code: 'missing'
		});
	}

	if (check.number(long) === false) {
		errors.push({
			resource: 'station',
			field: 'long',
			code: 'missing'
		});
	}

	if (errors.length > 0) {
		this.body = {
			message: 'validation failed',
			errors: errors
		};

		this.status = 422;
		return;
	}

	yield this.connection.queryAsync(`
		SELECT * FROM station
	`).then(function (results) {
		var stations = new Stations(results[0]);
		var nearestStations = stations.getNearest(lat, long, limit);
		this.body = nearestStations;
	}.bind(this));
};
