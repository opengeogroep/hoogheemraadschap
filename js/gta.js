// Algemene instellingen
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
OpenLayers.Util.onImageLoadErrorColor = "transparent";
OpenLayers.ImgPath = "js/OpenLayers-2.12/img/";

Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs <>";

var info_text = 
  '<div class="uitleg">' +
	  '<h3>Mobiel</h3>' +
		'<p>Gebruik twee vingers om in of uit te zoomen (vingers naar- of van elkaar brengen), druk met een vinger op een object om te selecteren en info te tonen. Sleep met een vinger om de kaart te verschuiven</p>' +
		'<h3>Desktop</h3>' +
		'<p>Gebruik het muiswiel om in of uit te zoomen, klik op een object om het te selecteren en info te tonen, houd de linker muisknop ingedrukt om de kaart te slepen</p>' +
		'<h3>Knop functies</h3>' +
		'<p><ul class="icons">' +
	    '<li><i class="icon-screenshot"></i>Activeer (of deactiveer) GPS. Bij geactiveerde GPS zal de locatie de kaart telkens centreren op uw positie</li>' +
	  	'<li><i class="icon-map-marker"></i>Kies welke lagen zichtbaar zijn; dijkvakken en/of boringen</li>' +
	  	'<li><i class="icon-globe"></i>Kies een ondergrondkaart. Momenteel kan worden gekozen voor een ondergrond met of zonder gebouwen</li>' +
	  	'<li><i class="icon-info-sign"></i>Handleiding of informatie over een boring of dijkvak</li>' +
	  '</ul></p>' +
    '<img src="images/hhnk_logo_trans.png"/>' +
	'</div>'

// globale variabelen
var map;
var selectControl;
var baselayers = [];
var overlays = [];
var wfslayers = [];
var modules = [];

/**
 *  Functie voor updaten van de zichtbaarheid van baselayers
 */
function toggleBaseLayer(nr) {
    var layerbuttons = $(".bl");
    var i;
    for(i = 0; i < layerbuttons.length; i++){
        if(i !== nr){
            $(layerbuttons[i]).removeClass("layActive", true);
            baselayers[i].setVisibility(false);
        } else {
          $(layerbuttons[nr]).addClass("layActive", true);
          baselayers[nr].setVisibility(true);
          map.setBaseLayer(baselayers[nr]);
        }
    }
}

/**
 * script voor updaten zichtbaarheid van overlays 
 */
function toggleOverlay(obj) {
    var layers = map.getLayersByName(obj.name);
    if (layers.length === 1) {
        if (obj.checked === true) {
            layers[0].setVisibility(true);
        } else {
            layers[0].setVisibility(false);
        }
    } else {
         alert('layer niet gevonden (of meer dan 1)');
    }
}

/**
 * Acties op basis van een click in de kaart op een laag waarvoor de select
 * functie aanstaat. 
 * 
 * 1. Controleer of een module actief is
 * 2. Controleer of de laag voor de feature gelijk is aan die van de module
 * 3. Geef de feature door aan de betreffende module
 * 
 * @param feature
 */
function onFeatureSelect(feature) {
	$('#tb03').toggleClass('active');
	$.each(modules, function (mod_index, module){
		if (feature.layer.name === module.layer.name) {
	        module.select(feature);
        }
	});
}

/**
 * Sluit popups en panels behorende bij een eerder geselecteerde feature
 * 
 * 1. Sluit alle popups
 * 2. Controleer of een module actief is
 * 3. Controleer of de laag van de feature gelijk is aan die van de module
 * 4. Geef de feature door aan de betreffende module
 * 
 * @param feature
 */
function onFeatureUnselect(feature) {

	var i;
    for (i = 0; i<map.popups.length; i++) {
        map.popups[i].destroy();
    }
	$.each(modules, function (mod_index, module){
		if (feature.layer.name === module.layer.name) {
	        module.unselect();
        }
	});
  $('#infopanel').html(info_text);
}

/**
 * Initialiseer de OpenLayers Applicatie
 */
