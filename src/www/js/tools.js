// Logging
	let startTime = {};
	const timer = (label = 'none') => {
		let currentTime = startTime[label];
		if(currentTime) {
			delete startTime[label];
			return Date.now() - currentTime;
		}
		startTime[label] = Date.now();
	};

// Utilities
	const arrFlatten = arr => [].concat(...arr);
	const arrUnique = arr => [...new Set(arr)];
	const arrFlatUniqSorted = arr => [...new Set([].concat(...arr))].sort((a, b) => a - b);
	const fetchJson = async url => {
		let res = await fetch(url);
		if(res.status !== 200) throw new Error({status: res.status, statusText: res.statusText, response: res});
		res = await res.json();
		return res;
	};
	const removeElems = selector => Object.assign(document.createDocumentFragment(), {textContent: ' '}).firstChild.replaceWith(...document.querySelectorAll(selector));
	const levenshteinDistance = (str1 = '', str2 = '') => {
		const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
		for (let i = 0; i <= str1.length; i += 1) {
			track[0][i] = i;
		}
		for (let j = 0; j <= str2.length; j += 1) {
			track[j][0] = j;
		}
		for (let j = 1; j <= str2.length; j += 1) {
			for (let i = 1; i <= str1.length; i += 1) {
				const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
				track[j][i] = Math.min(
					track[j][i - 1] + 1, // deletion
					track[j - 1][i] + 1, // insertion
					track[j - 1][i - 1] + indicator, // substitution
				);
			}
		}
		return track[str2.length][str1.length];
	};
	const getStats = (list = []) => {
		let count = list.length, min = Number.MAX_SAFE_INTEGER, max = Number.MIN_SAFE_INTEGER, sum = 0, se = 0;
		let i, n, s;
		for(i = 0; i < count; i++) {
			n = list[i];
			sum += n;
			se += n * n;
			min = Math.min(min, n);
			max = Math.max(max, n);
		}
		let mean = sum / count;
		let mse = se / count;
		s = 0;
		for(i = 0; i < count; i++) {
			n = list[i] - mean;
			s += n * n;
		}
		let variance = s / count;
				return {count, sum, min, max, mean, mse, variance};
	};
	const rgb2hsv = ([r, g, b]) => {
		let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
		let h = c && ((v === r) ? (g - b) / c : ((v === g) ? 2 + (b - r) / c : 4 + (r - g) / c)); 
		return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
	};
	const hsv2rgb = ([h, s, v]) => {
		let a = s * Math.min(v, 1 - v);
		let f = (n, k = (n + h / 30) % 12) => v - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return [f(0), f(8), f(4)];
	};
	function rgb2xyz(rgb) {
		var r = rgb[0] / 255,
				g = rgb[1] / 255,
				b = rgb[2] / 255;

		// assume sRGB
		r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
		g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
		b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

		var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
		var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
		var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

		return [x * 100, y *100, z * 100];
	}
	function rgb2lab(rgb) {
		var xyz = rgb2xyz(rgb),
					x = xyz[0],
					y = xyz[1],
					z = xyz[2],
					l, a, b;

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

		l = (116 * y) - 16;
		a = 500 * (x - y);
		b = 200 * (y - z);

		return [l, a, b];
	}
	function rgb2hsl(rgb) {
		var r = rgb[0]/255,
				g = rgb[1]/255,
				b = rgb[2]/255,
				min = Math.min(r, g, b),
				max = Math.max(r, g, b),
				delta = max - min,
				h, s, l;

		if (max == min)
			h = 0;
		else if (r == max)
			h = (g - b) / delta;
		else if (g == max)
			h = 2 + (b - r) / delta;
		else if (b == max)
			h = 4 + (r - g)/ delta;

		h = Math.min(h * 60, 360);

		if (h < 0)
			h += 360;

		l = (min + max) / 2;

		if (max == min)
			s = 0;
		else if (l <= 0.5)
			s = delta / (max + min);
		else
			s = delta / (2 - max - min);

		return [h, s * 100, l * 100];
	}
	const luminance = rgb => {
		var a = rgb.map(v => {
			v /= 255;
			return v <= 0.03928
				? v / 12.92
				: Math.pow((v + 0.055) / 1.055, 2.4);
		});
		return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
	};

