export default class ItemsParts {
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
            case 'distance':
            case 'melee':
            case 'armement':
                data.description = this._addHTML();
                data.degats = this._addNumber();
                break;

            case 'amelioration':
                data.description = this._addHTML();
                data.roll = this._addRoll();
                data.distance = this._addDistance();
                data.sante = this._addSante();
                break;

            default:
                data.description = this._addHTML();
                break;
        }

        return data;
    }

    _addHTML() {
        return new ItemsParts.HtmlField({initial:""});
    }

    _addString() {
        return new ItemsParts.StringField({initial:""});
    }

    _addNumber(num=0) {
        return new ItemsParts.NumberField({initial:num});
    }

    _addRoll() {
        return new ItemsParts.SchemaField({
            actif:new ItemsParts.BooleanField({initial:false}),
            value:this._addNumber(1),
            aptitude:this._addString(),
            specialite:this._addString(),
        });
    }

    _addDistance() {
        return new ItemsParts.SchemaField({
            actif:new ItemsParts.BooleanField({initial:false}),
            degats:this._addNumber(),
        });
    }

    _addSante() {
        return new ItemsParts.SchemaField({
            actif:new ItemsParts.BooleanField({initial:false}),
            degats:this._addNumber(),
        });
    }
}