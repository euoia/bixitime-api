var
	_ = require('lodash'),
	check = require('check-types');

exports.updates = function *() {
	var startDate = null;
	if (this.query['start_date']) {
		startDate = new Date(this.query['start_date']);
		if (check.date(startDate) === false) {
			this.status = 422;
			this.body = {
				message: 'validation failed',
				errors: [
					{
						resource: 'bike',
						field: 'start_date',
						code: 'invalid'
					}
				]
			};
			return;
		}
	}
	var whereClause = null,
		params = [];
	if (startDate === null) {
		// Just return the updates from the latest poll.
		whereClause = `
			sb.poll_date = (
				SELECT poll_date FROM poll ORDER BY id DESC LIMIT 1
			)
		`;
	} else {
		whereClause = `
			sb.latest_update_time > ?
		`;
		params = [startDate];
	}

	yield this.connection.queryAsync(`
			SELECT
				*
			FROM
				station_bikes_aud sb
			INNER JOIN station s ON s.id = sb.station_id
			WHERE ${whereClause}
		`,
		params
	).then(function (results) {
		var bikeUpdates = _(results[0]).map(function (bikeUpdate) {
			return {
				stationName: bikeUpdate['name'],
				stationLat: bikeUpdate['lat'],
				stationLong: bikeUpdate['long'],
				created: bikeUpdate['created'],
				stationId: bikeUpdate['station_id'],
				latestUpdateTime: bikeUpdate['latest_update_time'],
				bikesBefore: bikeUpdate['bikes_before'],
				bikesAfter: bikeUpdate['bikes_after'],
				emptyDocksBefore: bikeUpdate['empty_docks_before'],
				emptyDocksAfter: bikeUpdate['empty_docks_after']
			};
		});

		this.body = JSON.stringify({
			pollDate: results[0][0]['poll_date'],
			updates: bikeUpdates
		});
	}.bind(this));
};
