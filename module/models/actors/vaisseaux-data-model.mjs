import ActorsParts from '../parts/actors-parts.mjs';

export class VaisseauxDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {EmbeddedDataField, SchemaField, StringField, NumberField, BooleanField, ObjectField, HTMLField} = foundry.data.fields;
        const parts = new ActorsParts('vaisseaux');
        const aptVaisseaux = CONFIG.NAUTILUS.aptitudesVaisseaux;
        let data = parts.integration();
        let dataApt = {};

        data.semaines = new SchemaField({
            value:new NumberField({initial:0}),
            max:new NumberField({initial:0}),
        });

        data.options = new SchemaField({
            isnautilus:new BooleanField({initial:false}),
        });

        for(let a of aptVaisseaux) {
            dataApt[a] = new SchemaField({
                value:new NumberField({initial:0}),
                specialites:new ObjectField(),
            });
        }

        data.aptitudes = new SchemaField(dataApt);

		return data;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

    get actor() {
        return this.parent;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {
        if(this.options.isnautilus) {
            const pression = game.settings.get("nautilus", "pression");

            Object.defineProperty(this.pression, 'value', {
                value: pression,
            });

            Object.defineProperty(this.pression, 'label', {
                value: game.i18n.localize(CONFIG.NAUTILUS.pression[`${pression}`]),
            });
        }

        this._setSante();
    }

    static migrateData(source) {
        return super.migrateData(source);
    }

    _setSante(predefini = false) {
        const sanList = {};

        for(let i = this.sante.max; i >= 0; i--) {
            sanList[`s${i}`] = {
                label: i === 0 ? game.i18n.localize("NAUTILUS.PERSONNAGE.SANTE.NIVEAUX.0ou-") : i,
                ...(predefini ? {
                    consequence: game.i18n.localize(CONFIG.NAUTILUS.consequence[`s${i}`]),
                    recup: game.i18n.localize(CONFIG.NAUTILUS.recup[`s${i}`])
                } : {
                    notes: this.sante.list[`s${i}`]?.notes || '',
                    malus: this.sante.list[`s${i}`]?.malus || false
                }),
            };
        }

        Object.defineProperty(this.sante, 'list', {
            value: sanList,
        });

        Object.defineProperty(this.sante, 'value', {
            value: Math.min(this.sante.value, this.sante.max),
        });
    }
}