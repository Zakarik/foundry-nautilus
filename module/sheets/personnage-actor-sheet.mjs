/**
 * @extends {ActorSheet}
 */
export class PersonnageActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nautilus", "sheet", "actor", "personnage"],
      template: "systems/nautilus/templates/personnage-actor-sheet.html",
      width: 850,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "talents"}],
      dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();

    this._prepareCharacterItems(context);

    context.systemData = context.data.system;

    console.log(context);

    return context;
  }

  /**
     * Return a light sheet if in "limited" state
     * @override
     */
   get template() {
    if (!game.user.isGM && this.actor.limited) {
      return "systems/nautilus/templates/limited-sheet.html";
    }
    return this.options.template;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find('.item-edit').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      item.sheet.render(true);
    });

    html.find('.item-delete').click(async ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      item.delete();
      header.slideUp(200, () => this.render(false));
    });

    html.find('.addSpecialite').click(ev => {
      const target = $(ev.currentTarget);
      const apt = target.data("apt");
      const specialites = this.getData().data.system.aptitudes[apt].specialites;
      const listSpe = Object.keys(specialites);
      const newSpe = +listSpe[listSpe.length-1] || 0;

      this.actor.update({[`system.aptitudes.${apt}.specialites.${newSpe+1}`]:{name:"", value:0, description:""}});
    });

    html.find('i.deleteSpecialite').click(ev => {
      const target = $(ev.currentTarget);
      const apt = target.data("apt");
      const spe = target.data("spe");

      this.actor.update({[`system.aptitudes.${apt}.specialites.-=${spe}`]:null});
    });

    html.find('span.sanCheck').click(ev => {
      const target = $(ev.currentTarget);
      const value = target.data("key").substring(1);

      this.actor.update({[`system.sante.value`]:+value});
    });

    html.find('span.roll_aptitude').click(async ev => {
      const gData = this.getData();
      const type = gData.data.type;

      const target = $(ev.currentTarget);
      const key = target.data("aptitude");
      const getData = gData.data.system;
      const data = getData.aptitudes[key];
      const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
      const bValue = data.value
      const specialites = data.specialites;
      const pression = getData.pression.value;
      const sante = getData.sante.value;
      const getVM = getData.valeursmorales;
      const vm = CONFIG.NAUTILUS.vm;
      const lvm = [`<option value="" selected></option>`];
      const tvm = [];
      let bvm = {};

      //await this._createRollMsg(label, value, pression, specialites);

      let specialite = Object.keys(specialites).length > 0 ? `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" checked /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>` : "";

      for(let key in specialites) {
        const data = specialites[key];
        const name = data.name;
        const value = data.value;
        const description = data.description;

        specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
      }

      if(type === 'heritier') {
        for(let key in vm) {
          const t = game.i18n.localize(vm[key]);
          tvm.push(t);
          bvm[t] = key;
        }

        tvm.sort();

        for(let i = 0;i < tvm.length;i++) {
          const translate = tvm[i];
          const brut = bvm[translate];

          if(+getVM[brut].value > 0) lvm.push(`<option value="${brut}">${translate}</option>`);

          if(brut === getVM.commune) lvm.push(`<option value="${brut}_cm">${translate} (${game.i18n.localize(`NAUTILUS.PERSONNAGE.VALEURSMORALES.Commune`)})</option>`);
        }
      }

      const dataAsk = {
        specialite:specialite,
        vm:lvm.length > 1 ? lvm.join(' ') : false
      };
      const dialogAsk = await renderTemplate("systems/nautilus/templates/ask/roll.html", dataAsk);
      const askOptions = {
        classes: ["nautilus-roll-ask"],
        width: 300,
      };

      let d = new Dialog({
        title: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.LabelMS`)}`,
        content:dialogAsk,
        buttons: {
          one: {
          icon: '<i class="fas fa-check"></i>',
          label: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.Roll`)}`,
          callback: async (event) => {
              const target = $(event);
              const mod = target?.find('input.mod').val();
              const speSelected = target?.find('[name="specialite"]:checked').val();
              const vmSelected = target?.find('select.uvm').val();
              const vmBonus = vmSelected !== '' && vmSelected !== undefined ? 1 : 0;

              let santeMalus = 0;

              if(type === 'heritier' && sante <= 3) {
                santeMalus = 1;
              } else if(type !== 'heritier' && getData.sante.list[`s${sante}`].malus !== 'false') {
                santeMalus = getData.sante.list[`s${sante}`].malus
              }

              const value = +bValue + +mod + vmBonus - santeMalus;
              const firstRoll = await this._doRoll(value, pression);
              const firstTotal = firstRoll.roll.total;
              let formula = firstRoll.formula;

              if(speSelected !== undefined && speSelected !== 'aucune') {
                const speName = specialites[speSelected].name;
                const speValue = specialites[speSelected].value;
                const speLabel = `${speName} (${label})`;
                let mergeResults;

                if(firstTotal === value) {
                  const explode = await this._doRoll(speValue, pression, sante);
                  mergeResults = [...firstRoll.roll.dice[0].results, ...explode.roll.dice[0].results];
                  formula += ` (${game.i18n.localize(`NAUTILUS.ROLL.Base`)}) + ${explode.formula} (${game.i18n.localize(`NAUTILUS.ROLL.Specialite`)})`;

                  let r1 = [];

                  for(let i = 0;i < mergeResults.length;i++) {
                    const dS = mergeResults[i];

                    if(dS.result === 1) r1.push(i);
                  }

                  this._createRollMsg(speLabel, mergeResults, formula, firstTotal+explode.roll.total, specialites, r1, false, vmSelected);
                } else {
                  let toR = value-firstTotal;

                  if(speValue < toR) toR = speValue;

                  const relance = await this._doRoll(toR, pression, sante);

                  let r1 = [];
                  let rO = [];
                  let rF = [];

                  for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                    const dS = firstRoll.roll.dice[0].results[i];

                    rF.push(dS);

                    if(dS.result === 1) r1.push(i);
                    else if(dS.success === false) rO.push(i);
                  }

                  for(let i = 0;i < relance.roll.dice[0].results.length;i++) {
                    if(r1.length !== 0) {
                      rF[r1[0]].active = false;
                      r1.splice(0, 1);
                      rF.push(relance.roll.dice[0].results[i]);
                    } else {
                      rF[rO[0]].active = false;
                      rO.splice(0, 1);
                      rF.push(relance.roll.dice[0].results[i]);
                    }
                  }

                  this._createRollMsg(speLabel, rF, formula, firstTotal+relance.roll.total, specialites, r1, false, vmSelected);
                }

              } else {
                let r1 = [];

                for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                  const dS = firstRoll.roll.dice[0].results[i];

                  if(dS.result === 1) r1.push(i);
                }

                this._createRollMsg(label, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, false, vmSelected);
              }
            }
          },
          two: {
          icon: '<i class="fas fa-times"></i>',
          label: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.Cancel`)}`,
          callback: () => {}
          }
        },
        default: "two",
        },
        askOptions);
      d.render(true);
    });

    html.find('span.roll_wpn').click(async ev => {
      const gData = this.getData();
      const type = gData.data.type;

      const target = $(ev.currentTarget);
      const key = target.data("aptitude");
      const idwpn = target.data("wpn");
      const getData = gData.data.system;
      const getDWpn = this.actor.items.get(idwpn);
      const data = getData.aptitudes[key];
      const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
      const bValue = data.value
      const specialites = data.specialites;
      const pression = getData.pression.value;
      const sante = getData.sante.value;
      const getNameWpn = getDWpn.name;
      const getDataWpn = getDWpn.system;
      const getVM = getData.valeursmorales;
      const vm = CONFIG.NAUTILUS.vm;
      const lvm = [`<option value="" selected></option>`];
      const tvm = [];
      const isContact = key === 'sebattre' ? true : false;
      let bvm = {};

      let specialite = Object.keys(specialites).length > 0 ? `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" checked /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>` : "";

      for(let key in specialites) {
        const data = specialites[key];
        const name = data.name;
        const value = data.value;
        const description = data.description;

        specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
      }

      if(type === 'heritier') {
        for(let key in vm) {
          const t = game.i18n.localize(vm[key]);
          tvm.push(t);
          bvm[t] = key;
        }

        tvm.sort();

        for(let i = 0;i < tvm.length;i++) {
          const translate = tvm[i];
          const brut = bvm[translate];

          if(+getVM[brut].value > 0) lvm.push(`<option value="${brut}">${translate}</option>`);

          if(brut === getVM.commune) lvm.push(`<option value="${brut}_cm">${translate} (${game.i18n.localize(`NAUTILUS.PERSONNAGE.VALEURSMORALES.Commune`)})</option>`);
        }
      }

      const dataAsk = {
        specialite:specialite,
        vm:lvm.length > 1 ? lvm.join(' ') : false
      };
      const dialogAsk = await renderTemplate("systems/nautilus/templates/ask/roll.html", dataAsk);
      const askOptions = {
        classes: ["nautilus-roll-ask"],
        width: 300,
      };

      let d = new Dialog({
        title: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.LabelMS`)}`,
        content:dialogAsk,
        buttons: {
          one: {
          icon: '<i class="fas fa-check"></i>',
          label: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.Roll`)}`,
          callback: async (event) => {
              const target = $(event);
              const mod = target?.find('input.mod').val();
              const speSelected = target?.find('[name="specialite"]:checked').val();
              const vmSelected = target?.find('select.uvm').val();
              const vmBonus = vmSelected !== '' && vmSelected !== undefined  ? 1 : 0;

              let santeMalus = 0;

              if(type === 'heritier' && sante <= 3) {
                santeMalus = 1;
              } else if(type !== 'heritier' && getData.sante.list[`s${sante}`].malus !== 'false') {
                santeMalus = getData.sante.list[`s${sante}`].malus
              }

              const value = +bValue + +mod + vmBonus - santeMalus;
              const firstRoll = await this._doRoll(value, pression);
              const firstTotal = firstRoll.roll.total;
              let formula = firstRoll.formula;

              if(speSelected !== undefined && speSelected !== 'aucune') {
                const speName = specialites[speSelected].name;
                const speValue = specialites[speSelected].value;
                const speLabel = `${speName} (${label}) - ${getNameWpn}`;
                let mergeResults;

                if(firstTotal === value) {
                  const explode = await this._doRoll(speValue, pression, sante);
                  mergeResults = [...firstRoll.roll.dice[0].results, ...explode.roll.dice[0].results];

                  formula += ` (${game.i18n.localize(`NAUTILUS.ROLL.Base`)}) + ${explode.formula} (${game.i18n.localize(`NAUTILUS.ROLL.Specialite`)})`;

                  let r1 = [];

                  for(let i = 0;i < mergeResults.length;i++) {
                    const dS = mergeResults[i];

                    if(dS.result === 1) r1.push(i);
                  }

                  this._createRollMsg(speLabel, mergeResults, formula, firstTotal+explode.roll.total, specialites, r1, getDataWpn, vmSelected, isContact);
                } else {
                  let toR = value-firstTotal;

                  if(speValue < toR) toR = speValue;

                  const relance = await this._doRoll(toR, pression, sante);

                  let r1 = [];
                  let rO = [];
                  let rF = [];

                  for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                    const dS = firstRoll.roll.dice[0].results[i];

                    rF.push(dS);

                    if(dS.result === 1) r1.push(i);
                    else if(dS.success === false) rO.push(i);
                  }

                  for(let i = 0;i < relance.roll.dice[0].results.length;i++) {
                    if(r1.length !== 0) {
                      rF[r1[0]].active = false;
                      r1.splice(0, 1);
                      rF.push(relance.roll.dice[0].results[i]);
                    } else {
                      rF[rO[0]].active = false;
                      rO.splice(0, 1);
                      rF.push(relance.roll.dice[0].results[i]);
                    }
                  }

                  this._createRollMsg(speLabel, rF, formula, firstTotal+relance.roll.total, specialites, r1, getDataWpn, vmSelected, isContact);
                }

              } else {
                let r1 = [];

                for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                  const dS = firstRoll.roll.dice[0].results[i];

                  if(dS.result === 1) r1.push(i);
                }

                this._createRollMsg(`${label} - ${getNameWpn}`, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, getDataWpn, vmSelected, isContact);
              }
            }
          },
          two: {
          icon: '<i class="fas fa-times"></i>',
          label: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.Cancel`)}`,
          callback: () => {}
          }
        },
        default: "two"
        },
        askOptions);
      d.render(true);
    });

    html.find('i.roll_specialite').click(async ev => {
      const gData = this.getData();
      const type = gData.data.type;

      const target = $(ev.currentTarget);
      const key = target.data("aptitude");
      const kSpe = target.data("spe");
      const getData = this.getData().data.system;
      const data = getData.aptitudes[key];
      const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
      const bValue = data.value
      const specialites = data.specialites;
      const pression = getData.pression.value;
      const sante = getData.sante.value;
      const getVM = getData.valeursmorales;
      const vm = CONFIG.NAUTILUS.vm;
      const lvm = [`<option value="" selected></option>`];
      const tvm = [];
      let bvm = {};

      let specialite = Object.keys(specialites).length > 0 ? `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>` : "";

      for(let key in specialites) {
        const data = specialites[key];
        const name = data.name;
        const value = data.value;
        const description = data.description;

        if(+key === kSpe) specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" checked /><span>${name} ${value}R</span></label>`;
        else specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
      }

      if(type === 'heritier') {
        for(let key in vm) {
          const t = game.i18n.localize(vm[key]);
          tvm.push(t);
          bvm[t] = key;
        }

        tvm.sort();

        for(let i = 0;i < tvm.length;i++) {
          const translate = tvm[i];
          const brut = bvm[translate];

          if(+getVM[brut].value > 0) lvm.push(`<option value="${brut}">${translate}</option>`);

          if(brut === getVM.commune) lvm.push(`<option value="${brut}_cm">${translate} (${game.i18n.localize(`NAUTILUS.PERSONNAGE.VALEURSMORALES.Commune`)})</option>`);
        }
      }

      const dataAsk = {
        specialite:specialite,
        vm:lvm.length > 1 ? lvm.join(' ') : false
      };
      const dialogAsk = await renderTemplate("systems/nautilus/templates/ask/roll.html", dataAsk);
      const askOptions = {
        classes: ["nautilus-roll-ask"],
        width: 300,
      };

      let d = new Dialog({
        title: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.LabelMS`)}`,
        content:dialogAsk,
        buttons: {
          one: {
          icon: '<i class="fas fa-check"></i>',
          label: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.Roll`)}`,
          callback: async (event) => {
              const target = $(event);
              const mod = target?.find('input.mod').val();
              const speSelected = target?.find('[name="specialite"]:checked').val();
              const vmSelected = target?.find('select.uvm').val();
              const vmBonus = vmSelected !== '' && vmSelected !== undefined ? 1 : 0;

              let santeMalus = 0;

              if(type === 'heritier' && sante <= 3) {
                santeMalus = 1;
              } else if(type !== 'heritier' && getData.sante.list[`s${sante}`].malus !== 'false') {
                santeMalus = getData.sante.list[`s${sante}`].malus
              }

              const value = +bValue + +mod + vmBonus - santeMalus;
              const firstRoll = await this._doRoll(value, pression);
              const firstTotal = firstRoll.roll.total;
              let formula = firstRoll.formula;

              if(speSelected !== undefined && speSelected !== 'aucune') {
                const speName = specialites[speSelected].name;
                const speValue = specialites[speSelected].value;
                const speLabel = `${speName} (${label})`;
                let mergeResults;

                if(firstTotal === value) {
                  const explode = await this._doRoll(speValue, pression, sante);
                  mergeResults = [...firstRoll.roll.dice[0].results, ...explode.roll.dice[0].results];

                  formula += ` (${game.i18n.localize(`NAUTILUS.ROLL.Base`)}) + ${explode.formula} (${game.i18n.localize(`NAUTILUS.ROLL.Specialite`)})`;

                  let r1 = [];

                  for(let i = 0;i < mergeResults.length;i++) {
                    const dS = mergeResults[i];

                    if(dS.result === 1) r1.push(i);
                  }

                  this._createRollMsg(speLabel, mergeResults, formula, firstTotal+explode.roll.total, specialites, r1, false, vmSelected);
                } else {
                  let toR = value-firstTotal;

                  if(speValue < toR) toR = speValue;

                  const relance = await this._doRoll(toR, pression, sante);

                  let r1 = [];
                  let rO = [];
                  let rF = [];

                  for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                    const dS = firstRoll.roll.dice[0].results[i];

                    rF.push(dS);

                    if(dS.result === 1) r1.push(i);
                    else if(dS.success === false) rO.push(i);
                  }

                  for(let i = 0;i < relance.roll.dice[0].results.length;i++) {
                    if(r1.length !== 0) {
                      rF[r1[0]].active = false;
                      r1.splice(0, 1);
                      rF.push(relance.roll.dice[0].results[i]);
                    } else {
                      rF[rO[0]].active = false;
                      rO.splice(0, 1);
                      rF.push(relance.roll.dice[0].results[i]);
                    }
                  }

                  this._createRollMsg(speLabel, rF, formula, firstTotal+relance.roll.total, specialites, r1, false, vmSelected);
                }

              } else {
                let r1 = [];

                for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                  const dS = firstRoll.roll.dice[0].results[i];

                  if(dS.result === 1) r1.push(i);
                }

                this._createRollMsg(label, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, false, vmSelected);
              }
            }
          },
          two: {
          icon: '<i class="fas fa-times"></i>',
          label: `${game.i18n.localize(`NAUTILUS.ROLL.ASK.Cancel`)}`,
          callback: () => {}
          }
        },
        default: "two"
        },
        askOptions);
      d.render(true);
    });

    html.find('select.santemalus').change(async ev => {
      const target = $(ev.currentTarget);
      const value = target.val();
      const key = +target.data("key").substring(1) > 0 ? +target.data("key").substring(1)-1 : +target.data("key").substring(1);

      if(key === 0 || value === 'false') return;

      const update = {};

      for(let i = key;i >= 0;i--) {
        update[`system.sante.list.s${i}.malus`] = value;
      }

      console.log(update);

      this.actor.update(update);
    });
  }

  /* -------------------------------------------- */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    const distance = [];
    const melee = [];
    const equipement = [];

    for (let i of sheetData.items) {
      if (i.type === 'distance') {
        distance.push(i);
      }

      if (i.type === 'melee') {
        melee.push(i);
      }

      if (i.type === 'equipement') {
        equipement.push(i);
      }
    }

    actorData.distance = distance;
    actorData.melee = melee;
    actorData.equipement = equipement;
  }

  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    const itemBaseType = itemData[0].type;

    if(itemBaseType === 'amelioration'
    || itemBaseType === 'avarie'
    || itemBaseType === 'armement') return;

    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `${game.i18n.localize(`TYPES.Item.${type}`)}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
      img: {
        "distance": "systems/nautilus/assets/icons/distance.svg",
        "melee": "systems/nautilus/assets/icons/melee.svg",
        "equipement": "systems/nautilus/assets/icons/equipement.svg",
      }[type]
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  _onDragStart(event) {
    const li = event.currentTarget;

    if ( event.target.classList.contains("content-link") ) return;

    const data = this.getData().data.system;
    const aptitude = $(li)?.data("aptitude") || "";
    const spe = $(li)?.data("spe") === undefined ? false : $(li)?.data("spe");
    const wpn = $(li)?.data("wpn") || false;

    let label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[aptitude]);

    if(!wpn && spe !== false) label = data.aptitudes[aptitude].specialites[spe].name;
    else if(wpn !== false) label = this.actor.items.get(wpn).name;

    // Create drag data
    const dragData = {
      actorId: this.actor.id,
      sceneId: this.actor.isToken ? canvas.scene?.id : null,
      tokenId: this.actor.isToken ? this.actor.token.id : null,
      type:this.actor.type,
      aptitude:aptitude,
      specialite:spe,
      wpn:wpn,
      label:label,
    };

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  async _doRoll(value, pression) {
    let val = value;

    if(val < 0) val = 0;

    const formula = `${val}D10>=${pression}`;

    let r = new Roll(`${val}D10cs>=${pression}`);

    await r.evaluate({async:true});

    return {roll:r, formula:formula};
  }

  async _createRollMsg(label, lDices, formula, total, specialites, r1, wpn=false, hasVm='', isContact=false) {
    const type = this.actor.type;
    const gForcer = +this.actor.system.bonus.contact;
    const gSante = this.actor.system.sante;
    const vSante = gSante.value;
    const lSante = type === 'heritier' ? gSante.list[`s${vSante}`].consequence : `${gSante.list[`s${vSante}`].notes}`;

    let dices = [];
    let spec = [];

    for (let key in specialites) {
      spec.push(`${specialites[key].name} ${specialites[key].value}R`);
    }

    for(let i = 0;i < lDices.length;i++) {
      const dS = lDices[i];

      if(dS.success) {
        dices.push(`<li class="roll die d10 success" data-num="${i}">${dS.result}</li>`);
      } else {
        if(!dS.active) dices.push(`<li class="roll die d10 discarded" data-num="${i}">${dS.result}</li>`);
        else dices.push(`<li class="roll die d10" data-num="${i}">${dS.result}</li>`);
      }
    }

    const tooltip = `
    <div class="dice-tooltip">
      <section class="tooltip-part">
          <div class="dice">
              <header class="part-header flexrow">
                  <span class="part-formula">${formula}</span>

                  <span class="part-total">${total}</span>
              </header>
              <ol class="dice-rolls">
                  ${dices.join(' ')}
              </ol>
          </div>
      </section>
    </div>`;

    let result;

    if(total >= 5) result = game.i18n.localize(`NAUTILUS.ROLL.ReussiteExceptionnelle`);
    else if(total >= 2 && total <= 4) result = game.i18n.localize(`NAUTILUS.ROLL.ReussiteTotale`);
    else if(total == 1) result = game.i18n.localize(`NAUTILUS.ROLL.ReussitePartielle`);
    else if(total == 0 && r1.length == 0) result = game.i18n.localize(`NAUTILUS.ROLL.Echec`);
    else if(total == 0 && r1.length == 1) result = game.i18n.localize(`NAUTILUS.ROLL.EchecRetentissant`);
    else if(total == 0 && r1.length > 1) result = game.i18n.localize(`NAUTILUS.ROLL.EchecCatastrophique`);

    let labelVm = '';

    if(hasVm !== '') {
      if(hasVm.includes('_cm')) {
        labelVm = `${game.i18n.localize(`NAUTILUS.PERSONNAGE.VALEURSMORALES.CommuneUse`)} : ${game.i18n.localize(CONFIG.NAUTILUS.vm[hasVm.split('_')[0]])}`;
      } else {
        labelVm = `${game.i18n.localize(`NAUTILUS.PERSONNAGE.VALEURSMORALES.ShortUse`)} : ${game.i18n.localize(CONFIG.NAUTILUS.vm[hasVm])}`;
        this.actor.update({[`system.valeursmorales.${hasVm}.value`]:+this.actor.system.valeursmorales[hasVm].value-1});
      }
    }

    const dgtsBonus = isContact && type === 'heritier' ? gForcer : 0;

    const baseData = {
      flavor:`${label}`,
      main:{
        total:total,
        tooltip:tooltip,
        specialites:spec.join(' / '),
        result:result,
        sante:lSante,
        wpn:!wpn ? false : true,
        degats:!wpn ? false : Math.max(+wpn.degats + dgtsBonus, 0),
        description:!wpn ? false : wpn?.description,
        vm:hasVm === '' ? false : labelVm
      }
    };

    console.log(gForcer);

    const msgData = {
      user: game.user.id,
      speaker: {
        actor: this.actor?.id || null,
        token: this.actor?.token?.id || null,
        alias: this.actor?.name || null,
      },
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: await renderTemplate('systems/nautilus/templates/msg/roll.html', baseData),
      sound: CONFIG.sounds.dice
    };

    const rMode = game.settings.get("core", "rollMode");
    const msgTotalData = ChatMessage.applyRollMode(msgData, rMode);

    const msg = await ChatMessage.create(msgTotalData, {
      rollMode:rMode
    });
  }
}