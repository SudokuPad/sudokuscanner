const mkdirp = require('mkdirp');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const {SimpleServer, loadArgs, serveStatic, serveStaticPath} = require('./simpleserver');
const {
	createDataCacher,
	ytUrlToId,
	fetchYTVideo,
	fetchYTDescription,
	getVideoLength,
	getVideoFrame,
	parsePuzzleDataStr,
} = require('./yt_tools');


const cachePath = './cache/';
const puzzlesPath = `${cachePath}puzzles/`;
const videosPath = `${cachePath}videos/`;
const framesPath = `${cachePath}frames/`;
const descriptionsPath = `${cachePath}descriptions/`;

const videoFnToFrameFn = (videoFn, time) => videoFn
	.replace(/ytvideo_([^\.]+)\..*/, `frame_$1${time ? '_' + time : ''}`)
	.replace(videosPath, framesPath);

const cachedParsePuzzleDataStr = createDataCacher(`${puzzlesPath}puzzleindex.json`, key => `${puzzlesPath}${key}.ctc`, parsePuzzleDataStr);


const handle404 = async (url, request, response) => {
	response.writeHead(404).end();
};

const handleFetchVideo = async (url, request, response) => {
	let videoId = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
	console.log('handleFetchVideo:', videoId);
	console.time('handleFetchVideo');
	let videoFn = await fetchYTVideo(videoId, videosPath, 360, 'w');
	console.log('videoFn:', videoFn);
	console.timeEnd('handleFetchVideo');
	response.end(JSON.stringify({video: videoFn.replace(videosPath, '')}));
};

const handleFetchVideoDescription = async (url, request, response) => {
	console.time('handleFetchVideoDescription');
	let videoId = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
	console.log('handleFetchVideoDescription:', videoId);
	let descFn = `${descriptionsPath}desc_${videoId}.description`;
	let stat;
	try {
		stat = await fs.stat(descFn);
	}
	catch (err) {
		descFn = await fetchYTDescription(videoId, `${descriptionsPath}desc_${videoId}`);
	}
	let res = await fs.readFile(descFn, 'utf8');
	console.timeEnd('handleFetchVideoDescription');
	response.end(JSON.stringify({description: res}));
};

const handleExtractFrame = async (url, request, response) => {
	console.time('handleExtractFrame');
	const reUrlFrame = /^\/[^/]+\/([^\/]*)(?:\/([^\/]*))?/;
	console.log('pathname:', url.pathname);
	let [videoFn, frameTime = -25] = url.pathname.match(reUrlFrame).slice(1, 3);
	videoFn = `${videosPath}${videoFn}`;
	let frameFn = videoFnToFrameFn(videoFn, frameTime) + '.jpg';
	console.log('handleExtractFrame:', frameFn);
	frameFn = await getVideoFrame(videoFn, frameFn.replace(videosPath, framesPath), frameTime);
	console.timeEnd('handleExtractFrame');
	response.end(JSON.stringify({frame: frameFn.replace(framesPath, 'frames/')}));
};

const handlePuzzle = async (url, request, response) => {
	let uriStr = decodeURIComponent((url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1]);
	try {
		let puzzle = await cachedParsePuzzleDataStr(uriStr);
		response.end(JSON.stringify({puzzle}));
	}
	catch(err) {
		console.error(err.message);
		response.end(JSON.stringify({error: err}));
	}
};

const handleCTCProxy = async (url, request, response) => {
	let ctcHost = 'http://localhost:5000/';
	let name = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
	console.log('handleCTCProxy:', name);
	let res = await fetch(`${ctcHost}${name}`);
	let text = await res.text();
	response.end(text);
};


let routes = [
	{route: '/favicon.ico', handler: handle404},
	{route: /^\/fetchvideo\/(.*)/, handler: handleFetchVideo},
	{route: /^\/fetchvideodescription\/(.*)/, handler: handleFetchVideoDescription},
	{route: /^\/extractframe\/(.*)/, handler: handleExtractFrame},
	{route: /^\/puzzle\/(.*)/, handler: handlePuzzle},
	{route: /^\/frames\/(.*)/, handler: serveStaticPath(`${cachePath}`)},
	{route: /^\/ctc\/(.*)/, handler: handleCTCProxy},
	{route: '/', handler: serveStatic('./src/www/index.html')},
	{route: /^\/(.+)/, handler: serveStaticPath('./src/www/')},
];
let args = loadArgs({
	port: {key: 'p|port', re: '[0-9]+', default: 8080},
});
let serverOpts = Object.assign(
	{
		routes: routes,
		allowedOrigins: [
			`localhost:${args.port}`
		]
	},
	loadArgs({
		port: {key: 'p|port', re: '[0-9]+', default: 8080},
	})
);

mkdirp.sync(puzzlesPath);
mkdirp.sync(videosPath);
mkdirp.sync(framesPath);
mkdirp.sync(descriptionsPath);

let server = new SimpleServer(serverOpts);
server.addRoute();
server.start();
