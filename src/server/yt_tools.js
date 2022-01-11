const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const fetch = require('node-fetch');
const PuzzleZipper = require('./puzzlezipper.js');
const PuzzleTools = require('./puzzletools.js');
const {md5Digest, loadFPuzzle} = require('./fpuzzlesdecoder.js');


const createDataCacher = (indexFile, getDataFilename, getData) => async key => {
	let index;
	let keyHash = md5Digest(key);
	try {
		index = JSON.parse(await fs.readFile(indexFile));
	}
	catch(err) {
		index = {};
	}
	if(index[keyHash] !== undefined) {
		let indexItem = (index[keyHash] || {});
		if(indexItem.error) throw new Error(indexItem.error);
		dataHash = indexItem.hash;
		return await fs.readFile(getDataFilename(dataHash), {encoding: 'utf8'});
	}
	else {
		try {
			let data = await getData(key);
			let dataHash = md5Digest(data);
			await fs.writeFile(getDataFilename(dataHash), data, {encoding: 'utf8'});
			index[keyHash] = {hash: dataHash};
			await fs.writeFile(indexFile, JSON.stringify(index, null, '\t'), {encoding: 'utf8'});
			return data;
		}
		catch(err) {
			console.error('Error creating data for cache:', err);
			index[keyHash] = {error: err.toString()};
			await fs.writeFile(indexFile, JSON.stringify(index, null, '\t'), {encoding: 'utf8'});
			throw err;
		}
	}
};

