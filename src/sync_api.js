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
        _(finalParams).extend(model.collection.queryParams.getForQuery(true));
    }
    _(finalParams).extend(options.queryParams || {});
    options.url = (options.url || model.urlRoot
     || (model.model && model.model.urlRoot)
     || (model.collection && model.collection.urlRoot))
        + (isModel && model.has('id') ? model.get('id') : '');
    window.params = [options.url+'', model.url, model.urlRoot, model.model && model.model.prototype.urlRoot];
    options.url += '?' + $.param(barebone.QueryParams.serialize(finalParams));

    return oldBackboneSync(method, model, options);
};
Backbone.sync = barebone.sync_api;