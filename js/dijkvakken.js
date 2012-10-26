/**
 * Dijkvakken class
 * 
 * Voor alle functionaliteit gerelateerd aan boringen
 */
var dijkvakken = {

    id: "dkv",
    /**
     * URL naar een statisch boringen bestand in gml formaat
     */
    url: "gmldata/dijkvakken.gml",
    stylemap: function() {
        if(touchEnabled()){
            return new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    strokeColor: "#006600",
                    strokeWidth: 8,
                    graphicZIndex: 1
                }),
                "select": new OpenLayers.Style({
                    strokeColor: "#cccc00",
                    strokeWidth: 8,
                    graphicZIndex: 2
                })
            });
        } else {
            return new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    strokeColor: "#006600",
                    strokeWidth: 2,
                    graphicZIndex: 1
                }),
                "select": new OpenLayers.Style({
                    strokeColor: "#cccc00",
                    strokeWidth: 2,
                    graphicZIndex: 2
                })
            });
        }
    },

    /**
     * Laag. Wordt geiniteerd met de functie boringen.show() kan worden overruled
     */ 
    layer: null,
    highlightlayer: null,
    /**
     * Initialisatie functie om boringen toe te voegen aan de kaart
     */
    show: function(activate) {
        this.layer = new OpenLayers.Layer.Vector("Dijkvakken", {
            title     : "Dijkvakken",
            projection: "EPSG:28992",
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url:  this.url,
                format: new OpenLayers.Format.GML.v3({
                    featurePrefix: 'opengeo_dijkvak',
                    featureType : "DIJKVAK",
                    featureNS : "http:///opengeo/dijkvak/MapServer/WFSServer",
                    version: "1.1.0",
                    geometryName: 'Shape',
                    srsName: "EPSG:28992"
                })
            }),
            displayInLayerSwitcher: false,
            styleMap: this.stylemap()
        });
        this.highlightlayer = new OpenLayers.Layer.Vector('dijkvak_hl',{    
            visibility: true,
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    pointRadius: 10,
                    strokeColor: "#cccc00",
                    fillColor: "#ffffff",
                    fillOpacity: 0.5,
                    strokeWidth: 2,
                    graphicZIndex: 1
                })
            })
        });
        if(activate === true){
            map.addLayers([this.layer, this.highlightlayer]);
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
                dijkvakken.layer.setVisibility(true);
                dijkvakken.highlightlayer.setVisibility(true);
            } else {
                dijkvakken.unselect();
                dijkvakken.layer.setVisibility(false);
                dijkvakken.highlightlayer.setVisibility(false);
            }
        });
        $('#div_' + this.id).click(function(){
            //$('#cbx_' + this.id.replace('div_','')).trigger('click');
            if ($(this).hasClass('aan')) {
                $(this).removeClass('aan');
                dijkvakken.unselect();
                dijkvakken.layer.setVisibility(false);
                dijkvakken.highlightlayer.setVisibility(false);
            } else {
                $(this).addClass('aan');
                dijkvakken.layer.setVisibility(true);
                dijkvakken.highlightlayer.setVisibility(true);
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
    selectfid: function (fid) {
        var feat = this.layer.getFeatureByFid(fid);
        if (typeof(feat) !== 'undefined') {
            this.select(feat);
        } else {
            alert('onDijkvakSelectId fout: Kan dijkvak niet vinden.');
        }
    },
    select: function(feature){
        if(feature.renderIntent !== "select") {
            selectControl.select(feature);
            return;
        }
        map.zoomToExtent(feature.geometry.getBounds());
        var jstsGeom = convertOlToJstsGeom(feature.geometry);
        try {
            var dijkvakBuffer = jstsGeom.buffer(50);
            var olFeat = convertJstsToOlGeom(dijkvakBuffer);
            this.highlightlayer.removeAllFeatures();
            this.highlightlayer.addFeatures(olFeat);
            // Inzoomen op buffer
            map.zoomToExtent(olFeat.geometry.getBounds());
        } catch(e) {
            //alert(e);
            return;
        }
    
        var prevDijkvak = this.previous(feature);
        if (typeof(prevDijkvak) !== 'undefined') {
            feature.attributes.prevDijkvakFid = prevDijkvak.fid;
        }
    
        var nextDijkvak = this.next(feature);
        if (typeof(nextDijkvak) !== 'undefined') {
            feature.attributes.nextDijkvakFid = nextDijkvak.fid;
        }
    
        if (boringen){
        	var borFeatures = [];
            try {
                borFeatures = getFeaturesForBuffer(boringen.layer, dijkvakBuffer);
            } catch(e) {
                alert('borFeatures fout: ' + e);
            }
            feature.attributes.boringen = borFeatures;
        }
        this.panel(feature);
    },
    unselect: function(){
        this.highlightlayer.removeAllFeatures();
        $('#infopanel').html('');
        $.each(dijkvakken.layer.selectedFeatures, function(idx,feat){
            selectControl.unselect(feat);
        });
        
    },
    /**
     * Zoek het vorige dijkvak. Retourneert leeg wanneer geen dijkvak wordt gevonden
     */
    previous: function (feature) {
        var i;
        for ( i = 0; i < this.layer.features.length; i++) {
            if (this.layer.features[i].attributes.BEGIN === feature.attributes.EIND) {
                return this.layer.features[i];
            }
        }
    },
    /**
     * Zoek het volgende dijkvak. Retourneert leeg wanneer geen dijkvak wordt gevonden
     */
    next: function (feature) {
    	var i;
        for ( i = 0; i < this.layer.features.length; i++) {
            if (this.layer.features[i].attributes.EIND === feature.attributes.BEGIN) {
                return this.layer.features[i];
            }
        }
    },    
    /**
     * Toon een popup
     */
    popup: function(feature){
        if(typeof(onFeatureUnselect) !== "undefined"){
            popup = new OpenLayers.Popup("chicken",
                feature.geometry.getBounds().getCenterLonLat(),
                null,
                this.popupContent(feature,['OBJECTID','Shape']),
                true);
            map.addPopup(popup);
        }
    },
    
    /**
     * Vul de popup met content specifiek voor boringen
     */
    popupContent: function(feature,blacklist){
        var content = "";
        $.each(feature.attributes, function (key, value){
            if($.inArray(key,blacklist) === -1){
                content = content + key + ":" + value + "</br>";
            }
        });
        return content;
    },
    panel: function(feature){
        var dijkvakdiv = $('<div></div>');
	    dijkvakdiv.attr('id', feature.fid);
	    dijkvakdiv.append('<div class="dv_title">'+ feature.attributes.BEGIN + ' -  ' + feature.attributes.EIND + '</div>');
	    if(feature.attributes.boringen) {
	        //lus boringen
	        var bortypedv = [$('<div></div>'),
		        $('<div></div>'),
		        $('<div></div>'),
		        $('<div></div>'),
		        $('<div></div>')
	        ];
	        var bortypedvtitle = [$('<div class="bor_title"><div class="hb"></div>Handboringen</div>'),
		        $('<div class="bor_title"><div class="hbpb"></div>Handboringen met peilbuis</div>'),
		        $('<div class="bor_title"><div class="bpb"></div>Boringen met peilbuis</div>'),
		        $('<div class="bor_title"><div class="mb"></div>Mechanische boringen</div>'),
		        $('<div class="bor_title"><div class="vb"></div>Voorboringen</div>')
	        ];
	        var borsubset = [$('<div class="bor_item"></div>'),
		        $('<div class="bor_item"></div>'),
		        $('<div class="bor_item"></div>'),
		        $('<div class="bor_item"></div>'),
		        $('<div class="bor_item"></div>')
	        ];
	        var countsub = [0,0,0,0,0];
	
	        $.each(feature.attributes.boringen, function(ix, boring){
		        var bdiv = $('<div></div>');
		        popupTekst =  '<span class="bor_datum">' + boring.attributes.DATUM_BORING+ '</span><span class="bor_ident">' + boring.attributes.BORINGIDENT + '</span>';
		        bdiv.append('<div class="bor_id">' + popupTekst + '</div>');
		        var bpdf = $('<a class="pdf"></a>');
		        bpdf.attr('href', 'file:///' + boring.attributes.BESTAND_PDF);
		        bdiv.append(bpdf);
		        var bgef = $('<a class="gef"></a>');
		        bgef.attr('href','file:///' + boring.attributes.BESTAND_GEF);
		        bdiv.append(bgef);
		        bdiv.append('<div style="clear:both;"></div>');
		
		        switch(boring.attributes.TYPE) {
			        case "Handboring":
				        countsub[0]++;
				        borsubset[0].append(bdiv);
				        break;
			        case "Handboring met peilbuis":
				        countsub[1]++;
				        borsubset[1].append(bdiv);
				        break;
			        case "Boring met peilbuis":
				        countsub[2]++;
				        borsubset[2].append(bdiv);
				        break;
			        case "Mechanische boring":
				        countsub[3]++;
				        borsubset[3].append(bdiv);
				        break;
			        case "Voorboring":
				        countsub[4]++;
				        borsubset[4].append(bdiv);
				        break;
			        default: 
				        break;
		        }
	        });
	        var i;
	        for (i = 0; i<bortypedv.length; i++) {
		        if(countsub[i] > 0) {
			        bortypedv[i].addClass('bor_sub');
			        bortypedvtitle[i].append('(' + countsub[i] + ')');
			        bortypedv[i].append(bortypedvtitle[i]);
			        bortypedv[i].append(borsubset[i]);
			        bortypedvtitle[i].click(function(){
				        $(this).parent().children('.bor_item').toggle();
			        });
			        dijkvakdiv.append(bortypedv[i]);
		        }
	        }
        }
    	if(typeof(feature.attributes.prevDijkvakFid) !== "undefined"){
    		var dijkvakprev = $('<div><i class="icon-arrow-left"></i></div>');	
    		dijkvakprev.addClass("dv_begin");
    		dijkvakprev.attr('id', feature.attributes.prevDijkvakFid);
    		dijkvakprev.click(function(){
    			dijkvakken.selectfid(this.id);
    		});
    		dijkvakdiv.append(dijkvakprev);
    	}
    	if(typeof(feature.attributes.nextDijkvakFid) !== "undefined"){
    		var dijkvaknext = $('<div><i class="icon-arrow-right"></i></div>');	
    		dijkvaknext.addClass("dv_eind");
    		dijkvaknext.attr('id', feature.attributes.nextDijkvakFid);
    		dijkvaknext.click(function(){
    			dijkvakken.selectfid(this.id);
    		});
    		dijkvakdiv.append(dijkvaknext);
    	}
    	$('#infopanel').html(dijkvakdiv);
    	if(!$('#tb03').hasClass('close')){
        	$('#tb03').addClass('close');
    	}
    	$('#infopanel').toggle(true);
    }
};
modules.push(dijkvakken);