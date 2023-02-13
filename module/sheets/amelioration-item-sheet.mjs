/**
 * @extends {ItemSheet}
 */
export class AmeliorationSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nautilus", "sheet", "item", "amelioration"],
      template: "systems/nautilus/templates/amelioration-item-sheet.html",
      width: 790,
      height: 350,
      scrollY: [".attributes"],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();

    const aptitudes = ['', 'manoeuvre', 'endurance', 'puissance', 'detection'];
    const specialites = {'':[''],'manoeuvre':['', 'maniabilite', 'plonger'], 'endurance':['', 'chasse', 'coque'], 'puissance':['', 'eperonnage'], 'detection':['', 'fanal']};

    context.systemData = context.data.system;
    context.systemData.roll.list = {aptitudes:aptitudes, specialites:specialites[context.systemData.roll.aptitude]};

    console.log(context);

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    html.find('button').click(ev => {
      const target = $(ev.currentTarget),
            value = target.data("value") ? false : true,
            type = target.data("type");

      this.item.update({[`system.${type}.actif`]:value});
    });

    html.find('select.aptitude').change(ev => {
      this.item.update({[`system.roll.specialite`]:''});
    });
  }
}