/*
	
	var fstr = new FilmStrip({ srcs:[ canvas1, canvas2, canvas3, etc ] })
	
*/
class FilmStrip {

	constructor( config ){
		if( typeof config == "undefined")
			throw new Error('FilmStrip: missing config object');

		if( typeof config.srcs == "undefined")
			throw new Error('FilmStrip: you must specify a srcs property, must be an array of canvases');

		this.srcs = config.srcs;
		this.ctxs = [];
		this.width = 0;
		this.height = this.srcs[0].height; // DEFAULTS TO FIRST CANVAS HEIGHT FOR NOW
		for (var i = 0; i < this.srcs.length; i++) {
			this.ctxs.push( this.srcs[i].getContext('2d') );
			this.width += this.srcs[i].width;
		}

		// create canvas element
		this.canvas = document.createElement('canvas');
		this.canvas.width 	= this.width;
		this.canvas.height 	= this.height;
		// document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext( '2d' );
	}

	getFrameData() {

		var start = 0;

		for (var i = 0; i < this.ctxs.length; i++) {
			// var imgData = this.ctxs[i].getImageData( 0,0, this.srcs[i].width, this.srcs[i].height );
			// var data = imgData.data;
			
			if(i-1>=0){ start += this.srcs[i-1].width }
			
			this.ctx.drawImage( this.srcs[i], start, 0 );
		}

		var img = this.canvas.toDataURL();
		img = img.replace(/^data:image\/\w+;base64,/, "");
		return img;

	}
	
}

