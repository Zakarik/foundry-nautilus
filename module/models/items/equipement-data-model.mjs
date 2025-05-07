import ItemsParts from '../parts/items-parts.mjs';

export class EquipementDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {EmbeddedDataField, SchemaField, StringField, NumberField, BooleanField, ObjectField, HTMLField} = foundry.data.fields;
        const parts = new ItemsParts('equipement');
        let data = parts.integration();

		return data;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

    get item() {
        return this.parent;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {
    }

    static migrateData(source) {
        return super.migrateData(source);
    }
}