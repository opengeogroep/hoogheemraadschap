/**
 * Boringen class
 * 
 * Voor alle functionaliteit gerelateerd aan boringen
 */
var boringen = {
    id: 'bor',
    /**
     * URL naar een statisch boringen bestand in gml formaat
     */
    url: "gmldata/boringen.gml",
    stylemap: function() {
        if(touchEnabled()){
            return new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    pointRadius: 12,
                    strokeWidth: 2,
                    graphicZIndex: 1
                }),
                "select": new OpenLayers.Style({
                    pointRadius: 14,
                    strokeWidth: 4,
                    graphicZIndex: 2
                })
            });
        } else {
            return new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    pointRadius: 4,
                    strokeWidth: 2,
                    graphicZIndex: 1
                }),
                "select": new OpenLayers.Style({
                    pointRadius: 6,
                    strokeWidth: 4,
                    graphicZIndex: 2
                })
            });
        }
    },
    symbolizers: function(){
        if(touchEnabled()){
            return {
                'Handboring':              {strokeColor: '#555555', fillColor: '#ff00ff', fillOpacity: 1, strokeWidth: 1},
                'Handboring met peilbuis': {strokeColor: '#3388ff', fillColor: '#ff00ff', fillOpacity: 1, strokeWidth: 2},
                'Boring met peilbuis':     {strokeColor: '#3388ff', fillColor: '#ff0000', fillOpacity: 1, strokeWidth: 2},
                'Mechanische boring':      {strokeColor: '#555555', fillColor: '#ff0000', fillOpacity: 1, strokeWidth: 1},
                'Voorboring':              {strokeColor: '#555555', fillColor: '#00ffff', fillOpacity: 1, strokeWidth: 1}
            };
        } else {
            return {
                'Handboring':              {strokeColor: '#555555', fillColor: '#ff00ff', fillOpacity: 1, strokeWidth: 1},
                'Handboring met peilbuis': {strokeColor: '#3388ff', fillColor: '#ff00ff', fillOpacity: 1, strokeWidth: 2},
                'Boring met peilbuis':     {strokeColor: '#3388ff', fillColor: '#ff0000', fillOpacity: 1, strokeWidth: 2},
                'Mechanische boring':      {strokeColor: '#555555', fillColor: '#ff0000', fillOpacity: 1, strokeWidth: 1},
                'Voorboring':              {strokeColor: '#555555', fillColor: '#00ffff', fillOpacity: 1, strokeWidth: 1}
            };
        }
        
    },
    /**
     * Laag. Wordt geiniteerd met de functie boringen.show() kan worden overruled
     */ 
    layer: null,
    
    /**
     * Initialisatie functie om boringen toe te voegen aan de kaart
     */
    show: function(activate) {
        var mystylemap = this.stylemap();
        mystylemap.addUniqueValueRules('default', 'TYPE', this.symbolizers());
        this.layer = new OpenLayers.Layer.Vector("Boringen", {
            title     : "Boringen",
            projection: "EPSG:28992",
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url:  this.url,
                format: new OpenLayers.Format.GML.v3({
                    featurePrefix: 'opengeo_boringen',
                    featureType : "BORINGEN",
                    featureNS : "http:///opengeo/boringen/MapServer/WFSServer",
                    version: "1.1.0",
                    geometryName: 'Shape',
                    srsName: "EPSG:28992"
                })
            }),
            displayInLayerSwitcher: false,
            styleMap: mystylemap
        });

        if(activate === true){
            map.addLayers([this.layer]);
            this.activateSelect();
        }
        // vinkje op webpagina aan/uitzetten
        var dv_div = $('<div id="div_' + this.id + '" class="ovl aan"></div>');
        var dv_cbx = $('<input type="checkbox" id="cbx_' + this.id + '" name="' + this.layer.name + '" />');
        dv_div.append(dv_cbx);
        dv_div.append(this.layer.name);
        $('#overlaypanel').append(dv_div);
        $('#cbx_' + this.id).attr('checked', this.layer.visibility);
        $('#cbx_' + this.id).click(function(){
            if (this.checked === true) {
                boringen.layer.setVisibility(true);
            } else {
                boringen.layer.setVisibility(false);
            }
        });
        $('#div_' + this.id).click(function(){
            if ($(this).hasClass('aan')) {
                $(this).removeClass('aan');
                boringen.layer.setVisibility(false);
            } else {
                $(this).addClass('aan');
                boringen.layer.setVisibility(true);
            }
        });
    },
    
    /**
     * Activeer de selecteer functie voor de boringen laag
     */
    activateSelect: function(){
        if(selectControl) {
            var lays = selectControl.layers;
            lays.push(this.layer);
            selectControl.setLayer(lays);
        }
    },
    select: function(feature){
    	this.panel(feature);
    },
    unselect: function(){
        $('#infopanel').html('');
        $.each(boringen.layer.selectedFeatures, function(idx,feat){
            selectControl.unselect(feat);
        });
        
    },
    panel: function(feature){
        var boringdiv = $('<div></div>');
	    boringdiv.attr('id', feature.fid);
	    boringdiv.append('<div class="dv_title">'+ feature.attributes.BORINGIDENT + '</div>');
        popupTekst = '<p>Datum: <span class="bor_datum">' + feature.attributes.DATUM_BORING + '</span></p>';
        popupTekst += '<p>Identificatie: <span class="bor_ident">' + feature.attributes.BORINGIDENT + '</span></p>';
        popupTekst += '<p>Bedrijf: <span class="bor_ident">' + feature.attributes.BEDRIJF + '</span></p>';
        popupTekst += '<p>Methode: <span class="bor_ident">' + feature.attributes.METHODE_BORING + '</span></p>';
        popupTekst += '<p>Diepte: <span class="bor_ident">' + feature.attributes.EINDDIEPTE + ' m</span></p>';
        popupTekst += '<p>Maaiveld: <span class="bor_ident">' + feature.attributes.MV_NAP + ' t.o.v. NAP</span></p>';
        popupTekst += '<p>Type boring: <span class="bor_ident">' + feature.attributes.TYPE + '</span></p>';
        if (feature.attributes.PEILBUIS_AANWEZIG !== "Nee"){
            popupTekst += '<p><span class="bor_ident">Peilbuis aanwezig</span></p>';
        }
        var bordetails = $('<div class="bor_details"></div>'); 
        bordetails.append(popupTekst);
        //boringdiv.append('<div class="bor_id">' + popupTekst + '</div>');
        var bpdf = $('<a class="pdf_big"></a>');
        bpdf.attr('href', 'file:///' + feature.attributes.BESTAND_PDF);
        bordetails.append($('<div style="float:left;"></div>').append(bpdf));
        var bgef = $('<a class="gef_big"></a>');
        bgef.attr('href','file:///' + feature.attributes.BESTAND_GEF);
        bordetails.append($('<div style="float:right;"></div>').append(bgef));
        bordetails.append($('<div style="clear:both;"></div>'));
        boringdiv.append(bordetails);
    	$('#infopanel').html(boringdiv);
    	if(!$('#tb03').hasClass('close')){
        	$('#tb03').addClass('close');
    	}
    	$('#infopanel').toggle(true);
    }
};
modules.push(boringen);
