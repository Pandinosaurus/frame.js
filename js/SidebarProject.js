/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIBreak, UIButton, UIDiv, UIInput, UIPanel, UIRow, UIText } from './libs/ui.js';

function SidebarProject( editor ) {

	const frame = editor.frame;
	const signals = editor.signals;

	var container = new UIPanel();
	container.setId( 'project' );

	// Config

	container.add( new UIText( 'Config' ).setTextTransform( 'uppercase' ) );
	container.add( new UIBreak(), new UIBreak() );

	// Name

	var row = new UIRow();
	row.add( new UIText( 'Name' ).setWidth( '90px' ) );
	container.add( row );

	var name = new UIInput( frame.name ).setWidth( '130px' );
	name.onChange( function () {
		editor.setName( this.getValue() );
	} );
	row.add( name );

	//

	var row = new UIRow();
	row.add( new UIText( 'Duration' ).setWidth( '90px' ) );
	container.add( row );

	function toSeconds( time ) {

		const parts = time.split( ':' );
		return parseInt( parts[ 0 ] ) * 60 + parseInt( parts[ 1 ] );

	}

	function fromSeconds( seconds ) {

		var minute = Math.floor( seconds / 60 );
		var second = Math.floor( seconds % 60 );

		return `${ minute }:${ second.toString().padStart( 2, '0' ) }`;

	}

	var duration = new UIInput( '2:00' ).setWidth( '80px' );
	duration.onChange( function () {

		editor.setDuration( toSeconds( this.getValue() ) );

	} );
	row.add( duration );

	container.add( new UIBreak() );

	// Setup

	function buildScript( id ) {

		var script = frame.scripts[ id ];

		var div = new UIDiv().setMarginBottom( '4px' );

		var name = new UIInput( script.name ).setWidth( '130px' );
		name.onChange( function () {

			editor.renameScript( script, this.getValue() );

		} );
		div.add( name );

		var edit = new UIButton( 'Edit' );
		edit.setMarginLeft( '6px' );
		edit.onClick( function () {

			editor.selectScript( script );

		} );
		div.add( edit );

		var remove = new UIButton( 'Remove' );
		remove.setMarginLeft( '6px' );
		remove.onClick( function () {

			if ( confirm( 'Are you sure?' ) ) {

				editor.removeScript( script );

			}

		} );
		div.add( remove );

		return div;

	}

	container.add( new UIText( 'Setup' ).setTextTransform( 'uppercase' ) );
	container.add( new UIBreak(), new UIBreak() );

	var scriptsContainer = new UIRow();
	container.add( scriptsContainer );

	var addScript = new UIButton( 'Add' );
	addScript.onClick( function () {

		editor.createScript();

	} );
	container.add( addScript );

	var reload = new UIButton( 'Reload All' );
	reload.onClick( async function () {

		await editor.reloadScripts();

		frame.timeline.reset();
		frame.timeline.update( frame.player.currentTime );

	} );
	reload.setMarginLeft( '4px' );
	container.add( reload );

	container.add( new UIBreak(), new UIBreak() );

	// Effects

	function buildEffect( id ) {

		var effect = frame.effects[ id ];

		var div = new UIDiv().setMarginBottom( '4px' );

		var name = new UIInput( effect.name ).setWidth( '130px' );
		name.onChange( function () {

			editor.renameEffect( effect, this.getValue() );

		} );
		div.add( name );

		var edit = new UIButton( 'Edit' );
		edit.setMarginLeft( '6px' );
		edit.onClick( function () {

			editor.selectEffect( effect );

		} );
		div.add( edit );

		return div;

	}

	container.add( new UIText( 'Effects' ).setTextTransform( 'uppercase' ) );
	container.add( new UIBreak(), new UIBreak() );

	var effectsContainer = new UIRow();
	container.add( effectsContainer );

	var addEffect = new UIButton( 'Add' );
	addEffect.onClick( function () {

		editor.createEffect();

	} );
	container.add( addEffect );

	var cleanEffects = new UIButton( 'Remove unused' );
	cleanEffects.setMarginLeft( '4px' );
	cleanEffects.onClick( function () {

		editor.cleanEffects();

	} );
	container.add( cleanEffects );

	container.add( new UIBreak(), new UIBreak() );

	//

	function update() {

		updateConfig();
		updateScripts();
		updateEffects();

	}

	function updateConfig() {

		name.setValue( frame.name );
		duration.setValue( fromSeconds( frame.duration ) );

	}

	function updateScripts() {

		scriptsContainer.clear();

		var scripts = frame.scripts;

		for ( let i = 0; i < scripts.length; i ++ ) {

			scriptsContainer.add( buildScript( i ) );

		}

	}

	function updateEffects() {

		effectsContainer.clear();

		var effects = frame.effects;

		for ( let i = 0; i < effects.length; i ++ ) {

			effectsContainer.add( buildEffect( i ) );

		}

	}

	// signals

	signals.projectLoaded.add( update );
	signals.editorCleared.add( update );

	signals.scriptAdded.add( updateScripts );
	signals.scriptRemoved.add( updateScripts );

	signals.effectAdded.add( updateEffects );
	signals.effectRemoved.add( updateEffects );

	return container;

}

export { SidebarProject };