// Video
	const reYTUrl = /^(?:https?:\/\/)?(?:(?:www|m)\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((?:\w|-){11})(?:\S+)?$/;
	const ytUrlToId = url => (url.match(reYTUrl) || [])[1];
	const getPuzzleIdsFromDescription = desc => {
		const rePuzzleUrl = /(\/[a-z\-.]+\/(?:webapp|sudoku)\/([0-9a-zA-Z]+))/mg;
		const rePuzzleId = /(\/[a-z\-.]+\/(?:webapp|sudoku)\/([0-9a-zA-Z]+))/;
		return (desc.match(rePuzzleUrl) || []).map(url => url.match(rePuzzleId)[2]);
	};
	const rePuzzleUrlFilter = /^https?:\/\/(www\.)?((apps\.apple|store\.steampowered|play\.google|discord\.gg|patreon|instagram|teespring|kickstarter|docs\.google)(\.com)?.*|[^/]+\/?)$/;
	const getPuzzleUrlsFromDescription = desc => desc
		.match(/https?:\/\/[^\s:\)\]]+/gm)
		.filter(url => !rePuzzleUrlFilter.test(url));
	const getPuzzles = async urls => (await Promise.all(
			urls.map(async url => await fetchJson(`/puzzle/${encodeURIComponent(url)}`))
		))
		.filter(res => res.puzzle)
		.map(res => JSON.parse(PuzzleZipper.unzip(res.puzzle)));
	const fetchVideoInfo = async videoId => {
		console.log('fetchVideoInfo("%s");');
		console.time('fetchVideoInfo');
		let videoInfo = await fetchJson(`/fetchvideoinfo/${videoId}`);
		console.timeEnd('fetchVideoInfo');
		return videoInfo;
	};
	const findBoard = (canvas, threshold1 = 200, threshold2 = 0.04) => {
		//console.info('findBoard(canvas, %s, %s);', threshold1, threshold2);
		let ctx = canvas.getContext('2d'),
				w = canvas.width,
				h = canvas.height,
				id = ctx.getImageData(0, 0, w, h),
				d = id.data;
		const isClear = (size, offsetMul, delta) => n => {
			let offset = n * offsetMul, overThreshold = 0;
			for(var i = 0; i < size; i++) {
				let ii = (i * delta + offset) * 4;
				if((d[ii + 0] + d[ii + 1] + d[ii + 2]) / 3 < threshold1) overThreshold++;
			}
			return (overThreshold / size) < threshold2;
		};
		const findEdge = (start, end, clearFn) => {
			let delta = Math.sign(end - start);
			end += delta;
			for(; start != end; start += delta) if(clearFn(start)) break;
			for(; start != end; start += delta) if(!clearFn(start)) break;
			return start;
		};
		return {
			left: findEdge(0, Math.max(h, w * 0.9), isClear(h, 1, w)),
			right: findEdge(Math.max(h, w * 0.9), 0, isClear(h, 1, w)),
			top: findEdge(0, h - 1, isClear(w, w, 1)),
			bottom: findEdge(h - 1, 0, isClear(w, w, 1)),
		};
	};
	const loadVideoFrame = img => {
		let size = img.naturalHeight;
		let canvas = Object.assign(document.createElement('canvas'), {
			width: img.naturalWidth,
			height: img.naturalHeight
		}), ctx = canvas.getContext('2d');
		let outCanvas = Object.assign(document.createElement('canvas'), {width: size, height: size}),
				outCtx = outCanvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		let edges1 = findBoard(canvas, 150, 0.25);
		let w = h = Math.min(size, edges1.right - edges1.left) + 5;
		ctx.drawImage(img, Math.max(0, edges1.left - 5), 0, w, size, 0, 0, w, size);
		ctx.fillStyle = '#fff';
		ctx.fillRect(w, 0, size, size);
		let edges2 = findBoard(canvas, 150, 0.25);
		w = h = Math.max(edges2.right - edges2.left, edges2.bottom - edges2.top);
		outCtx.drawImage(img,
			Math.max(0, edges1.left - 5) + edges2.left,
			edges2.top,
			w, h,
			0, 0, size, size
		);
		return outCanvas;
	};

// Puzzle
	const decodePuzzleData = (puzzleData = '') => {
		if(PuzzleTools.isSCF(puzzleData)) return PuzzleTools.decodeSCF(puzzleData);
		const rePuzzlePrefix = /^(ctc|fpuzzles)/;
		let format = (puzzleData.match(rePuzzlePrefix) || [])[1];
		let puzzleId = puzzleData.replace(rePuzzlePrefix, '');
		switch(format) {
			case 'ctc': return JSON.parse(PuzzleZipper.unzip(LZipper.expand64(puzzleId)));
			case 'fpuzzles': return loadFPuzzle.parseFPuzzle(puzzleId);
			default: throw new Error('Unsupported puzzle format: ' + format);
		}
	};
	const puzzleToCTC = puzzle => {
		if(typeof puzzle === 'string') return PuzzleTools.decodeSCF(puzzle);
		if(puzzle.puzzleData === undefined) return PuzzleTools.decodeSCF(puzzle.id)
		return decodePuzzleData(puzzle.puzzleData);
	};
	const extractPuzzleMeta = (puzzle = {}) => {
		const reMetaTags = new RegExp(`^(title|author|rules|solution):\\s*([\\s\\S]+)`, 'm');
		const metaData = {};
		(puzzle.cages || []).forEach(cage => {
			if((cage.cells || []).length === 0) {
				let [_, metaName, metaVal] = (String(cage.value || '').match(reMetaTags) || []);
				if(metaName && metaVal) {
					if(metaName === 'rules') {
						metaData.rules = metaData.rules || [];
						metaData.rules.push(metaVal);
					}
					else {
						metaData[metaName] = metaVal;
					}
				}
				return;
			}
		});
		return metaData;
	};
	const fetchPuzzle = async puzzleId => decodePuzzleData((await fetchJson(`/puzzle/${puzzleId}`)).puzzle);
	const loadPuzzle = async puzzleData => {
		let puzzleApp = Framework.app = Framework.app || new App({disableYoutubeButton: true});
		console.log('loadPuzzle:', puzzleData);
		let convertedPuzzle = puzzleApp.convertPuzzle(puzzleData);
		console.log('convertedPuzzle:', convertedPuzzle);
		await puzzleApp.puzzle.loadPuzzle(convertedPuzzle, {skipProgress: true});
		puzzleApp.renderCells();
		let svgElem = puzzleApp.svgRenderer.svgElem;
		const bounds = SvgRenderer.getContentBounds(svgElem);
		let width = Math.ceil(-bounds.left + bounds.right);
		let height = Math.ceil(-bounds.top + bounds.bottom);
		puzzleApp.svgRenderer.adjustViewBox(
			Math.floor(bounds.left) - 2,
			Math.floor(bounds.top) - 2,
			width + 4, height + 4
		);
	};

