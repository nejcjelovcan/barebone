
barebone.config = _(barebone.config || {}).extend({
    urlRoot: '/site/api/',

    // default query parameters for every request
    queryParams: {},

    queryParamsMap: {
        serializer: 'serializer',
        pageSize: 'page_size',
        page: 'page',
        ordering: 'order'
    },

    responseParamsMap: {
        count: 'count',
        results: 'results'
    },

    defaultPageSize: 50
    
});

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
        return this;
    },
    prevPage: function () {
        this.set('page', this.get('page') - 1);
        return this;
    }
}, {
    serialize: function (attrs) {
        var obj = {};
        _(attrs).each(function (val, key) {
            if (barebone.config.queryParamsMap[key]) key = barebone.config.queryParamsMap[key];

            if (val === true) obj[key] = 'True';
            else if (val === false) obj[key] = 'False';
            else obj[key] = val;
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
        this.setQueryParams(options.queryParams||{}, {fetch: false});
        return this;
    },
    setQueryParams: function (attributes, options) {
        var obj;
        if (typeof attributes !== 'object') {
            obj = {}; obj[attributes] = options; options = null;
        } else {
            obj = attributes;
        }
        options || (options = {});
        if (!this.queryParams || !barebone.QueryParams.prototype.isPrototypeOf(this.queryParams)) {
            this.queryParams = new barebone.QueryParams(this.queryParams||{}, { parent: this });
        }
        this.queryParams.set(obj, {silent: options.fetch === false || options.silent === true});
        return this;
    },
    parse: function (response, options) {
        if (Backbone.Collection.prototype.isPrototypeOf(this)) {
            if (_(response).isArray()) {
                return response;
            }
            var count = response[barebone.config.responseParamsMap.count];
            if (typeof count !== 'undefined') {
                this.setQueryParams({count: count});
            }
            return response[barebone.config.responseParamsMap.results];
        }
        return response;
    }
};

barebone.Model = ('AssociatedModel' in Backbone ? Backbone.AssociatedModel
: Backbone.Model).extend(_({}).extend(barebone.TQueried, {
    modelName: 'model',
    constructor: function (attrs, options) {
        ('AssociatedModel' in Backbone ? Backbone.AssociatedModel
            : Backbone.Model).apply(this, [attrs, options]);
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
}));

barebone.Collection = Backbone.Collection.extend(_({}).extend(barebone.TQueried, {
    constructor: function (items, options) {
        Backbone.Collection.apply(this, [items, options]);
        this.initQueryParams(options);
    }
}));
