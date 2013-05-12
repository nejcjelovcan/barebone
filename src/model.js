
var oldBackboneSync = Backbone.sync;
/*
    Custom barebone sync
    
    Takes url:
    1. takes url from options
    2. if falsy, takes from model/collection (property or method 'url')
    3. if falsy, takes from config.urlRoot, appends model.modelName and id if model has one
    
    Merges queryParams in this order:
    1. config.queryParams (property or method)
    2. model/collection.queryParams || model.collection.queryParams (calls .getForQuery(parent))
    3. options.queryParams

    Maps with barebone.QueryParams.serialize()
    (according to config.queryParamsMap)
    Appends params as querystring to url from first step

    Calls old Backbone.sync with updated options.url
*/
barebone.sync_api = function (method, model, options) {
    var finalParams = _({}).extend(_(barebone.config).result('queryParams')),
        isModel = Backbone.Model.prototype.isPrototypeOf(model),
        modelName = isModel ? model.modelName : (model.model && model.model.modelName); // if collection, take from model
    if (model.queryParams) { _(finalParams).extend(model.queryParams.getForQuery()); }
    else if (isModel && model.collection && model.collection.queryParams) {
        _(finalParams).extend(model.queryParams.getForQuery(true));
    }
    _(finalParams).extend(options.queryParams || {});
    options.url = options.url || _(model).result('url') || ((barebone.config.urlRoot + modelName + '/') + (isModel && model.has('id') ? model.get('id') : ''));
    options.url += '?' + $.param(barebone.QueryParams.serialize(finalParams));

    console.log('BACKBONE.SYNC', method, model, options);
    //return Backbone.sync(method, model, options);
};

barebone.config = _(barebone.config || {}).extend({
    urlRoot: '/site/api/',

    // schemas: { modelName: {modelAttr: {}} },
    types: {    // types used to set getter and setter for given schema attribute type name
        string: { setter: function (val) { return ''+val; } },
        'boolean': { setter: function (val) { return !!val; } },
        integer: { setter: function(val) { return parseInt(val, 10); } },
        'float': { setter: function(val) { return parseFloat(val); } },
        datetime: { setter: function(val) {
            return Date.prototype.isPrototypeOf(val) ? val : new Date(val);
        } }
    },

    // default query parameters for every request
    queryParams: function () {
        return {apikey: '_fyvqr_rkgenpg:cqwqVHEESyWgZUes'};
    },

    queryParamsMap: {
        serializer: 'serializer',
        pageSize: 'page_size',
        page: 'page',
        ordering: 'ordering'
    },

    responseParamsMap: {
        count: 'count',
        results: 'results'
    },

    defaultPageSize: 50
    
});
_(barebone.config.schemas||{}).each(function (schema, modelName) {barebone.config.addSchema(modelName, schema);});

/*
    Takes options.parent Collection or Model
    calls .fetch on parent when change happens

    also holds count attribute (which is ignored for autofetch)
*/
barebone.QueryParams = Backbone.Model.extend({
    initialize: function (attrs, options) {
        _(this).bindAll('on_change');
        options || (options = {});
        this.parent = options.parent;
        this.on('change', this.on_change);
    },
    on_change: function () {
        var changed = this.changedAttributes();
        if (changed && _(changed).keys().length === 1 && 'count' in changed) {
            // only 'count' has changed, ignore auto fetch
        } else if (this.parent) {
            this.parent.fetch();
        }
    },
    getForQuery: function (parent) {
        if (parent) return _(this.attributes).pick('serializer');
        return _(this.attributes).omit('count');
    },
    getPages: function () {
        return Math.ceil(this.get('count')/this.get('pageSize')||barebone.config.defaultPageSize);
    },
    nextPage: function () {
        this.set('page', this.get('page') + 1);
    },
    prevPage: function () {
        this.set('page', this.get('page') - 1);
    }
}, {
    serialize: function (attrs) {
        var obj = {};
        _(attrs || this.attributes).each(function (val, key) {
            if (key in barebone.config.queryParametersMap) key = barebone.config.queryParametersMap[key];
            else if (val === true) obj[key] = 'True';
            else if (val === false) obj[key] = 'False';
            else obj[key] = this.attributes;
        });
        return obj;
    }
});

