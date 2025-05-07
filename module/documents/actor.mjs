/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class NautilusActor extends Actor {

  /**
     * Create a new entity using provided input data
     * @override
     */
  static async create(data, options = {}) {
    // Replace default image
    if (data.img === undefined) {
      switch(data.type) {
        case 'personnage':
          data.img = "systems/nautilus/assets/icons/personnage.svg";
          break;

        case 'equipage':
          data.img = "systems/nautilus/assets/icons/equipage.svg";
          break;

        case 'heritier':
          data.img = "systems/nautilus/assets/icons/heritier.svg";
          break;

        case 'vaisseaux':
          data.img = "systems/nautilus/assets/icons/vaisseaux.svg";
          break;
      }

    }
    await super.create(data, options);
  }

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  prepareDerivedData() {
    const actorData = this;
  }
}