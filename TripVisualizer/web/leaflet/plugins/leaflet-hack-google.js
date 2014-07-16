L.Map = L.Map.extend({
    whenReady: function(callback, context) {
        // <HACK>
        if (callback === undefined) {
            callback = function(e) {
                var map = e.target;

                // check in case layer gets added and then removed before the map is ready
                if (!map.hasLayer(this)) {
                    return;
                }

                this._map = map;
                this._zoomAnimated = map._zoomAnimated;

                this.onAdd(map);

                if (this.getAttribution && this._map.attributionControl) {
                    this._map.attributionControl.addAttribution(this.getAttribution());
                }

                if (this.getEvents) {
                    map.on(this.getEvents(), this);
                }

                this.fire('add');
                map.fire('layeradd', {layer: this});
            }
        }
        // </HACK>

        if (this._loaded) {
            callback.call(context || this, {target: this});
        } else {
            this.on('load', callback, context);
        }
        return this;
    }
});