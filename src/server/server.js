const mkdirp = require('mkdirp');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const exec = util.promisify(require('child_process').exec);
const {SimpleServer, loadArgs, serveStatic, serveStaticPath} = require('./simpleserver');
const {
	fileExists,
	createMemoryCacher,
	createFileCacher,
	ytUrlToId,
	fetchYTVideo,
	fetchYTVideoUrl,
	fetchYTDuration,
	fetchYTDescription,
	fetchYTVideoInfo,
	cachedFetchYTVideoInfo,
	fetchVideoFrame,
	getVideoLength,
	getVideoFrame,
	convertImage,
	parsePuzzleDataStr,
} = require('./yt_tools');


const cachePath = './cache/';
const puzzlesPath = `${cachePath}puzzles/`;
const videosPath = `${cachePath}videos/`;
const framesPath = `${cachePath}frames/`;
const descriptionsPath = `${cachePath}descriptions/`;
const rePathPrefix = /\.[\/\\](?:[^\/\\]+[\/\\])*/;


let frameExtractExt = '.jpg';
let frameStoreExt = '.jpg';
//TODO: Delete unneeded images

const videoFnToFrameFn = (videoFn, time) => videoFn
	.replace(/ytvideo_([^\.]+)\..*/, `frame_$1${time ? '_' + time : ''}`)
	.replace(rePathPrefix, framesPath);

const cachedParsePuzzleDataStr = createFileCacher(`${puzzlesPath}puzzleindex.json`, key => `${puzzlesPath}${key}.ctc`, parsePuzzleDataStr);

const handle404 = async (url, request, response) => {
	response.writeHead(404).end();
};

