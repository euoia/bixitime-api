var
	Bluebird = require('bluebird'),
	cors = require('koa-cors'),
	dbConfig = require('./config.json').database,
	log = require('winston'),
	bixiTimeLogging = require('bixitime-lib-logging'),
	mysql = require('mysql'),
	querystring = require('querystring'),
	requireDir = require('require-dir'),
	routes = requireDir('./routes');

// Application configuration.
var appPort = process.env.BIXI_API_PORT || 3011;

// Configure database conncetion and logging.
Bluebird.promisifyAll(require('mysql/lib/Connection').prototype);
Bluebird.promisifyAll(require('mysql/lib/Pool').prototype);
Bluebird.promisifyAll(mysql);

var connection = mysql.createConnection(dbConfig);
bixiTimeLogging.configureWinston(connection);

// Configure koa.
var koa = require('koa');
var app = koa();
app.use(cors());

var routes = {
	'/station': routes.station.index,
	'/station/nearest': routes.station.nearest,
	'/bike/updates': routes.bike.updates
};

// Pass through IP address from apache reverse proxy.
app.proxy = true;

app.use(function *(next) {
	this.connection = connection;
	yield next;
});

app.use(function *(next) {
	this.query = querystring.parse(this.querystring);
	yield next;
});

app.use(function *(next) {
	log.info(`Received request from ${this.ip} for ${this.path} ${this.querystring}`);
	yield next;
});

// Handle requests.
app.use(function *() {
	var route = routes[this.path];
	if (route === undefined) {
		this.status = 404;
		return;
	}

	yield route.call(this);
});

app.listen(appPort);
console.log('Starting listening on port ' + appPort);
