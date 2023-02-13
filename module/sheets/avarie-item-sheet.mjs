/**
 * @extends {ItemSheet}
 */
export class AvarieSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nautilus", "sheet", "item", "avarie"],
      template: "systems/nautilus/templates/avarie-item-sheet.html",
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