function init(){
    var options = {
        div: 'mapc1map1',
        projection: new OpenLayers.Projection("EPSG:28992"),
        units: "m",
        // Resoluties uit de Nederlandse tiling-richtlijn (www.geonovum.nl/index.php/tiling)
        resolutions: [860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210, 0.105, 0.0525],
        maxExtent: new OpenLayers.Bounds(-65200.96, 242799.04, 375200.96, 68320096)
    };
    
    map = new OpenLayers.Map(options);
    OpenLayers.Lang.setCode("nl");
    baselayers[0] = new OpenLayers.Layer.WMS('BRT achtergrond','http://geodata.nationaalgeoregister.nl/wmsc?',
            {layers: "brtachtergrondkaart", format: "image/png8", transparent: false, bgcolor: "0x99b3cc"},
            {transitionEffect: 'resize',singleTile: false, buffer: 0, isBaseLayer: true, visibility: true, attribution: "PDOK"});

    //baselayers[0] = new OpenLayers.Layer.WMS(
    //        "Openstreetmap",
    //        'http://gis.kademo.nl/cgi-bin/tilecache.cgi?',
    //        {layers: "osm", format: "image/png", transparent: false, bgcolor: "0x99b3cc"},
    //        {transitionEffect: 'resize',singleTile: false, buffer: 0, isBaseLayer: true, visibility: true, attribution: "osm enz.."});
    baselayers[1] = new OpenLayers.Layer.TMS( "osm-rd-TMS",
        "http://openbasiskaart.nl/mapcache/tms/",
        { layername: 'osm@rd', type: "png", serviceVersion:"1.0.0",
          gutter:0,buffer:0,isBaseLayer:true,transitionEffect:'resize',
          tileOrigin: new OpenLayers.LonLat(-285401.920000,22598.080000),
          resolutions:[3440.63999999999987267074,1720.31999999999993633537,860.15999999999996816769,430.07999999999998408384,215.03999999999999204192,107.51999999999999602096,53.75999999999999801048,26.87999999999999900524,13.43999999999999950262,6.71999999999999975131,3.35999999999999987566,1.67999999999999989342,0.84000000000000003553,0.42000000000000001776,0.21000000000000000888],
          zoomOffset:0,
          units:"m",
          maxExtent: new OpenLayers.Bounds(-285401.920000,22598.080000,595401.920000,903401.920000),
          projection: new OpenLayers.Projection("epsg:28992".toUpperCase()),
          sphericalMercator: false
        }
    );        

    map.addLayers(baselayers);

    // Voeg hhnk services toe (uitgeschakeld voor de mobiele client
    hhnkServices = [
        /*
        {sid: "Dkr", service: 'dijkringgebieden_rwk', layernaam: 'Dijkringgebieden', visible: false},
        {sid: "Dwl", service: 'dwarsprofiellijn', layernaam: 'Dwarsprofiellijnen', visible: false},
        {sid: "Dwp", service: 'dwarsprofielpunt', layernaam: 'Dwarsprofielpunten', visible: false},
        {sid: "Fot", service: 'foto', layernaam: 'Fotos', visible: false},
        {sid: "Lpr", service: 'geotechnische_lengteprofielen', layernaam: 'Lengteprofielen', visible: false},
        {sid: "Lab", service: 'laboratoriumproeven', layernaam: 'Lab-proeven', visible: false},
        {sid: "Pbr", service: 'peilbuisraai', layernaam: 'Peilbuisraaien', visible: false},
        {sid: "Pbz", service: 'peilbuizen', layernaam: 'Peilbuizen', visible: false},
        {sid: "Pol", service: 'poldergebieden', layernaam: 'Poldergebieden', visible: false},
        {sid: "Son", service: 'sonderingen', layernaam: 'Sonderingen', visible: false},
        {sid: "Vbo", service: 'voorboringen', layernaam: 'Voorboringen', visible: false}
        */
    ];
    $('#overlaypanel').append('<div class="baselayertitle">Lagen (aan/uit):</div>');
    // Voeg de baselayers toe aan de baselayer panel
    $('#baselayerpanel').append('<div class="baselayertitle">Selecteer kaart:</div>');
    $.each(baselayers, function (bl_index, bl){
        $('#baselayerpanel').append('<div class="bl" onclick="toggleBaseLayer(' + bl_index + ');">'+ bl.name + '</div>');
    });

   /**
    * Initialiseer de selectFeature Control
    * 
    * De lagen worden in de afzonderlijke modules toegevoegd 
    * indien deze de selectFeature Control ondersteunen
    */
   selectControl = new OpenLayers.Control.SelectFeature(
        [],
        {
            onSelect: onFeatureSelect,
            onUnselect: onFeatureUnselect,
            clickout: false, toggle: true,
            multiple: false, hover: false,
            toggleKey: "ctrlKey", // ctrl key removes from selection
            multipleKey: "shiftKey" // shift key adds to selection
        }
    );
    map.addControl(selectControl);
    selectControl.activate();
    
	$.each(modules, function (mod_index, module){
        module.show(true);
 	});
	
    toggleBaseLayer(1);
    // Centreren op Heerhugowaard
    map.setCenter(new OpenLayers.LonLat(117500, 519500), 5);

    // Tonen RD-coordinaten
    var mousePos = new OpenLayers.Control.MousePosition({numDigits:0, div: OpenLayers.Util.getElement('coords')});
    map.addControl(mousePos);
    if(geolocate){
    	map.addLayers([vector]);
    	map.addControl(geolocate);
    }
    scalebar = new OpenLayers.Control.ScaleLine();
    map.addControl(scalebar);
    
}

$(document).ready(function() {
  init();
  //schrijf eerst een stuk help-tekst in het infopanel waarmee gebruikers wordt uitgelegd hoe ze de app moeten gebruiken
  $('#infopanel').html(info_text);
  
  $('.mtab').click(function(){
	$(this).toggleClass('active');
	if(this.id === "tb04"){
        if($(this).hasClass('active') === true){
        	geolocate.activate();
        } else {
        	vector.removeAllFeatures();
        	geolocate.deactivate();
        }
    }
    if(this.id === "tb03"){
        $('#infopanel').toggle();
    }
    if(this.id === "tb02"){
        $('#baselayerpanel').toggle();
    }
    if(this.id === "tb01"){
        $('#overlaypanel').toggle();
    }
  });
});