const handleFetchVideo = async (url, request, response) => {
	try {
		let videoId = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
		console.log('handleFetchVideo > videoId:', videoId);
		let videoFn = await fetchYTVideo(videoId, videosPath, 360, 'w');
		//console.log('handleFetchVideo > videoFn:', videoFn);
		response.end(JSON.stringify({video: videoFn.replace(rePathPrefix, '')}));
	}
	catch (err) {
		console.error('Error in handleFetchVideo("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handleFetchVideoDescription = async (url, request, response) => {
	try {
		let videoId = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
		console.log('handleFetchVideoDescription > videoId:', videoId);
		let descFn = `${descriptionsPath}desc_${videoId}.description`;
		if(!(await fileExists(descFn))) descFn = await fetchYTDescription(videoId, `${descriptionsPath}desc_${videoId}`);
		let res = await fs.readFile(descFn, 'utf8');
		response.end(JSON.stringify({description: res}));
	}
	catch (err) {
		console.error('Error in handleFetchVideoDescription("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handleExtractFrame = async (url, request, response) => {
	try {
		const reUrlFrame = /^\/[^/]+\/([^\/]*)(?:\/([^\/]*))?/;
		let [videoFn, frameTime = -25] = url.pathname.match(reUrlFrame).slice(1, 3);
		console.log('handleExtractFrame > videoFn/frameTime:', videoFn, frameTime);
		videoFn = `${videosPath}${videoFn}`;
		let sourceExt = frameExtractExt, targetExt = frameStoreExt;
		let frameFn = videoFnToFrameFn(videoFn, frameTime) + sourceExt;
		console.log('handleExtractFrame > videoFn:', videoFn);
		console.log('handleExtractFrame > frameFn:', frameFn);
		frameFn = await getVideoFrame(videoFn, frameFn.replace(rePathPrefix, framesPath), frameTime);
		if(sourceExt !== targetExt) {
			frameFn = await convertImage(frameFn, frameFn.replace(sourceExt, targetExt));
		}
		let frame = frameFn.replace(rePathPrefix, 'frames/');
		response.end(JSON.stringify({frame}));
	}
	catch (err) {
		console.error('Error in handleExtractFrame("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handleFetchVideoInfo = async (url, request, response) => {
	try {
		let videoId = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
		console.log('handleFetchVideoInfo > videoId:', videoId);
		let res = 360, quality = 'w';
		let videoInfo = await cachedFetchYTVideoInfo(videoId, res, quality);
		response.end(JSON.stringify(videoInfo));
	}
	catch (err) {
		console.error('Error in handleFetchVideoInfo("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handleFetchVideoFrame = async (url, request, response) => {
	try {
		const reUrlFrame = /^\/[^/]+\/([^\/]*)(?:\/([^\/]*))?/;
		let [videoId, frameTime = -25] = url.pathname.match(reUrlFrame).slice(1, 3);
		console.log('handleFetchVideoFrame > videoId/frameTime:', videoId, frameTime);
		let sourceExt = frameExtractExt, targetExt = frameStoreExt;
		let frameFn = `${framesPath}frame_${videoId}${frameTime ? '_' + frameTime : ''}${sourceExt}`;
		frameFn = await fetchVideoFrame(videoId, frameFn, frameTime);
		if(sourceExt !== targetExt) {
			frameFn = await convertImage(frameFn, frameFn.replace(sourceExt, targetExt));
		}
		let frame = frameFn.replace(rePathPrefix, 'frames/');
		console.log('handleFetchVideoFrame > frame:', frame);
		response.end(JSON.stringify({frame}));
	}
	catch (err) {
		console.error('Error in handleFetchVideoFrame("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handleTestMultiFrame = async (url, request, response) => {
	try {
		let videoId = '3l6GeE36LP4';
		let videoUrl = 'https://rr2---sn-q5u5nugx5h-ha5s.googlevideo.com/videoplayback?expire=1642023795&ei=E_feYbTYM43sW5Okm7gM&ip=46.11.93.147&id=o-ANHo0Qhx6EBZoEao5dSDoZjdPiHztjz9ATXcw1wzWc7j&itag=134&source=youtube&requiressl=yes&mh=JH&mm=31%2C29&mn=sn-q5u5nugx5h-ha5s%2Csn-hpa7znz6&ms=au%2Crdu&mv=m&mvi=2&pcm2cms=yes&pl=24&initcwndbps=738750&vprv=1&mime=video%2Fmp4&gir=yes&clen=305751540&otfp=1&dur=14185.133&lmt=1641535639624147&mt=1642001835&fvip=3&keepalive=yes&fexp=24001373%2C24007246&beids=24152032&c=ANDROID&txp=7216222&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cvprv%2Cmime%2Cgir%2Cclen%2Cotfp%2Cdur%2Clmt&sig=AOq0QJ8wRQIhAMN65NAHkdZKl5XuQN5esVnS6GCJwtbM68YL0KzMSj-bAiAPbmeSc7t14gboSkSggkEB2JNcvpAO-YOfRwDa0sZdmw%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpcm2cms%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRgIhANCMJv2dfE3GM7QPHBU4jNyvL-GZbtf7vMwekMmQRmToAiEAmo0eq176jnC-Yv8MCmXHuwkFNZXaxgayba1otOgjlqw%3D';
		let cmd, res;
		const fetchFrame = async time => {
			let frameFn = `frame_${videoId}_${String(time).padStart(4, '0')}.jpg`;
			let cmd = `time ffmpeg -y -skip_frame nokey -ss ${time} -i "${videoUrl}" -frames:v 1 -q:v 1 "${frameFn}"`;
			console.log('fetching:', frameFn);
			console.time(frameFn);
			let {stdout} = await exec(cmd);
			console.timeEnd(frameFn);
			console.log(stdout);
		};
		console.time('Promise.all');
		await Promise.all([...Array(40).keys()].map(n => fetchFrame(n * 5 * 60)))
		console.timeEnd('Promise.all');
		/*
		for(var i = 0; i < 20; i++) {
			let time = i * 5 * 60, frameFn = `frame_${videoId}_${String(time).padStart(4, '0')}.jpg`;
			let cmd = `time ffmpeg -y -skip_frame nokey -ss ${time} -i "${videoUrl}" -frames:v 1 -q:v 1 "${frameFn}"`;
			console.log('  cmd:', cmd);
			console.time(frameFn);
			let {stdout} = await exec(cmd);
			console.timeEnd(frameFn);
			console.log(stdout);
		}
		*/
		response.end(JSON.stringify({}));
	}
	catch (err) {
		console.error('Error in handleTestMultiFrame("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handlePuzzle = async (url, request, response) => {
	try {
		let uriStr = decodeURIComponent((url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1]);
		try {
			let puzzle = await cachedParsePuzzleDataStr(uriStr);
			response.end(JSON.stringify({puzzle}));
		} catch (error) {
			response.end(JSON.stringify({error}));
		}
	}
	catch (err) {
		console.error('Error in handlePuzzle("%s"):', url, err);
		response.writeHead(500).end(err);
	}
};

const handleCTCProxy = async (url, request, response) => {
	try {
		let ctcHost = 'https://app.crackingthecryptic.com/';
		let name = (url.pathname.match(/^\/[^/]+\/(.*)/) || [])[1];
		console.log('handleCTCProxy:', name);
		let res = await fetch(`${ctcHost}${name}`);
		let text = await res.text();
		response.end(text);
	}
	catch (err) {
		console.error('Error in handleCTCProxy:', err);
		response.writeHead(500).end(err);
		throw err;
	}
};


let routes = [
	{route: /^\/testmultiframe\/(.*)/, handler: handleTestMultiFrame},
	{route: '/favicon.ico', handler: handle404},
	{route: /^\/fetchvideo\/(.*)/, handler: handleFetchVideo},
	{route: /^\/fetchvideodescription\/(.*)/, handler: handleFetchVideoDescription},
	{route: /^\/extractframe\/(.*)/, handler: handleExtractFrame},
	{route: /^\/fetchvideoframe\/(.*)/, handler: handleFetchVideoFrame},
	{route: /^\/fetchvideoinfo\/(.*)/, handler: handleFetchVideoInfo},
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