// OCR
	const TesseractDefaultOptions = {
		//langPath: 'https://cdn.rawgit.com/naptha/tessdata/gh-pages/3.02/',
		//corePath: 'https://cdn.rawgit.com/naptha/tesseract.js-core/0.1.0/index.js',
		//langPath: document.location.origin + '/vendors/tesseract/langs/',
		workerPath: document.location.origin + '/vendor/tesseract/worker-1.0.19.min.js',
		corePath: document.location.origin + '/vendor/tesseract/index-1.0.2.js',
		lang: 'eng',
		tessedit_char_blacklist: '!?@#$%&*()<>_-+=/:;\'\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		tessedit_char_whitelist: '123456789',
		assume_fixed_pitch_char_segment: true,
		tessedit_pageseg_mode: 3, // 0=osd only, 1=auto+osd, 2=auto, 3=col, 4=block, 5=line, 6=word, 7=char
		load_system_dawg: false,
		load_freq_dawg: false,
		load_punc_dawg: false,
		load_number_dawg: true,
		load_unambig_dawg: false,
		load_bigram_dawg: false,
		load_fixed_length_dawgs: false,
		classify_bln_numeric_mode: true,
		preserve_interword_spaces: true,
		tosp_min_sane_kn_sp: 3,
		debug_file: '/dev/null',
	};
	const DigitOcr = (() => {
		function DigitOcr(opts = {}) {
			bindHandlers(this);
			this.tesseract = undefined;
			this.availCanvas = [];
			this.isInitialized = false;
		}
		var P = Object.assign(DigitOcr.prototype, {constructor: DigitOcr});
		DigitOcr.DefaultOptions = TesseractDefaultOptions;
		P.init = function(opts = {}) {
			console.info('DigitOcr.init(opts);');
			if(this.isInitialized) return Promise.resolve();
			this.isInitialized = true;
			/*
			window.Tesseract = Tesseract.create({
				workerPath: document.location.origin + '/vendor/tesseract/worker-1.0.19.min.js',
				corePath: document.location.origin + '/vendor/tesseract/index-1.0.2.js',
				langPath: document.location.origin + '/vendor/tesseract/',
			});
			*/
			console.time('DigitOcr init');
			this.tesseract = Tesseract.create(Object.assign(DigitOcr.DefaultOptions, opts));
			this.initCells();
			this.canvas = Object.assign(document.createElement('canvas'), {width: 1, height: 1});
			document.body.appendChild(this.canvas);
			return Promise.resolve(this.tesseract.recognize(this.canvas))
				.then(res => console.timeEnd('DigitOcr init'))
				.catch(err => console.log('err:', err));
		};
		P.initCells = function() {
			let cells = this.cells = [];
			for(var i = 0; i < 9 * 9; i++) cells[i] = [];
		};
		P.recognize = function(srcCanvas, digitRCs) {
			console.info('DigitOcr.recognize(srcCanvas, digitRCs);');
			const {cells} = this;
			const size = Math.floor(Math.min(srcCanvas.width, srcCanvas.height) / 9);
			const canvas = this.canvas, ctx = canvas.getContext('2d');
			document.body.appendChild(this.canvas);
			this.canvas.style.position = 'relative';
			this.canvas.style.top = '-100%';
			document.body.style['overflow-y'] = 'scroll';
			canvas.width = size;
			canvas.height = size * digitRCs.length;
			ctx.globalCompositeOperation = 'source-over';
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalCompositeOperation = 'difference';
			digitRCs.forEach(([x, y], idx) => ctx.drawImage(srcCanvas, x * size, y * size, size, size, 0, idx * size, size, size));
			return Promise.resolve(this.tesseract.recognize(canvas, DigitOcr.DefaultOptions))
				.then(res => {
					console.log('recognize > res:', res);
					console.log('recognize > res.confidence:', res.confidence);
					console.log('recognize > res.text:', res.text);
					//console.log(res.text.replace(/[^1-9]+/igm, '').split(''));
					//let digits = res.text.split('\n').slice(0, digitRCs.length);
					//return this.convertDigits(digitRCs, digits).join('');
					return res.text.replace(/[^1-9]+/igm, '');
				})
				.catch(err => console.error('err', err));
		};
		P.convertDigits = function(digitRCs, digits) {
			let cells = [];
			for(let i = 0; i < 9 * 9; i++) cells[i] = ' ';
			digits.forEach((digit, idx) => {
				let [c, r] = digitRCs[idx];
				cells[r * 9 + c] = digit;
			});
			return cells;
		};
		P.run2 = function(srcCanvas, digits) {
			console.info('DigitOcr.run(srcCanvas, digits);');
			const {cells} = this;
			console.log('digits:', digits);
			
			for(let r = 0; r < 9; r++) {
				for(let c = 0; c < 9; c++) {
					console.log(r, c, this.cellGetBest(r, c));
				}
			}
			
			console.time('run all tasks');
			let tasks = digits.map(([x, y]) => this.processDigit(srcCanvas, x, y));
			for(let r = 0; r < 9; r++) for(let c = 0; c < 9; c++) {
				if(digits.find(([x, y]) => x === c && y === r) === undefined) tasks.push(Promise.resolve(cells[r * 9 + c].push([' ', 70])));
			}
			return Promise.all(tasks)
				.then(res => {
					console.timeEnd('run all tasks');
					console.log('cells:', this.cells);
					let debugText = '';
					for(let r = 0; r < 9; r++) {
						for(let c = 0; c < 9; c++) {
							//console.log(r, c, this.cellGetBest(r, c));
							debugText += this.cellGetBest(r, c);
						}
						debugText += '\n';
					}
					console.log('\n' + debugText);
				})
				.catch(err => console.error('err', err));
		};
		P.processDigit = function(srcCanvas, x, y) {
			//console.info('DigitOcr.processDigit(srcCanvas, %s, %s);', x, y);
			const tesseract = this.tesseract;
			const canvas = this.getCanvas(srcCanvas, x, y);
			return Promise.resolve(tesseract.recognize(canvas, DigitOcr.DefaultOptions))
				.then(res => {
					this.putCanvas(canvas);
					let cell = this.cells[y * 9 + x];
					let digit = res.text.replace(/[^1-9]+/igm, '').substr(0, 1);
					//console.log('digit[%s, %s]:', x, y, digit, res.confidence);
					this.updateCellConfidence(cell, [digit, res.confidence]);
					return cell;
				})
				.catch(err => console.error('err', err));
		};
		P.updateCellConfidence = function(cell, newDigit) {
			const confidenceFactor = 0.7;
			let digits = cell.slice(0);
			cell.length = 0;
			digits.forEach(digit => {
				digit[1] *= confidenceFactor;
				if(digit[1] > 15) cell.push(digit);
			});
			cell.push(newDigit);
		};
		P.cellGetBest = function(r, c) {
			let cell = this.cells[r * 9 + c];
			let guesses = {}, best = [' ', 0];
			cell.forEach(([char, confidence]) => {
				let guess = guesses[char] = (guesses[char] || 0) + confidence;
				if(guess > best[1]) best = [char, guess];
			});
			//console.log('cellGetBest:', r, c, best, cell);
			return best;
		};
		P.getCanvas = function(srcCanvas, x, y) {
			const {availCanvas} = this;
			let canvas;
			if(availCanvas.length === 0) {
				canvas = document.createElement('canvas');
				document.body.appendChild(canvas);
			}
			else canvas = availCanvas.pop();
			const size = Math.floor(Math.min(srcCanvas.width, srcCanvas.height) / 9);
			let ctx = canvas.getContext('2d');
			canvas.width = canvas.height = size;
			ctx.globalCompositeOperation = 'source-over';
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalCompositeOperation = 'difference';
			ctx.drawImage(srcCanvas, x * size, y * size, size, size, 0, 0, size, size);
			return canvas;
		};
		P.putCanvas = function(canvas) {
			this.availCanvas.push(canvas);
		};
		return DigitOcr;
	})();

