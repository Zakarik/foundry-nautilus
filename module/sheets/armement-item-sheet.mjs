/**
 * @extends {ItemSheet}
 */
export class ArmementSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nautilus", "sheet", "item", "armement"],
      template: "systems/nautilus/templates/armement-item-sheet.html",
      width: 790,
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