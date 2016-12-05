/*
	
	// ------------------------------------------------
	// ------------ the API ---------------------------
	// ------------------------------------------------

	// - - - instantiate new Vid2Canvas obj - - -
	
	var v = new Vid2Canvas({
		src: "camera" | "path/to/file.mp4",
		// optional params
		deviceId: '...', 	// which camera, if more than one
		stepInterval: 24, 	// size of a 'step()' (ex: 24th of a second)
		width: 256,			// if width is specified w/out height...
		height: 256,		// ...height conforms to aspect ratio of video
		cropX: 0,			
		cropY: 0,
		cropW: 0,
		cropH: 0			
	}, function(){
		// callback 
	});

	// - - - public methods - - -

	v.appendTo( 'css-selector' );
	v.remove();
	v.css( obj ); // ex: { position: 'absolute', marginLeft: '10px' }

	v.update(); 	// updates internal canvas ( w/data form video/camera )
					// for 'realtime', this should be called in the app's requestAnimationFrame loop

	// if instance of Vid2Canvas is a video file 
	
	v.step(); 		// steps to next frame ( based on stepInterval )
	v.play();
	v.pause();
	v.time; 		// returns current time in seconds
	v.duration; 	// returns duration of video in seconds

	v.resizeTo( w, h ); 
	v.cropTo( x, y, w, h ); 

	
	// - - - static methods - - -

	Vid2Canvas.LogDevices(); // prints array of attached devices
							 // use this to find the deviceId of a device

*/

class Vid2Canvas {
	
	constructor(config,callback){

		var self = this;

		if( typeof config == "undefined")
			throw new Error('Vid2Canvas: missing config object');

		if( typeof config.src == "undefined")
			throw new Error('Vid2Canvas: you must specify a src property, must be either "camera" or path to video file');

		this.src = config.src;

		this.ready = false;

		this.interval = ( typeof config.stepInterval == "undefined" ) ? 24 : config.stepInterval;

		this.flip = ( typeof config.flip == "undefined" ) ? false : true;
		this.flipped = false;
		
		// create video element 
		this.video = document.createElement('video');
		
		// create canvas element
		this.canvas = document.createElement('canvas');


		// set params ---------------------------------
		this.ctx = this.canvas.getContext( '2d' );	
		//
		this.sx 		= (typeof config.cropX!=="undefined") ? config.cropX : 0;
		this.sy 		= (typeof config.cropY!=="undefined") ? config.cropY : 0;
		this.sWidth 	= (typeof config.cropW!=="undefined") ? config.cropW : this.video.width;
		this.sHeight 	= (typeof config.cropH!=="undefined") ? config.cropH : this.video.height;
		//
		// if( typeof config.cropH!=="undefined" ) this.cropping=true;
		if( typeof config.cropX!=="undefined" ) this.cropping=true;
		// this.canvas.width 	= (this.video.width<this.sWidth) ? this.video.width : this.sWidth;
		// this.canvas.height  = (this.video.height<this.sHeight) ? this.video.height : this.sHeight;

		if( typeof config.width !== "undefined"){
			if( config.height !== "undefined" ){
				this.canvas.width  = config.width;
				this.canvas.height = config.height;
			} else {				
				this.canvas.width  = config.width;
				this.canvas.height = 0; // temporary 0, tbd after video.src ready
			}
		} 
		else {
			this.canvas.width  = this.video.width;//720;
			this.canvas.height = this.video.height;//540;
		}
		



		if( this.src == "camera" ){

			// ------------------------------------------------- when src is "camera"
			var constraits;

			if( typeof config.deviceId !== "undefined" )
				constraits = { video: { optional: [{sourceId: config.deviceId }] } };
			else 
				constraits = { video: true };
			
			navigator.getUserMedia = navigator.getUserMedia || 
				navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
			window.URL = window.URL || window.webkitURL;

			function gotStream(stream) {				
				if (window.URL){
					self.video.src = window.URL.createObjectURL(stream);  
				}
				else self.video.src = stream;   // opera
				self.video.onerror = function(e){ stream.stop() };  
				stream.onended = noStream;	
				// setup height if not defined above
				// also handle call back ( we don't want to callback until h/w is set)
				self._setHeightFromWidth( callback );							
			}

			function noStream(e) {
				var msg = 'No camera available.';
				if (e.code == 1)  msg = 'User denied access to use camera.';   
				throw new Error(msg);
			}		

			navigator.getUserMedia(constraits, gotStream, noStream);

		} else {		

			// ------------------------------------------------- when src is video file path
			function startVideo(){  							
				// setup height if not defined above
				// also handle call back ( we don't want to callback until h/w is set)
				self._setHeightFromWidth( callback );
			}
			this.video.src = this.src;
			this.video.addEventListener("canplaythrough", startVideo, true);
		}
	}

	// -------------------------- getters && setters --------------------------

	set width(v){
		throw new Error('Vid2Canvas: use .resizeTo(w,h) or .cropTo(x,y,w,h)')
	}

	get width(){
		return this.canvas.width;
	}

	set height(v){
		throw new Error('Vid2Canvas: use .resizeTo(w,h) or .cropTo(x,y,w,h)')
	}

	get height(){
		return this.canvas.height;
	}

	set videoWidth(v){
		throw new Error('Vid2Canvas: videoWidth is read-only')
	}