const reYTUrl = /^(?:https?:\/\/)?(?:(?:www|m)\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((?:\w|-){11})(?:\S+)?$/;
const ytUrlToId = url => (url.match(reYTUrl) || [])[1];

const fetchYTVideo = async (videoId, destDir = './', res = 480, quality = 'w') => {
	let reVideoPrefix = new RegExp(`^ytvideo_${videoId}${res ? '_' + res : ''}${quality ? '_' + quality[0] : ''}`);
	let fileMatches = (await fs.readdir(destDir)).filter(fn => fn.match(reVideoPrefix));
	if(fileMatches.length > 0) {
		console.log('Video file found at:', destDir + fileMatches[0]);
		return destDir + fileMatches[0];
	}
	const reDestination = /\[download\]\s+Destination:\s+([^\s]+)/m;
	const reDownloaded = /\[download\]\s+([^\s]+) has already been downloaded/m;
	let sortSize = quality.match(/^w/i) ? '+size' : 'size'
	let cmd = `yt-dlp --no-mtime -f "bv*" -S "res:${res},${sortSize}" ${videoId} -o "${destDir}ytvideo_%(id)s${res ? '_' + res : ''}${quality ? '_' + quality[0] : ''}.%(ext)s"`;
	console.log('cmd:', cmd);
	let {stdout} = await exec(cmd);
	return (stdout.match(reDestination) || stdout.match(reDownloaded) || [])[1];
};
const fetchYTDescription = async (videoId, destFn) => {
	try {
		let stat = await fs.stat(destFn);
		return destFn;
	}
	catch (err) {}
	const reFilename = /\[info\] Writing video description to:\s+([^\s]+)/m;
	let cmd = `yt-dlp --write-description --skip-download --youtube-skip-dash-manifest -o "${destFn}" ${videoId}`;
	console.log('cmd:', cmd);
	let {stdout} = await exec(cmd);
	return (stdout.match(reFilename) || [])[1];
};
const getVideoLength = async videoFn => {
	let res = await exec(`ffprobe -v 0 -show_entries format=duration -of compact=p=0:nk=1 ${videoFn}`);
	return parseFloat(res.stdout);
};
const getVideoFrame = async (videoFn, frameFn, frameTime = 0) => {
	try {
		let stat = await fs.stat(frameFn);
		return frameFn;
	}
	catch (err) {}
	frameTime = parseFloat(frameTime);
	if(frameTime < 0) {
		let duration = parseFloat(await getVideoLength(videoFn));
		frameTime = duration + frameTime;
	}
	//let cmd = `ffmpeg -y -accurate_seek -ss ${frameTime} -i ${videoFn} -frames:v 1 -q:v 1 -src_range 0 -dst_range 1 ${frameFn.replace(/\.jpg/, '.png')}`;
	let cmd = `ffmpeg -y -accurate_seek -ss ${frameTime} -i ${videoFn} -frames:v 1 -q:v 1 -src_range 0 -dst_range 1 ${frameFn}`;
	console.log('cmd:', cmd);
	let res = await exec(cmd);
	//cmd = `convert -quality 90 ${frameFn.replace(/\.jpg/, '.png')} ${frameFn}`;
	//console.log('cmd:', cmd);
	//res = await exec(cmd);
	return frameFn;
};

const parsePuzzleDataStr = async str => {
	const reFPuzzHostname = /(?:www\.)?f-puzzles\.com/;
	const reCTCHostname = /(?:app|test)\.crackingthecryptic\.com/;
	const reFPuzzRedirectUrl = /^(?:https?:\/\/)?(?:www\.)?f-puzzles\.com\/?id=/;
	const reCTCPathname = /^\/sudoku\/(.*)/;
	const rePuzzlePrefix = /^(ctc|scf|fpuzzles|classic)?(.*)/;
	const reFPuzzPrefix = /^(fpuzzles)(.*)/;
	const decodeFPuzzles = fpuzzleId => loadFPuzzle.parseFPuzzle(fpuzzleId.replace(rePuzzlePrefix, '$2').replace(/ /g, '+'));
	const decodeSCF = scfId => PuzzleZipper.zip(JSON.stringify(PuzzleTools.decodeSCF(scfId)));
	const fetchCTCById = async puzzleId => {
		let res;
		try {
			res = await fetch(`https://app.crackingthecryptic.com/api/puzzle/${encodeURIComponent(puzzleId)}`);
			if(res.status === 200) return await res.text();
		}
		catch(err) {}
		res = await fetch(`https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/${encodeURIComponent(puzzleId)}?alt=media`)
		if(res.status === 200) return PuzzleZipper.zip((await res.text()).replace(/^{/, `{"id":${JSON.stringify(puzzleId)},`));
		throw new Error(`Puzzle ${encodeURIComponent(puzzleId)} not found`);
	};
	const parseAsUrl = async str => {
		let url;
		try {
			url = new URL(str);
		}
		catch(err) {
			return str;
		}
		if(reFPuzzHostname.test(url.hostname) && url.searchParams.get('load')) return 'fpuzzles' + url.searchParams.get('load');
		if(reCTCHostname.test(url.hostname) && url.searchParams.get('puzzleid')) return url.searchParams.get('puzzleid');
		if(reCTCHostname.test(url.hostname) && reCTCPathname.test(url.pathname)) return (url.pathname.match(reCTCPathname) || [])[1];
		if(reFPuzzHostname.test(url.hostname) && url.searchParams.get('id')) {
			url = new URL(`https://tinyurl.com/${url.searchParams.get('id')}`);
		}
		let res = await fetch(url.href, {method: 'HEAD', redirect: 'manual'});
		let location = res.headers.get('location');
		if(location && location !== url) return await parseAsUrl(location);
		console.log('response.status:', res.status);
		console.log('response.headers.location:', location);
		throw new Error('URL not a redirect: ' + url);
	};
	const decodePuzzleStr = async str => {
		let res = await parseAsUrl(str);
		let [_, prefix, data] = (res.match(rePuzzlePrefix) || []);
		if(prefix === undefined) return await fetchCTCById(res);
		if(prefix === 'fpuzzles') return decodeFPuzzles(data);
		if(prefix === 'scf') return decodeSCF(data);
		throw new Error('Unknown prefix: ' + prefix);
	};
	return await decodePuzzleStr(str);
};

module.exports = {
	createDataCacher,
	reYTUrl,
	ytUrlToId,
	fetchYTVideo,
	fetchYTDescription,
	getVideoLength,
	getVideoFrame,
	parsePuzzleDataStr: parsePuzzleDataStr,
};