/*
    setQueryParams(attributes, options) /or (key, val)
    takes options.fetch=false or options.silent=true to prevent autofetch
*/
barebone.TQueried = {
    initQueryParams: function (options) {
        options || (options = {});
        if (options.queryParams) {
            this.setQueryParams(options.queryParams, {fetch: false});
        }
    },
    setQueryParams: function (attributes, options) {
        var obj;
        if (typeof attributes !== 'object') {
            obj = {}; obj[attributes] = options; options = null;
        } else {
            obj = attributes;
        }
        options || (options = {});
        if (!this.queryParams) {
            this.queryParams = new barebone.QueryParams({}, { parent: this });
        }
        this.queryParams.set(obj, {silent: options.fetch === false || options.silent === true});
    },
    parse: function (response, options) {
        if (Backbone.Collection.prototype.isPrototypeOf(this)) {
            var count = response[barebone.config.responseParamsMap.count];
            if (typeof count !== 'undefined') {
                this.setQueryParams({count: count});
            }
            return response[barebone.config.responseParamsMap.results];
        }
        return this.constructor.__super__.parse.apply(this, [response, options]);
    }
};

barebone.expandSchema = function(schema) {
    for(var attrName in schema) {
        if (schema.hasOwnProperty(attrName)) {
            schema[attrName] = _({}).extend(
                (schema[attrName].type ? barebone.config.types[schema[attrName].type] : null)||{},
                schema[attrName]);
        }
    }
    return schema;
};
/*
    Takes schema (from options at construction or from prototype or from barebone.config.schemas[modelName])
    schema can have setters and getters

    set can take options.raw=true to ignore setter (to get without a getter just call model.attributes.attrname)
    (this ignores relations which are called further in _super_.set if associatedmodel is used)
*/
barebone.MSchemed = {
    get: function (attr, options) {
        options || (options = {});
        var val = barebone.Model.__super__.get.apply(this, [attr, options]);
        if (this.schema && options.raw !== true && attr in this.schema && this.schema[attr].getter) {
            return this.schema[attr].getter(val, options, this.schema[attr]);
        }
        return val;
    },
    set: function (attributes, options) {
        if (typeof attributes !== 'object') {
            var obj = {}; obj[attributes] = options; options = null; attributes = obj;
        }
        options || (options = {});
        if (this.schema && options.raw !== true) {
            for (var key in attributes) {
                if (key in this.schema && this.schema[key].setter) {
                    attributes[key] = this.schema[key].setter(attributes[key], options, this.schema[key]);
                }
            }
        }
        return barebone.Model.__super__.set.apply(this, [attributes, options]);
    }
};


barebone.Model = ('AssociatedModel' in Backbone ? Backbone.AssociatedModel
: Backbone.Model).extend(_({}).extend(barebone.TQueried, barebone.MSchemed, {
    modelName: 'model',
    initialize: function (attrs, options) {
        ('AssociatedModel' in Backbone ? Backbone.AssociatedModel
            : Backbone.Model).prototype.initialize.apply(this, [attrs, options]);
        this.initQueryParams(options);
    },
    onceSet: function (attr, callback, context) {
        if (this.has(attr)) {
            callback.apply(context, [this, this.get(attr)]);
        } else {
            this.once('change:'+attr, callback, context);
        }
        return this;
    }
}), {
    extend: function (properties, classProperties) {
        if (properties.schema) {
            properties.schema = _({}).extend(this.schema||{}, barebone.expandSchema(properties.schema));
            if (Backbone.AssociatedModel) {
                var relations = [], attrData;
                for(var attrName in properties.schema) {
                    if (properties.schema.hasOwnProperty(attrName)) {
                        attrData = properties.schema[attrName];
                        if (attrData.type === 'relation') {
                            relations.push({
                                type: attrData.relatedType === 'many' ? Backbone.Many : Backbone.One,
                                relatedModel: attrData.relatedModel, // @TODO
                                key: attrName
                            });
                        }
                    }
                }
                if (relations.length) properties.relations = relations;
            }
        }
        return Backbone.Model.extend.apply(this, [properties, classProperties]);
    }
});

barebone.Collection = Backbone.Collection.extend(_({}).extend(barebone.TQueried, {
    initialize: function (items, options) {
        Backbone.Collection.prototype.initialize.apply(this, [items, options]);
        this.initQueryParams(options);
    }
}));
