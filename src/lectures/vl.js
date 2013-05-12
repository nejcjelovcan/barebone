

if (typeof viidea == 'undefined') {
    var viidea = {};
}

barebone.config.urlRoot = 'http://dva.viidea.com:20082/site/api/'

viidea.lectures = { vl: {} };
var vl = viidea.lectures.vl;

vl.Author = barebone.Model.extend({
    schema: {
        gender: { type: 'string' },
        name: { type: 'string' },
        organization: { type: 'relation', relatedModel: 'viidea.lectures.vl.Organization' }
    }
});

vl.Organization = barebone.Model.extend({
    schema: {
        name: { type: 'string' }
    }
});
/*
vl.Author = barebone.api.Model.extend({

    modelName: 'author',

    defaults: {
        gender: 'M'
    },

    relations: [
        { key: 'organization', type: Backbone.One, relatedModel: 'viidea.lectures.vl.Organization' }
    ]

});

vl.Organization = barebone.api.Model.extend({

    modelName: 'organizations',

    defaults: {

    },

    relations: [
        // { key: 'authors', type: Backbone.Many, relatedModel: 'viidea.lectures.vl.Author' }
        // @TODO TEST HOW PAIRS OF RELATIONS WORK IN BOTH DIRECTIONS
    ]

});
*/

/*
vl.Lecture = barebone.api.Model.extend({

    modelName: 'lectures',

    defaults: {
        enabled: false
    },

    enable: function () {
        if (!this.get('enabled')) {
            this.set('enabled', true);
            this.save(this.pick('enabled'), {patch: true});
        }
    },

    disable: function () {
        if (this.get('enabled')) {
            this.set('enabled', false);
            this.save(this.pick('enabled'), {patch: true});
        }
    }

});

vl.Contribution = barebone.api.Model.extend({

    modelName: 'contributions',
    defaults: {

    }

});

vl.OrgContribution = vl.Contribution.extend({

    defaults: {
        type: 'O'
    },
    relations: [
        { key: 'organization', type: Backbone.One, relatedModel: 'viidea.lectures.vl.Organization' }
    ]

});

vl.AuthorContribution = vl.Contribution.extend({

    defaults: {
        type: 'P'
    },
    relations: [
        { key: 'author', type: Backbone.One, relatedModel: 'viidea.lectures.vl.Author' }
    ]

});
*/
// class AuthorSerializer(serializers.ModelSerializer):
//     class Meta:
//         model = Author
//         fields = ('id', 'title', 'name', 'gender', 'slug', 'email', 'public_email', 
//             'organization', 'contribution')
//         allow_ordering = ('name', 'slug', 'email', 'contribution__id')

//     organization = ContributorMinimalSerializer(source='parent')
//     contribution = serializers.SerializerMethodField('get_contribution')

//     def get_contribution(self, author):
//         ctr = None
//         try: 
//             lecid = self.context.get('request').QUERY_PARAMS.get('lecture_id')
//             if lecid:
//                 ctr = Contribution.objects.get(contributor=author.id, lecture=lecid)
//                 return dict(id=ctr.id, type=ctr.type, affiliation=ctr.affiliation.id if ctr.affiliation else None)
//         except Contribution.DoesNotExist: pass
//         return ctr