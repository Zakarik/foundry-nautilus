import ActorsParts from '../parts/actors-parts.mjs';

export class HeritierDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {EmbeddedDataField, SchemaField, StringField, NumberField, BooleanField, ObjectField, HTMLField} = foundry.data.fields;
        const vm = CONFIG.NAUTILUS.vm;
        const parts = new ActorsParts('heritier');
        let data = parts.integration();
        let dataVm = {};

        dataVm.commune = new StringField({initial:""});

        for(let v in vm) {
            dataVm[v] = new SchemaField({
                value:new NumberField({initial:0}),
                max:new NumberField({initial:0}),
            })
        }

        data.valeursmorales = new SchemaField(dataVm);

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
        const endurer = this.aptitudes.endurer.value;
        const forcer = this.aptitudes.forcer.value;
        const pression = game.settings.get("nautilus", "pression");

        Object.defineProperty(this.pression, 'value', {
            value: pression,
        });

        Object.defineProperty(this.pression, 'label', {
            value: game.i18n.localize(CONFIG.NAUTILUS.pression[`${pression}`]),
        });

        Object.defineProperty(this.valeursmorales, 'commune', {
            value: game.settings.get("nautilus", "vmc"),
        });

        Object.defineProperty(this.bonus, 'sante', {
            value: [0, 0, 0, 0, 1, 2][Math.min(endurer - 1, 5)] || 0,
        });

        Object.defineProperty(this.bonus, 'contact', {
            value: forcer >= 6 ? 2 : forcer === 5 ? 1 : forcer === 2 ? -1 : forcer <= 1 ? -2 : 0,
        });

        Object.defineProperty(this.sante, 'max', {
            value: 6 + parseInt(this.bonus.sante),
        });

        this._setSante(true);
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