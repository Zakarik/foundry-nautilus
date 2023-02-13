/**
 * @extends {ItemSheet}
 */
export class EquipementSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nautilus", "sheet", "item", "equipement"],
      template: "systems/nautilus/templates/equipement-item-sheet.html",
      width: 620,
      height: 350,
      scrollY: [".attributes"],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();

    context.systemData = context.data.system;

    console.log(context);

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

  }
}