	get videoWidth(){
		return this.video.videoWidth;
	}

	set videoHeight(v){
		throw new Error('Vid2Canvas: videoHeight is read-only')
	}

	get videoHeight(){
		return this.video.videoHeight;
	}


	// -------------------------- private --------------------------

	_setHeightFromWidth( callback ){
		var self = this;
		if( !(this.video.videoWidth>0)  ){
			setTimeout(function(){ self._setHeightFromWidth(callback); }, 100 );
		} else {
			
			this.aspectRatio = this.video.videoWidth/this.video.videoHeight;

			if( this.canvas.height == 0 ){				
				this.canvas.height = this.video.width / this.aspectRatio;				
				// if( this.cropping ){					
				// 	this.canvas.height = this.sHeight
				// } else {
				// 	this.sHeight 		= this.video.height;
				// 	this.canvas.height 	= this.video.height;
				// }
			}

			// read for call back ---------------------------
			self.ready = true; 
			if( typeof callback !== "undefined" ) callback();
		}
		
	}

	// -------------------------- public --------------------------

	set width(v){
		throw new Error('Vid2Canvas: use .resizeTo(w,h) or .cropTo(x,y,w,h)')
	}

	get width(){
		return this.canvas.width;
	}

	set height(v){
		throw new Error('Vid2Canvas: use .resizeTo(w,h) or .cropTo(x,y,w,h)')
	}

	get height(){
		return this.canvas.height;
	}


		/* 		dom methods 		*/
		/* ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  */

	appendTo( selector ) {
		this.parent = document.querySelector( selector );
		this.parent.appendChild( this.canvas );
	}


	remove() {
		if(typeof this.parent !== "undefined"){
			this.parent.removeChild( this.canvas );
		} else {
			console.warn('Vid2Canvas: you must .appendTo(parent) before you can .remove() it');
		}
	}

	css( props ){
		for( var p in props ) this.canvas.style[p] = props[p];
	}

		/* 		to keep canvas up to date w/video element 		*/
		/* ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  */

	update() {
		if ( this.video.readyState === this.video.HAVE_ENOUGH_DATA ){
			// update canvas
			if( this.flip && !this.flipped ){
				this.ctx.scale(-1,1);
				this.flipped = true;
			}
			var w = (this.flip) ? this.canvas.width*-1 : this.canvas.width;
			// this.ctx.drawImage( this.video, 0, 0, this.canvas.width, this.canvas.height );
			// see: https://mdn.mozillademos.org/files/225/Canvas_drawimage.jpg
			if( this.cropping ){
				this.ctx.drawImage(
					this.video, 
					parseFloat(this.sx), parseFloat(this.sy), 
					parseFloat(this.sWidth), parseFloat(this.sHeight), 
					0, 0, w, this.canvas.height
				);
			} else {
				this.ctx.drawImage(
					this.video, 
					0, 0, w, this.canvas.height
					// parseFloat(this.sx), parseFloat(this.sy), 
					// parseFloat(this.sWidth), parseFloat(this.sHeight)
				);
			}
			
		}
	}

		/* 		for video files 		*/
		/* ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  */

	play() {
		this.video.play();
	}

	pause(){
		this.video.pause();
	}

	time(){
		return this.video.currentTime;
	}

	duration(){
		return this.video.duration;
	}

	step(){
		if( this.video.currentTime += 1/this.interval < this.video.duration )
			return this.video.currentTime += 1/this.interval;
		else 
			this.video.currentTime = 0;
	}

	randomFrame(){
		console.log('api called');
		return this.video.currentTime = Math.random()*this.video.duration;
	}

		/* 		general methods		*/
		/* ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  */

	resizeTo( w, h ){
		if( typeof w !== "undefined"){
			if( typeof h !== "undefined" ){
				// this.video.width  = w;
				// this.video.height = h;
				this.canvas.width = w;
				this.canvas.height = h;
				// this.cropTo( undefined, undefined, w, h );
			} else {	
				throw new Error('Vid2Canvas: you havn\'t specified a desired height value');			
				// this.video.width  = w;
				// this.video.height = this.video.width / this.aspectRatio;
				// this.canvas.width = w;
				// this.canvas.height = this.canvas.width / this.aspectRatio;
				// this.cropTo( undefined, undefined, w, this.canvas.width / this.aspectRatio );
			}			
		} else {
			throw new Error('Vid2Canvas: you havn\'t specified a desired width or height value');
		}
	}

	cropTo( x, y, w, h ){
		this.sx 		= (typeof x!=="undefined") ? x : this.sx;
		this.sy 		= (typeof y!=="undefined") ? y : this.sy;
		this.sWidth 	= (typeof w!=="undefined") ? w : this.sWidth;
		this.sHeight 	= (typeof h!=="undefined") ? h : this.sHeight;
		// if(typeof x!=="undefined" || typeof w!=="undefined") 
		this.cropping = true;
		// this.canvas.width = this.sWidth;
		// this.canvas.height = this.sHeight;
	}


	// -------------------------- utils --------------------------

	static LogDevices(){
	
		navigator.mediaDevices.enumerateDevices()
		.then(function( val ){
			console.log( val );
		}, function(err){
			throw new Error('Vid2Canvas:'+err);
		});
	}

}

