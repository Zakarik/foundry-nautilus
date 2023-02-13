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

    this._prepareHeritierData(actorData);
    this._prepareEquipageData(actorData);
    this._preparePersonnageData(actorData);
    this._prepareVaisseauxData(actorData);
  }

  _prepareHeritierData(actorData) {
    if (actorData.type !== 'heritier') return;

    const data = actorData.system;
    const endurer = data.aptitudes.endurer.value;
    const forcer = data.aptitudes.forcer.value;

    data.bonus.sante = [0, 0, 0, 0, 1, 2][Math.min(endurer - 1, 5)] || 0;
    data.sante.max = 6 + data.bonus.sante;
    data.bonus.contact = forcer >= 6 ? 2 : forcer === 5 ? 1 : forcer === 2 ? -1 : forcer <= 1 ? -2 : 0;

    this._setSante(data.sante, true);

    const pression = data.pression.value;
    data.pression.label = game.i18n.localize(CONFIG.NAUTILUS.pression[`${pression}`]);
    data.valeursmorales.commune = game.settings.get("nautilus", "vmc");
  };

  _prepareEquipageData(actorData) {
    if (actorData.type !== 'equipage') return;
    const data = actorData.system;

    this._setSante(data.sante);
  };

  _preparePersonnageData(actorData) {
    if (actorData.type !== 'personnage') return;
    const data = actorData.system;

    this._setSante(data.sante);
  };

  _prepareVaisseauxData(actorData) {
    if (actorData.type !== 'vaisseaux') return;
    const data = actorData.system;

    this._setSante(data.sante);

    if(data.options.isnautilus) {
      const pression = data.pression.value;
      data.pression.label = game.i18n.localize(CONFIG.NAUTILUS.pression[`${pression}`]);
    }
  };

  _setSante(sante,  predefini = false) {
    const sanList = {};

    for(let i = sante.max; i >= 0; i--) {
      sanList[`s${i}`] = {
        label: i === 0 ? game.i18n.localize("NAUTILUS.PERSONNAGE.SANTE.NIVEAUX.0ou-") : i,
        ...(predefini ? {
            consequence: game.i18n.localize(CONFIG.NAUTILUS.consequence[`s${i}`]),
            recup: game.i18n.localize(CONFIG.NAUTILUS.recup[`s${i}`])
          } : {
            notes: sante.list[`s${i}`]?.notes || '',
            malus: sante.list[`s${i}`]?.malus || false
        }),
      };
    }

    sante.list = sanList;
    sante.value = Math.min(sante.value, sante.max);

    console.log(sanList, sante);
  }
}