// Solver
	const getGivens = () => Framework.app.puzzle.cells.map((c, i) => c.propGet('given') || ' ');
	const invertCtx = ctx => {
		ctx.filter = 'invert(1)';
		ctx.drawImage(ctx.canvas, 0, 0);
		ctx.filter = 'none';
		return ctx;
	};
	const blurCtx = (ctx, radius = 1) => {
		ctx.filter = `blur(${radius}px)`;
		ctx.drawImage(ctx.canvas, 0, 0);
		ctx.filter = '';
		return ctx;
	};
	const bnwCtx = ctx => {
		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage(ctx.canvas, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
		return ctx;
	};
	const contrastifyCtx = (ctx, threshold) => {
		let iData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		let d = iData.data;
		if(threshold === undefined) {
			let rgbSum = 0;
			//for(var i = 0; i < d.length; i += 4) rgbSum += r + g + b;
			//let rgbMean = rgbSum / ((d.length / 4 ) * 3 * 255);
			
			for(var i = 0; i < d.length; i += 4) {
			//for(var i = 0; i < 1600; i += 4) {
				//rgbSum += d[i]+d[i+1]+d[i+2];
				//rgbSum += rgb2lab(d.slice(i, i + 3))[0];
				//console.log(i / 4, [...d.slice(i, i + 3)], rgb2hsl(d.slice(i, i + 3)));
				rgbSum += rgb2hsl(d.slice(i, i + 3))[2] / 100;
			}
			//let rgbMean = rgbSum / ((d.length / 4 ) * 3 * 255);
			let rgbMean = rgbSum / (d.length / 4);
			threshold = rgbMean * 1.85;
		}
		for(var i = 0; i < d.length; i += 4) {
			let rgb = d.slice(i, i + 3);
			//let hsl = rgb2hsl(d.slice(i, i + 3));
			//let val = hsl[2] > 0.8 ? 255 : 0;
			//let val = (rgb[0] + rgb[1] + rgb[2]) > threshold * 255 * 3 ? 255 : 0;
			//rgb = rgb2lab(rgb);
			//let val = (rgb[0] ) > threshold * 255 ? 255 : 0;

			let hsl = rgb2hsl(rgb);
			let val = (hsl[2]) > threshold * 100 ? 255 : 0;
			//let val = hsl[2] > 65 ? 255 : 0;
			d[i + 0] = d[i + 1] = d[i + 2] = val;
			//d[i + 3] = 255;
		}
		ctx.putImageData(iData, 0, 0);
		return ctx;
	};
	const drawPuzzleImg = async ({width, height}) => {
		let canvas = Object.assign(document.createElement('canvas'), {width, height}), ctx = canvas.getContext('2d')
		let puzzle = Framework.app.puzzle;
		let img = await PuzzleTools.createThumbnail({width, height, format: 'img'});
		const svg = document.querySelector(SvgRenderer.DefaultSelector);
		const boardBounds = SvgRenderer.getContentBounds(svg);
		// Grab only board portion and trim margins
		ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
		ctx.drawImage(img, -boardBounds.left, -boardBounds.top, 576, 576, 0, 0, width, height);
		return canvas;
	};
	const drawFrameDiff = (ctx, blankCanvas, filledCanvas) => {
		ctx.drawImage(filledCanvas, 0, 0);
		ctx.globalCompositeOperation = 'difference';
		ctx.drawImage(blankCanvas, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
		invertCtx(ctx);
		return ctx;
	};
	const drawOption = async (ctx, props = {}) => {
		let {width, height} = ctx.canvas;
		let propKeys = Object.keys(props), puzzle = Framework.app.puzzle;
		puzzle.clearPuzzle();
		let blankCanvas = await drawPuzzleImg({width, height});
		puzzle.cells.forEach(cell => propKeys.forEach(key => cell.propSet(key, props[key])));
		let filledCanvas = await drawPuzzleImg({width, height});
		drawFrameDiff(ctx, blankCanvas, filledCanvas);
		//invertCtx(ctx);
	};
	const calcColMse = (a, b) => {
		//a[0] = b[0] = 1;
		//a[1] = b[1] = 1;
		//a[2] = b[2] = 0;
		//a[2] = (1 - Math.pow(1 - (a[2] / 0xff), 2)) * 0xff;
		//b[2] = (1 - Math.pow(1 - (b[2] / 0xff), 2)) * 0xff;
		let len = a.length, diff, sum = 0;
		let comps = [];
		for(var i = 0; i < len; i++) {
			diff = (a[i] - b[i]) / 0xff;
			sum += diff * diff;
		}
		return sum / len;
	};
	const iDataMse = (iDataA, iDataB) => {
		let da = iDataA.data, db = iDataB.data;
		const rgbaMSE = (da, db, i) => calcColMse(da.slice(i, i + 3), db.slice(i, i + 3));
		//const rgbaMSE = (da, db, i) => calcColMse(rgb2hsv(da.slice(i, i + 3)), rgb2hsv(db.slice(i, i + 3)));
		let mse = 0;
		let len = da.length / 4;
		for(var i = 0; i < len; i++) mse += rgbaMSE(da, db, i * 4);
		return mse / len;
	};
	const iDataError = (iDataA, iDataB) => {
		let da = iDataA.data, db = iDataB.data;
		const rgbError = (da, db, i) => {
			let rgbA = da.slice(i, i + 3), rgbB = db.slice(i, i + 3);
			return 
		};
		//const rgbaMSE = (da, db, i) => calcColMse(rgb2hsv(da.slice(i, i + 3)), rgb2hsv(db.slice(i, i + 3)));
		let err = 0;
		let len = da.length / 4;
		for(var i = 0; i < len; i++) err += rgbError(da, db, i * 4);
		return err / len;
	};
	const calcCellRGBErr = (idA, idB, idx) => {
		let da = idA.data, db = idB.data;
		let err = 0;
		let len = da.length;
		for(var i = 0; i < len; i += 4) {
			let rgbA = da.slice(i, i + 3), rgbB = db.slice(i, i + 3)
			err += (
				Math.abs(rgbA[0] - rgbB[0])
				+ Math.abs(rgbA[1] - rgbB[1])
				+ Math.abs(rgbA[2] - rgbB[2])
			) / 3 / 255;
		}
		return err / len;
	};
	const forCellData = async (ctxA, ctxB, func, rows = 9, cols = 9) => {
		let {width, height} = ctxA.canvas, w = (width / cols), h = (height / rows);
		let res = [], len = rows * cols;
		for(let i = 0; i < len; i++) {
			let x = (i % cols) * w, y = Math.floor(i / cols) * h;
			let idA = ctxA.getImageData(x, y, w, h), idB = ctxB.getImageData(x, y, w, h);
			res[i] = func(idA, idB, i);
		}
		return res;
	};
	const calcBlankDigitMses = async (ctxA, ctxB) => {
		let mses = {};
		let propList = '123456789'.split('').map(digit => ({normal: digit, colour: ''}));
		await drawOption(ctxA);
		for(var i = 0; i < propList.length; i++) {
			let props = propList[i], digit = props.normal;
			await drawOption(ctxB, props);
			mses[digit] = await calcMsesForProps(ctxA, ctxB, digit);
		}
		return mses;
	};
	const calcPuzzleDigitErr = async (ctxA, ctxB, blankCanvas, filledCanvas) => {
		drawFrameDiff(ctxA, blankCanvas, blankCanvas);
		drawFrameDiff(ctxB, blankCanvas, filledCanvas);
		return await forCellData(ctxA, ctxB, calcCellRGBErr);
	};
	const calcCellPixelError = async (ctxA, ctxB, rows = 9, cols = 9) => {
		let {width, height} = ctxA.canvas, w = (width / cols), h = (height / rows);
		let err = [];
		for(var r = 0; r < rows; r++) for(var c = 0; c < cols; c++) {
			let x = c * w, y = r * h, _w = w, _h = h;
			let iDataA = ctxA.getImageData(x, y, _w, _h), iDataB = ctxB.getImageData(x, y, _w, _h);
			err[r * cols + c] = iDataError(iDataA, iDataB);
		}
		return err;
	};
	const calcMsesForProps = (ctxA, ctxB, digit, givens = '', rows = 9, cols = 9) => {
		let {width, height} = ctxA.canvas, w = (width / cols), h = (height / rows);
		let mses = [];
		for(var r = 0; r < rows; r++) for(var c = 0; c < cols; c++) {
			let given = givens[r * cols + c];
			if(given && given !== ' ') {
				mses[r * cols + c] = digit === given ? 0 : 1;
			}
			else {
				let x = c * w, y = r * h, _w = w, _h = h;
				//let x = c * w + 0.15 * w, y = r * h + 0.1 * h, _w = 0.7 * w, _h = 0.8 * h;
				let iDataA = ctxA.getImageData(x, y, _w, _h), iDataB = ctxB.getImageData(x, y, _w, _h);
				mses[r * cols + c] = iDataMse(iDataA, iDataB);
			}
		}
		return mses;
	};
	const calcMsesForPropList = async (ctxA, ctxB, propList, givens = '') => {
		let res = [];
		for(var i = 0; i < propList.length; i++) {
			let props = propList[i];
			await drawOption(ctxB, props);
			// Calc digit diff
			let mses = await forCellData(ctxA, ctxB, calcCellRGBErr);
			res.push({props, mses});
		}
		return res;
	};
	const propMsesToDigitGuesses = propMses => [...Array(81)]
		.map((_, i) => propMses
			.map(({props, mses}) => [props['normal'], mses[i]])
			.sort((a, b) => a[1] - b[1])
		);
	const guessesToSol = guesses => guesses.map(guesses => guesses[0][0]);
	const loadSol = (sol = []) => {
		let cells = Framework.app.puzzle.cells;
		(typeof sol === 'string' ? sol.split('') : sol)
			.forEach((d, i) => {
				cells[i].clearAll();
				if(d !== '.') cells[i].propSet('normal', d);
			});
	};
	const getErrorCells = (rows = 9, cols = 9) => arrFlatUniqSorted(
			Framework.app.check({features: ['cells']})
				.filter(({type}) => type === 'unique')
				.map(({cells}) => cells.map(({row, col}) => row * cols + col))
		);
	const getWeakGuesses = (guesses, threshold) => {
		let weakGuesses = [];
		guesses.forEach((mses, idx) => {
			if(mses[1][1] - mses[0][1] < threshold) weakGuesses.push(idx);
		});
		return weakGuesses;
	};
	const filterErrors = (cells, guesses, threshold) => cells 
		.filter(i => guesses[i][1][1] - guesses[i][0][1] < threshold);
	const removeFromSol = (sol, cells, replace = '.') => sol
		.map((digit, i) => cells.indexOf(i) === -1 ? digit : replace);

	const logSol = (label, sol, correctSol) => console.log(label, sol.join(''), correctSol ? levenshteinDistance(sol.join(''), correctSol) : '');
	const completeSolution = async (firstSol, correctSol = [], improveSolFunc) => {
		console.time('completeSolution');

		logSol('correctSol:', correctSol, correctSol);
		console.log('          :', correctSol.map((d, i) => d === firstSol[i] ? '√' : ' ').join(''));
		logSol('  firstSol:', firstSol, correctSol);

		let partialSol = [...firstSol];
		let sols;
		for(var i = 0; i < 81; i++) {
			logSol(`    try ${String(i).padStart(2, '0')}:`, partialSol, correctSol);
			sols = createSolver(partialSol.join('')).findSolutions(1);
			if(sols.length > 0) break;
			partialSol = improveSolFunc(partialSol, i);
		}
		logSol('correctSol:', correctSol, correctSol);
		logSol('partialSol:', partialSol, correctSol);
		sols = createSolver(partialSol.join('')).findSolutions(20);
		console.log(sols);
		// TODO: Handle multipe solutions by ranking them
		if(sols.length === 1) {
			loadSol(sols[0]);
		}
		console.timeEnd('completeSolution');

		return sols;
	};

	const findSolByOcr = async ({image, cols = 9, rows = 9, givens = []}) => {
		let width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
		console.time('findSolByOcr');
		let opts = Object.assign({}, TesseractDefaultOptions);
		let tesseract = Tesseract.create(opts);
		let res = await tesseract.recognize(image, opts);
		console.timeEnd('findSolByOcr');
		let digits = [...Array(81)].map((_, i) => [i, '.', 0]);

		console.log('givens:', givens.join(''));
		res.symbols.forEach(symbol => {
			let {x0, y0, x1, y1} = symbol.bbox;
			let r = Math.floor((y0 + y1) / 2 / height * rows);
			let c = Math.floor((x0 + x1) / 2 / width * cols);
			let idx = r * cols + c;
			let digit = (symbol.text.match(/([1-9])/) || [])[1];
			digits[idx][3] = symbol;
			if(digit !== undefined) {
				digits[idx][1] = digit;
				digits[idx][2] = symbol.confidence / 100;
			}
			if(/[0-9]/.test(givens[idx])) {
				digits[idx][1] = givens[idx];
				digits[idx][2] = 1;
			}
		});
		let scoreOrder = digits
			.map(([i, d, score]) => [i, d, score])
			.sort((a, b) => a[2] - b[2]);
		let sol = digits.map((d, i) => d[1]);
		return [sol, digits, scoreOrder];
	};

	const testScannerOcr = async ({canvas, correctSol, rows = 9, cols = 9, givens = []}) => {
		let [sol, digits, scoreOrder] = await findSolByOcr({rows, cols, image: canvas, givens});
		console.log('sol:', sol.join(''));
		console.log('digits:', digits);
		console.log('scoreOrder:', scoreOrder);
		const improveSol = (sol, idx) => {
			sol = [...sol];
			for(var i = 0; i < scoreOrder.length; i++) {
				if(!scoreOrder[i]) continue;
				let ci = scoreOrder[i][0];
				if(sol[ci] !== '.') {
					sol[ci] = '.';
					break;
				}
			}
			return sol;
		};
		console.log('givens:', givens);
		givens.forEach((d, i) => d !== ' ' ? sol[i] = d : null);
		await completeSolution(sol, correctSol, improveSol);
	};

	const testScannerOcrPerCell = async ({canvas, correctSol, rows = 9, cols = 9, givens = []}) => {
		let inCtx = canvas.getContext('2d');
		let {width, height} = canvas, w = (width / cols), h = (height / rows);
		let cellCanvas = Object.assign(document.createElement('canvas'), {width: w, height: h});
		let cellCtx = cellCanvas.getContext('2d');

		inCtx.fillStyle = '#fff';
		for(let i = 0; i < rows * cols; i++) {
			let x = (i % cols) * w, y = Math.floor(i / cols) * h, x0 = 0, y0 = 0;
			x0 = 0.15 * w;
			y0 = 0.15 * h;
			let _w = w - 2 * x0;
			let _h = h - 2 * y0;
			cellCtx.drawImage(canvas, x + x0, y + y0, _w, _h, x0, y0, _w, _h);
			if(givens[i] !== ' ') {
				invertCtx(cellCtx);
			}
			contrastifyCtx(cellCtx);
			inCtx.fillRect(x, y, w, h);
			inCtx.drawImage(cellCanvas, x, y);
		}
		let [sol, digits, scoreOrder] = await findSolByOcr({rows, cols, image: canvas, givens});
		console.log('sol:', sol.join(''));
		console.log('digits:', digits);
		console.log('scoreOrder:', scoreOrder);
		loadSol(sol);
		Framework.app.check({features: ['cells']});
		const improveSol = (sol, idx) => {
			sol = [...sol];
			for(var i = 0; i < scoreOrder.length; i++) {
				if(!scoreOrder[i]) continue;
				let ci = scoreOrder[i][0];
				if(sol[ci] !== '.') {
					sol[ci] = '.';
					break;
				}
			}
			return sol;
		};
		return await completeSolution(sol, correctSol, improveSol);
	};

	const calcDigitMatches = async ({canvas, rows = 9, cols = 9, givens = []}) => {
		let inCtx = canvas.getContext('2d');
		let frameWH = {width: canvas.width, height: canvas.height};
		let tmpCanvas = Object.assign(document.createElement('canvas'), frameWH), tmpCtx = tmpCanvas.getContext('2d')
		let propList = '123456789'.split('').map(digit => ({normal: digit, colour: ''}));
		res = await calcMsesForPropList(inCtx, tmpCtx, propList, givens);
		//console.log('res:', res);
		let guesses = propMsesToDigitGuesses(res);
		//console.log('guesses:', guesses);
		//let guessSol = guessesToSol(guesses);
		//logSol('  guessSol:', guessSol);
		return guesses;
	};

	const testScannerDigitMatch = async ({canvas, correctSol, rows = 9, cols = 9, givens = []}) => {
		let guesses = await calcDigitMatches({canvas, rows, cols, givens});
		console.log('guesses:', guesses);
		let guessSol = guessesToSol(guesses);
		logSol('  guessSol:', guessSol);
		loadSol(guessSol);
		Framework.app.check({features: ['cells']});
		let gMin = 1, gMax = 0;
		guesses.forEach((g, i) => g.forEach(([d, n], j) => (gMin = Math.min(gMin, n), gMax = Math.max(gMax, n))));
		const norm = n => (n - gMin) / (gMax - gMin);
		const rankDigit = (d, i) => {
			let g = guesses[i], gidx = g.findIndex(([dd, n]) => d === dd);
			return gidx === 8 || gidx === -1 ? 1 : norm(g[gidx + 1][1]) - norm(g[gidx][1]);
		};
		let scoreOrder = guessSol
			.map((d, i) => [i, d, rankDigit(d, i)])
			.sort((a, b) => a[2] - b[2]);
		console.log('scoreOrder:', scoreOrder);
		/*
		scoreOrder.forEach(([idx, d, score], i) => console.log(
			correctSol[idx] === d ? 'C' : ' ',
			idx, d, score
		));
		*/
		const improveSol = (sol, idx) => {
			sol = [...sol];
			for(var i = 0; i < scoreOrder.length; i++) {
				if(!scoreOrder[i]) continue;
				let ci = scoreOrder[i][0];
				if(sol[ci] !== '.') {
					sol[ci] = '.';
					break;
				}
			}
			return sol;
		};
		await completeSolution(guessSol, correctSol, improveSol);
	};

	const testScannerDigitRanking = async ({canvas, correctSol, rows = 9, cols = 9, givens = []}) => {
		let guesses = await calcDigitMatches({canvas, rows, cols, givens});
		console.log('guesses:', guesses);
		let sol = guessesToSol(guesses);
		logSol('  sol:', sol);
		loadSol(sol);
		Framework.app.check({features: ['cells']});

		const calcDigitRank = (idx, digit) => {
			return guesses[idx].findIndex(([d, e]) => d === digit)
		};
		const calcDigitRegionRank = (idx, digit, region) => {
			const PT = PuzzleTools;
			let err = [];
			let idxs = PT.regionToSeen[region](PT.indexToRegion[region](idx));
			for(let i = 0; i < 9; i++) err[i] = guesses[idxs[i]].find(([d, err]) => d === digit)[1];
			return err
				.map((e, i) => [idxs[i], e])
				.sort((a, b) => a[1] - b[1])
				.findIndex(([i, e]) => i === idx)
		};
		const calcRanks = (idx, digit) => ([
			calcDigitRank(idx, digit),
			calcDigitRegionRank(idx, digit, 'row'),
			calcDigitRegionRank(idx, digit, 'col'),
			calcDigitRegionRank(idx, digit, 'box'),
		]);
		const calcRanksMse = ranks => ranks.reduce((s, n) => s += n * n, 0) / 4;
		const calcAllRanks = () => {
			let res = [];
			for(var i = 0; i < 81; i++) res[i] = [];
			for(var d = 0; d < 9; d++) {
				let digit = String(d + 1);
				for(var i = 0; i < 81; i++) {
					let ranks = calcRanks(i, digit);
					res[i].push([
						digit,
						//ranks.reduce((s, n) => s += n, 0) / (4 * 9),
						ranks.reduce((s, n) => s += n === 0 ? 0 : 1, 0),
						guesses[i].find(([d, e]) => d === digit)[1],
						...ranks
					]);
					//res[i].push([digit, calcRanksMse(ranks), guesses[i].find(([d, e]) => d === digit)[1], ...ranks]);
				}
			}
			for(var i = 0; i < 81; i++) res[i].sort((a, b) => a[1] - b[1]);
			return res;
		};
		let ranks = calcAllRanks();
		console.log('ranks:', ranks);

		let gMin = 1, gMax = 0;
		ranks.forEach((g, i) => g.forEach(([d, n], j) => (gMin = Math.min(gMin, n), gMax = Math.max(gMax, n))));
		const norm = n => (n - gMin) / (gMax - gMin);
		const rankDigit = (d, i) => {
			let r = ranks[i], ridx = r.findIndex(([dd, n]) => d === dd);
			return ridx === 8 || ridx === -1 ? 1 : norm(r[ridx + 1][1]) - norm(r[ridx][1]);
		};
		let scoreOrder = sol
			.map((d, i) => [i, d, rankDigit(d, i)])
			.sort((a, b) => a[2] - b[2]);
		console.log('scoreOrder:', scoreOrder);
		const improveSol = (sol, idx) => {
			sol = [...sol];
			for(var i = 0; i < scoreOrder.length; i++) {
				if(!scoreOrder[i]) continue;
				let ci = scoreOrder[i][0];
				if(sol[ci] !== '.') {
					sol[ci] = '.';
					break;
				}
			}
			return sol;
		};
		await completeSolution(sol, correctSol, improveSol);
	};

	const findSol = async (blankFrameImg, solvedFrameImg, correctSol = []) => {
		if(typeof correctSol === 'string') correctSol = correctSol.split('');
		let appElem = document.getElementById('app');
		let blankFrameCanvas = loadVideoFrame(blankFrameImg);
		let solvedFrameCanvas = loadVideoFrame(solvedFrameImg);
		let frameWH = {width: blankFrameCanvas.width, height: blankFrameCanvas.height};
		let inCanvas = Object.assign(document.createElement('canvas'), frameWH), inCtx = inCanvas.getContext('2d')
		let givens = getGivens();
		console.log('givens:', givens.join(''));

		appElem.appendChild(solvedFrameImg);
		
		appElem.appendChild(inCanvas);

		drawFrameDiff(inCtx, blankFrameCanvas, solvedFrameCanvas);

		//await testScannerOcr({
		return await testScannerOcrPerCell({
		//await testScannerDigitMatch({
		//await testScannerDigitRanking({
			canvas: inCanvas,
			correctSol,
			rows: 9, cols: 9, givens
		});
	};

	const processVideo = async (videoUrl, correctSol = '', logElem) => {
		console.log('processVideo(videoUrl, correctSol);');

		let videoId = ytUrlToId(videoUrl);
		console.log('  videoUrl:', videoUrl);
		console.log('  correctSol:', correctSol);
		console.log('  videoId:', videoId);

		const log = (...args) => logElem && (logElem.textContent += args.join(' ') + '\n');
		// Clear elems
		if(logElem) logElem.textContent = '';
		removeElems('#app img, #app canvas');

		const __getFrame = async (videoName, frameTime) => {
			log(`Get frame at ${frameTime} from: ${videoName}`); timer();
			let img = await PuzzleTools.urlToImg((await fetchJson(`/extractframe/${videoName}/${frameTime}`)).frame);
			log(`Getting frame at ${frameTime} from: ${videoName} (${timer()}ms)`);
			return img;
		};
		const getFrame = async (videoId, frameTime) => {
			log(`Get frame at ${frameTime} from: ${videoId}`); timer();
			let img = await PuzzleTools.urlToImg((await fetchJson(`/fetchvideoframe/${videoId}/${frameTime}`)).frame);
			log(`Getting frame at ${frameTime} from: ${videoId} (${timer()}ms)`);
			return img;
		};

		const loadPuzzleUrls = async videoId => {
			log('Fetching puzzle references from video:', videoId);
			timer();
			let videoInfo = await fetchVideoInfo(videoId);
			let puzzleUrls = getPuzzleUrlsFromDescription(videoInfo.description);
			console.log('  puzzleUrls:\n%s', puzzleUrls.join('\n'));
			let puzzles = await getPuzzles(puzzleUrls);
			log(`loadPuzzleUrls (${timer()}ms)`);
			return puzzles;
		};

		timer('total');
		try {
			/*
			log('Fetching video:', videoId);
			timer();
			let videoName = (await fetchJson(`/fetchvideo/${videoId}`)).video;
			log(`Fetch video (${timer()}ms):`, videoName);
			
			let blankFrameImg = await getFrame(videoName, 120);
			let solvedFrameImg = await getFrame(videoName, -25);
			*/

			log('Fetching frames:', videoId);
			console.time('frame120');
			let blankFrameImg = await getFrame(videoId, 120);
			console.timeEnd('frame120');
			console.time('frame-40');
			let solvedFrameImg = await getFrame(videoId, -40);
			console.timeEnd('frame-40');
			timer('frames');
			log(`Fetch frames (${timer('frames')}ms)`);

			let puzzles = await loadPuzzleUrls(videoId);

			console.log('  puzzles:', puzzles);
			// TODO: Handle multiple or no puzzles
			let puzzleData = puzzles[0];
			if(!puzzleData) puzzleData = PuzzleTools.decodeSCF('scfoooooooooooooK');
			await loadPuzzle(puzzleData);
			
			log('Find solution');
			timer();
			let sols = await findSol(blankFrameImg, solvedFrameImg, correctSol) || '';

			log(`Solutions found:`, sols.length);
			let sol = sols[0];
			log(`Find solution (${timer()}ms)`);
			log(`Total time: ${timer('total')}ms`);
			log('Solution:');
			log((sol.match(/(.{9})/g) || []).join('\n'));
		}
		catch(err) {
			console.error(err);
		}
	};
