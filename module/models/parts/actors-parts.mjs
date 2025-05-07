export default class ActorsParts {
    static SchemaField = foundry.data.fields.SchemaField;
    static BooleanField = foundry.data.fields.BooleanField;
    static NumberField = foundry.data.fields.NumberField;
    static HtmlField = foundry.data.fields.HTMLField;
    static StringField = foundry.data.fields.StringField;
    static ObjectField = foundry.data.fields.ObjectField;

    constructor(type) {
        this._type = type;
    }

    get type() {
        return this._type;
    }

    integration() {
        const type = this.type;
        let data = {};

        switch(type) {
            case 'vaisseaux':
                data.description = this._addHTML();
                data.lieux = this._addHTML();
                data.creatures = this._addHTML();
                data.quarts = this._addHTML();
                data.sante = this._sante();
                data.pression = this._pression();
                break;

            default:
                data.concept = this._addHTML();
                data.description = this._addHTML();
                data.aptitudes = this._aptitudes();
                data.sante = this._sante();
                data.bonus = this._bonus();
                data.pression = this._pression();
                data.contact = this._addHTML();
                data.historique = this._addHTML();
                break;
        }

        return data;
    }

    _addHTML() {
        return new ActorsParts.HtmlField({initial:""});
    }

    _addString() {
        return new ActorsParts.StringField({initial:""});
    }

    _aptitudes() {
        const APTITUDES = CONFIG.NAUTILUS.aptitudes;
        let data = {};

        for(let a in APTITUDES) {
            data[a] = new ActorsParts.SchemaField({
                value:new ActorsParts.NumberField({initial:0}),
                specialites:new ActorsParts.ObjectField(),
            });
        }

        return new ActorsParts.SchemaField(data);
    }

    _sante() {
        return new ActorsParts.SchemaField({
            value:new ActorsParts.NumberField({initial:6}),
            max:new ActorsParts.NumberField({initial:6}),
            list:new ActorsParts.ObjectField(),
        });
    }

    _bonus() {
        return new ActorsParts.SchemaField({
            sante:new ActorsParts.NumberField({initial:0}),
            contact:new ActorsParts.NumberField({initial:0}),
        })
    }

    _pression() {
        return new ActorsParts.SchemaField({
            value:new ActorsParts.NumberField({initial:0}),
            label:new ActorsParts.StringField({initial:""}),
        });
    }
}