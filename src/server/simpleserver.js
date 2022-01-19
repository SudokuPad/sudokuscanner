const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const {URL} = require('url');
const PortableEvents = require('./portableevents.js');

const SimpleServer = (() => {

	function SimpleServer(opts = {}) {
		PortableEvents.mixin(this);
		SS.bindHandlers(this);
		this.routes = [];
		this.allowedOrigins = [];
		this.httpPort = opts.port ?? SS.DEFAULT_HTTP_PORT
		this.addRoute(opts.routes);
		if(Array.isArray(opts.allowedOrigins)) this.allowedOrigins = opts.allowedOrigins;
	}
	const SS = SimpleServer, P = Object.assign(SimpleServer.prototype, {constructor: SimpleServer});
	SS.DEFAULT_HTTP_PORT = 8080;
	SS.SimpleServer = SimpleServer;
	SS.getArg =  (key, re = '.*') => ((` ${process.argv.join(' ')} `).match(new RegExp(` -(?:${Array.isArray(key) ? key.join('|') : key})\s*=?\s*(${re}) `)) || [])[1];
	SS.loadArgs = argDefs => Object.fromEntries(Object.entries(argDefs).map(([arg, {key, re, map = a=>a, default: def}]) => [arg, map(SS.getArg(key, re)) ?? def]));
	SS.bindHandlers = obj =>
		Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
			.filter(prop => /^handle/.test(prop) && typeof obj[prop] === 'function')
			.forEach(prop => obj[prop] = obj[prop].bind(obj));
	SS.matchRoute = (url, route) => {
		if(Array.isArray(route)) return route.some(route => matchRoute(url, route));
		if(typeof route === 'string') return url.pathname === route;
		if(route instanceof RegExp) return url.pathname.match(route)
		if(typeof route === 'function') return route(url);
	};
	SS.isAllowedOrigin = (request, allowedOrigins) => {
		let originUrl = new URL(request.headers.origin || request.headers.referer || `http://${request.headers.host}` || 'a:a');
		return allowedOrigins.some(origin => originUrl.host.match(origin));
	};
	SS.serveStatic = (filePath, {message, code = 200, headers = {}} = {}) => (url, request, response) => {
		try {
			let stat = fs.statSync(filePath);
			response.writeHead(code, Object.assign({
				'Content-Type': 'text/html; charset=UTF-8',
				'Content-Length': stat.size
			}, headers));
			fs.createReadStream(filePath).pipe(response);
		}
		catch (err) {
			response.writeHead(404);
			response.end();
		}
	};
	SS.serveHTML = ({message = 'Ok', code = 200, html = '', headers = {}} = {}) => (url, request, response) => {
		response.statusCode = code;
		response.statusMessage = message;
		response.writeHead(code, Object.assign({
			'Content-Type': 'text/html; charset=UTF-8',
			'Content-Length': html.length
		}, headers));
		response.end(html);
	};
	SS.serveHTTPError = ({message = '', code = 500, html} = {}) => SS.serveHTML({
		message,
		code,
		html: html || `<html>
			<head><title>${message}</title></head>
			<body><h1>${message}</h1></body>
			</html>`
		});
	SS.serveError404 = () => SS.serveHTTPError({
		message: 'Not Found',
		code: 404,
		html: `<html>
				<head>
					<link rel="alternate" href="android-app://com.svencodes.sudokupad/https/sudokupad.svencodes.com/puzzle/" />
					<style>
						body {
							font-family: Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;
						}
						#msgNotFound {
							width: 100%;
							display: flex;
							flex-direction: column;
							align-items: center;
							position: relative;
							top: 25%;
							font-size: 24px;
						}
						#msgNotFound table {
							border-collapse: collapse;
						}
						#msgNotFound tr { height: 64px; }
						#msgNotFound td {
							width: 64px;
							border: 1px solid #000;
							text-align: center;
						}
						.cell-value {
							font-size: 3rem;
							color: #1d6ae5;
						}
					</style>
				</head>
				<body>
					<div id="msgNotFound">
						<table class="cell-value">
							<tr><td></td><td></td><td></td></tr>
							<tr><td>4</td><td>0</td><td>4</td></tr>
							<tr><td></td><td></td><td></td></tr>
						</table>
						<p>Sorry, this page was not found!</p>
					</div>
				</body>
			</html>`
		});
	SS.pathToContentType = pathname => {
		let ext = (pathname.match(/\.([a-z]+)$/) || [])[1];
		switch(ext) {
			case 'js': return 'application/javascript';
			case 'css': return 'text/css';
			case 'jpg':
			case 'jpeg':
			case 'png':
				return `image/${ext}`;
			case 'wasm': return 'application/wasm';
			default: return 'text/html';
		}
	};
	SS.serveStaticPath = (relPath, headers = {}) => (url, request, response) => SS.serveStatic(
			path.join(relPath, url.pathname),
			{headers: Object.assign({'Content-Type': `${SS.pathToContentType(url.pathname)}; charset=UTF-8`}, headers)}
		)(url, request, response);

	P.handleServerRequest = function(request, response) {
		let url = new URL('https://' + request.headers.host + request.url);
		//console.log('pathname:', url.pathname.slice(0, 50));
		return Promise.resolve()
			.then(() => {
				let route = this.routes.find(({route, handler}) => SS.matchRoute(url, route));
				let routeHandler = route !== undefined ? route.handler : SS.serveError404();
				if(!SS.isAllowedOrigin(request, this.allowedOrigins)) {
					routeHandler = SS.serveHTTPError({message: 'Invalid origin', code: 401});
				}
				return Promise.resolve(routeHandler(url, request, response))
			})
			.catch(err => {
				console.error('handleServerRequest > error:', err);
				SS.serveHTTPError(response, {message: 'Unhandled error: ' + err.toString(), code: 500});
			});
	};
	P.handleServerListen = function() {
		let server = this.server;
		console.log('SimpleServer.handleServerListen', server.address().address, server.address().port);
	};
	P.handleServerError = function(err) {
		console.error('SimpleServer.handleServerError:', err);
	};
	P.start = function() {
		const httpServer = this.server = http.createServer(this.handleServerRequest);
		httpServer.on('error', this.handleServerError);
		httpServer.listen(this.httpPort, this.handleServerListen);
	};
	P.addRoute = function(route, handler) {
		if(Array.isArray(route)) {
			route.forEach(route => this.addRoute(route));
		}
		else if(typeof route === 'object' && handler === undefined) {
			this.routes.push(route);
		}
		else if(route !== undefined) {
			this.routes.push({route, handler})
		}
		return this;
	};

	return SS;
})();

if(typeof module != 'undefined') module.exports = SimpleServer;
