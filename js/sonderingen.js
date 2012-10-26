/**
 * Sonderingen class
 * 
 * Voor alle functionaliteit gerelateerd aan boringen
 */
var sonderingen = {

    /**
     * URL naar een statisch boringen bestand in gml formaat
     */
    url: "gmldata/sonderingen.gml",
    stylemap: new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({
            pointRadius: 4, 
            strokeColor: '#55ff55', 
            fillColor: '#cccccc', 
            fillOpacity: 1, 
            strokeWidth: 1,
            graphicZIndex: 1
        }),
        "select": new OpenLayers.Style({
            pointRadius: 4, 
            strokeColor: '#55ff55', 
            fillColor: '#ffffff', 
            fillOpacity: 1, 
            strokeWidth: 2,
            graphicZIndex: 2
            
        })
    }),
    /**
     * Laag. Wordt geiniteerd met de functie boringen.show() kan worden overruled
     */ 
    layer: null,
    
    /**
     * Initialisatie functie om boringen toe te voegen aan de kaart
     */
    show: function(activate) {
        this.layer = new OpenLayers.Layer.Vector("Sonderingen", {
            title     : "Sonderingen",
            projection: "EPSG:28992",
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url:  this.url,
                format: new OpenLayers.Format.GML({
                    featurePrefix: 'opengeo_sonderingen',
                    featureType : "SONDERINGEN",
                    featureNS : "http:///opengeo/sonderingen/MapServer/WFSServer",
                    version: "1.1.0",
                    geometryName: 'Shape',
                    srsName: "EPSG:28992"
                })
            }),
            displayInLayerSwitcher: false//,
            //styleMap: this.stylemap
        });

        if(activate === true){
            map.addLayers([this.layer]);
            this.activateSelect();
        }
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
    }
};
