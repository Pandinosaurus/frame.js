/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIPanel } from './libs/ui.js';

let scale = 32;

function TimelineAnimationBlock( editor, animation ) {

	var signals = editor.signals;

	var dom = document.createElement( 'div' );
	dom.className = 'block';
	dom.style.position = 'absolute';
	dom.style.height = '31px';
	dom.addEventListener( 'click', function ( event ) {

		editor.selectAnimation( animation );

	} );
	dom.addEventListener( 'mousedown', function ( event ) {

		var movementX = 0;
		var movementY = 0;

		function onMouseMove( event ) {

			movementX = event.movementX | event.webkitMovementX | event.mozMovementX | 0;

			animation.start += movementX / scale;
			animation.end += movementX / scale;

			if ( animation.start < 0 ) {

				var offset = - animation.start;

				animation.start += offset;
				animation.end += offset;

			}

			movementY += event.movementY | event.webkitMovementY | event.mozMovementY | 0;

			if ( movementY >= 30 ) {

				animation.layer = animation.layer + 1;
				movementY = 0;

			}

			if ( movementY <= -30 ) {

				animation.layer = Math.max( 0, animation.layer - 1 );
				movementY = 0;

			}

			signals.animationModified.dispatch( animation );

		}

		function onMouseUp( event ) {

			document.removeEventListener( 'mousemove', onMouseMove );
			document.removeEventListener( 'mouseup', onMouseUp );

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}, false );

	var resizeLeft = document.createElement( 'div' );
	resizeLeft.style.position = 'absolute';
	resizeLeft.style.width = '6px';
	resizeLeft.style.height = '30px';
	resizeLeft.style.cursor = 'w-resize';
	resizeLeft.addEventListener( 'mousedown', function ( event ) {

		event.stopPropagation();

		var movementX = 0;

		function onMouseMove( event ) {

			movementX = event.movementX | event.webkitMovementX | event.mozMovementX | 0;

			animation.start += movementX / scale;

			signals.animationModified.dispatch( animation );

		}

		function onMouseUp( event ) {

			if ( Math.abs( movementX ) < 2 ) {

				editor.selectAnimation( animation );

			}

			document.removeEventListener( 'mousemove', onMouseMove );
			document.removeEventListener( 'mouseup', onMouseUp );

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}, false );
	dom.appendChild( resizeLeft );

	var name = document.createElement( 'div' );
	name.className = 'name';
	dom.appendChild( name );

	var resizeRight = document.createElement( 'div' );
	resizeRight.style.position = 'absolute';
	resizeRight.style.right = '0px';
	resizeRight.style.top = '0px';
	resizeRight.style.width = '6px';
	resizeRight.style.height = '30px';
	resizeRight.style.cursor = 'e-resize';
	resizeRight.addEventListener( 'mousedown', function ( event ) {

		event.stopPropagation();

		var movementX = 0;

		function onMouseMove( event ) {

			movementX = event.movementX | event.webkitMovementX | event.mozMovementX | 0;

			animation.end += movementX / scale;

			signals.animationModified.dispatch( animation );

		}

		function onMouseUp( event ) {

			if ( Math.abs( movementX ) < 2 ) {

				editor.selectAnimation( animation );

			}

			document.removeEventListener( 'mousemove', onMouseMove );
			document.removeEventListener( 'mouseup', onMouseUp );

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}, false );
	dom.appendChild( resizeRight );

	dom.addEventListener('dblclick', function(event) {
		event.stopPropagation();  // Prevent container's dblclick from firing
		
		// Switch to curve editor
		editor.signals.showCurves.dispatch(animation.id);
	});

	// Add waveform handling

	async function updateWaveform() {
		const source = animation.effect.source;
		if (source && source.match(/document\.createElement\(\s*['"]audio['"]\s*\)/)) {
			const srcMatch = source.match(/\.src\s*=\s*['"](.+?)['"];?/);
			if (srcMatch && srcMatch[1]) {
				const audioUrl = srcMatch[1];
				
				try {
					const response = await fetch(audioUrl);
					const arrayBuffer = await response.arrayBuffer();
					
					// Create offline context and decode audio
					const offlineContext = new OfflineAudioContext({
						numberOfChannels: 1,
						length: 44100 * 2,
						sampleRate: 44100
					});
					
					const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
					const duration = audioBuffer.duration;
					
					// Create new context with correct duration
					const finalContext = new OfflineAudioContext({
						numberOfChannels: 1,
						length: Math.ceil(44100 * duration),
						sampleRate: 44100
					});
					
					const source = finalContext.createBufferSource();
					source.buffer = audioBuffer;
					source.connect(finalContext.destination);
					source.start();
					
					const renderedBuffer = await finalContext.startRendering();
					const channelData = renderedBuffer.getChannelData(0);
					
					// Create SVG path
					let path = 'M 0 15 ';
					const width = duration;
					const height = 30;
					const increment = 20;

					// Calculate width based on total samples
					const samplesPerSecond = 44100;
					const totalSamples = Math.floor(duration * samplesPerSecond);
					const sliceWidth = width / (totalSamples / increment);

					// Draw samples
					for (let i = 0; i < totalSamples; i += increment) {
						const x = (i / increment) * sliceWidth;
						const y = channelData[i];
						
						const yPos = (y * height / 2) + height / 2;
						path += `L ${x} ${yPos} `;
					}
					
					// Create SVG element
					const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
					svg.setAttribute('width', width);
					svg.setAttribute('height', height);
					svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
					svg.setAttribute('preserveAspectRatio', 'none');
					svg.style.position = 'absolute';
					svg.style.left = '0';
					svg.style.top = '0';
					svg.style.width = width * scale + 'px';
					svg.style.pointerEvents = 'none';
					
					// Add waveform path
					const waveform = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					waveform.setAttribute('d', path);
					waveform.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
					waveform.setAttribute('stroke-width', '1');
					waveform.setAttribute('vector-effect', 'non-scaling-stroke');
					waveform.setAttribute('fill', 'none');
					svg.appendChild(waveform);
					
					// Add new waveform
					dom.appendChild(svg);

				} catch (error) {
					console.error('Error generating waveform:', error);
				}
			}
		}
	}

	//

	function getAnimation() {

		return animation;

	}

	function select() {

		dom.classList.add( 'selected' );

	}

	function deselect() {

		dom.classList.remove( 'selected' );

	}

	function update() {

		animation.enabled === false ? dom.classList.add( 'disabled' ) : dom.classList.remove( 'disabled' );

		dom.style.left = ( animation.start * scale ) + 'px';
		dom.style.top = ( animation.layer * 32 ) + 'px';
		dom.style.width = ( ( animation.end - animation.start ) * scale ) + 'px';

		name.innerHTML = animation.name + ' <span style="opacity:0.5">' + animation.effect.name + '</span>';

		const lastChild = dom.lastChild;

		if ( lastChild.tagName === 'svg' ) {
			const width = Number(lastChild.attributes.width.value);
			lastChild.style.width = ( width * scale ) + 'px';
		}
		
	}

	update();
	updateWaveform();

	return {
		dom: dom,
		getAnimation: getAnimation,
		select: select,
		deselect: deselect,
		update: update
	};

}

function TimelineAnimations( editor ) {

	var signals = editor.signals;

	var container = new UIPanel();
	container.setHeight( '100%' );
	container.setBackground( 'linear-gradient(#555 1px, transparent 1px) 0% 0% / 32px 32px repeat' );

	container.dom.addEventListener( 'dblclick', function ( event ) {

		var start = event.offsetX / scale;
		var end = start + 2;
		var layer = Math.floor( event.offsetY / 32 );

		editor.createAnimation( start, end, layer );

	} );

	// signals

	var blocks = {};
	var selected = null;

	signals.animationAdded.add( function ( animation ) {

		var block = new TimelineAnimationBlock( editor, animation );
		container.dom.appendChild( block.dom );

		blocks[ animation.id ] = block;

	} );

	signals.animationModified.add( function ( animation ) {

		blocks[ animation.id ].update();

	} );

	signals.animationSelected.add( function ( animation ) {

		if ( blocks[ selected ] !== undefined ) {

			blocks[ selected ].deselect();

		}

		if ( animation === null ) return;

		selected = animation.id;
		blocks[ selected ].select();

	} );

	signals.animationRemoved.add( function ( animation ) {

			var block = blocks[ animation.id ];
			container.dom.removeChild( block.dom );

			delete blocks[ animation.id ];

	} );

	signals.timelineScaled.add( function ( value ) {

		scale = value;

		for ( var key in blocks ) {

			blocks[ key ].update();

		}

	} );

	signals.animationRenamed.add( function ( animation ) {

		blocks[ animation.id ].update();

	} );

	signals.effectRenamed.add( function ( effect ) {

		for ( var key in blocks ) {

			var block = blocks[ key ];

			if ( block.getAnimation().effect === effect ) {

				block.update();

			}

		}

	} );

	return container;

}

export { TimelineAnimations };
