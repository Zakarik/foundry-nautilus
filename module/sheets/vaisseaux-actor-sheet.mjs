import toggler from '../helpers/toggler.js';

/**
 * @extends {ActorSheet}
 */
export class VaisseauxActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nautilus", "sheet", "actor", "vaisseaux"],
      template: "systems/nautilus/templates/vaisseaux-actor-sheet.html",
      width: 1000,
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
    this._prepareEquipage(context);

    context.systemData = context.data.system;

    context.systemData.semaines.list = Array.from({length: context.systemData.semaines.max}, (_, i) => i + 1);

    console.log(context);

    return context;
  }

  /**
     * Return a light sheet if in "limited" state
     * @override
     */
  get template() {
    if (!game.user.isGM && this.actor.limited) {
      return "systems/nautilus/templates/vaisseaux-limited-sheet.html";
    }
    return this.options.template;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    toggler.init(this.id, html);

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

    html.find('div.sem div.semaines').click(ev => {
      const target = $(ev.currentTarget),
            value = target.data("semaine"),
            actuel = target.data("actuel");

      this.actor.update({['system.semaines.value']:value !== actuel ? value : 0});
    });

    html.find('span.sanCheck').click(ev => {
      const target = $(ev.currentTarget);
      const value = target.data("key").substring(1);

      this.actor.update({[`system.sante.value`]:+value});
    });

    html.find('span.actualiser').click(ev => {
      this.render(true);
    });

    html.find('.addSpecialite').click(ev => {
      const target = $(ev.currentTarget);
      const apt = target.data("apt");
      const specialites = this.getData().data.system.aptitudes[apt].specialites;
      const listSpe = Object.keys(specialites);
      const newSpe = +listSpe[listSpe.length-1] || 0;

      console.log(listSpe, newSpe)

      this.actor.update({[`system.aptitudes.${apt}.specialites.${newSpe+1}`]:{name:"", value:0}});
    });

    html.find('i.deleteSpecialite').click(ev => {
      const target = $(ev.currentTarget);
      const apt = target.data("apt");
      const spe = target.data("spe");

      this.actor.update({[`system.aptitudes.${apt}.specialites.-=${spe}`]:null});
    });

    html.find('span.roll_aptitude').click(async ev => {
      const gData = this.getData();
      const target = $(ev.currentTarget);
      const key = target.data("aptitude");
      const getData = gData.data.system;
      const data = getData.aptitudes[key];
      const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
      const bValue = data.value
      const specialites = data.specialites;
      const pression = getData.pression.value;
      const sante = getData.sante;
      const heritiers = this.actor.equipage.heritiers.sort((a, b) => (a.name > b.name ? 1 : -1));
      const vm = CONFIG.NAUTILUS.vm;
      const lvm = [`<option value="" selected></option>`];
      const tvm = [];
      const lheritier = [`<option value="" selected></option>`];
      let bvm = {};

      let specialite = Object.keys(specialites).length > 0 ? `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" checked /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>` : "";

      for(let key in specialites) {
        const name = specialites[key].name;
        const value = specialites[key].value;

        specialite += `<label class="spe"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
      }

      for(let key in vm) {
        const t = game.i18n.localize(vm[key]);
        tvm.push(t);
        bvm[t] = key;
      }

      tvm.sort();

      for(let i = 0;i < tvm.length;i++) {
        const translate = tvm[i];
        const brut = bvm[translate];

        lvm.push(`<option value="${brut}">${translate}</option>`);
      }

      for(let i = 0;i < heritiers.length;i++) {
        lheritier.push(`<option value="${heritiers[i].id}">${heritiers[i].name} (${heritiers[i].role})</option>`);
      }

      const dataAsk = {
        specialite:specialite,
        vm:lvm.length > 1 ? lvm.join(' ') : false,
        heritiers:lheritier.join(' ')
      };
      const dialogAsk = await renderTemplate("systems/nautilus/templates/ask/roll-nautilus.html", dataAsk);
      const askOptions = {
        classes: ["nautilus-roll-nautilus-ask"],
        width: 450,
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
              const heritierSelected = target?.find('select.heritier').val();
              const vmSelected = target?.find('select.uvm').val();
              const vmBonus = vmSelected !== '' && heritierSelected !== '' && vmSelected !== undefined ? 1 : 0;
              const santeMalus = sante.list[`s${sante.value}`].malus === 'false' ? 0 : +sante.list[`s${sante.value}`].malus;
              const amelioration = speSelected !== undefined && speSelected !== 'aucune' ? gData.actor.roll[key][specialites[speSelected].label].reduce((accumulator, currentValue) => accumulator + currentValue, 0) : gData.actor.roll[key].value.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
              const value = +bValue + +mod + vmBonus - santeMalus + amelioration;
              const firstRoll = await this._doRoll(value, pression);
              const firstTotal = firstRoll.roll.total;
              const getHeritier = heritierSelected === '' ? '' : game.actors.get(heritierSelected);
              const getHeritierName = getHeritier !== '' ? `<br/>${getHeritier.name}` : '';
              let formula = firstRoll.formula;

              if(vmBonus === 1) {

                const getVM = getHeritier.system.valeursmorales[vmSelected];

                if(getVM.value > 0) { getHeritier.update({[`system.valeursmorales.${vmSelected}.value`]:+getVM.value-1}); }
                else {
                  const baseData = {
                    flavor:`${label}${getHeritierName}`,
                    main:{
                      empty:true,
                      text:game.i18n.localize('NAUTILUS.ROLL.VMEpuisee')
                    }
                  };

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

                  return;
                }
              }

              if(speSelected !== undefined && speSelected !== 'aucune') {
                const speName = specialites[speSelected].name;
                const speValue = +specialites[speSelected].value;
                const speLabel = `${speName} (${label})${getHeritierName}`;
                let mergeResults;

                if(firstTotal === value) {
                  const explode = await this._doRoll(speValue, pression);
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

                  const relance = await this._doRoll(toR, pression);

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

                this._createRollMsg(`${label}${getHeritierName}`, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, false, vmSelected);
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
      const sante = getData.sante;
      const getNameWpn = `<br/>${getDWpn.name}`;
      const getDataWpn = getDWpn.type === 'armement' ? getDWpn.system : {degats:getDWpn.system.distance.degats};
      const heritiers = this.actor.equipage.heritiers.sort((a, b) => (a.name > b.name ? 1 : -1));
      const vm = CONFIG.NAUTILUS.vm;
      const lvm = [`<option value="" selected></option>`];
      const tvm = [];
      const lheritier = [`<option value="" selected></option>`];
      let bvm = {};

      let specialite = Object.keys(specialites).length > 0 ? `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" checked /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>` : "";

      for(let key in specialites) {
        const name = specialites[key].name;
        const value = specialites[key].value;

        specialite += `<label class="spe"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
      }

      for(let key in vm) {
        const t = game.i18n.localize(vm[key]);
        tvm.push(t);
        bvm[t] = key;
      }

      tvm.sort();

      for(let i = 0;i < tvm.length;i++) {
        const translate = tvm[i];
        const brut = bvm[translate];

        lvm.push(`<option value="${brut}">${translate}</option>`);
      }

      for(let i = 0;i < heritiers.length;i++) {
        lheritier.push(`<option value="${heritiers[i].id}">${heritiers[i].name} (${heritiers[i].role})</option>`);
      }

      const dataAsk = {
        specialite:specialite,
        vm:lvm.length > 1 ? lvm.join(' ') : false,
        heritiers:lheritier.join(' ')
      };
      const dialogAsk = await renderTemplate("systems/nautilus/templates/ask/roll-nautilus.html", dataAsk);
      const askOptions = {
        classes: ["nautilus-roll-nautilus-ask"],
        width: 450,
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
              const heritierSelected = target?.find('select.heritier').val();
              const vmSelected = target?.find('select.uvm').val();
              const vmBonus = vmSelected !== '' && heritierSelected !== '' && vmSelected !== undefined ? 1 : 0;
              const santeMalus = sante.list[`s${sante.value}`].malus === 'false' ? 0 : +sante.list[`s${sante.value}`].malus;
              const amelioration = speSelected !== undefined && speSelected !== 'aucune' ? gData.actor.roll[key][specialites[speSelected].label].reduce((accumulator, currentValue) => accumulator + currentValue, 0) : gData.actor.roll[key].value.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
              const value = +bValue + +mod + vmBonus - santeMalus + amelioration;
              const firstRoll = await this._doRoll(value, pression);
              const firstTotal = firstRoll.roll.total;
              const getHeritier = heritierSelected === '' ? '' : game.actors.get(heritierSelected);
              const getHeritierName = getHeritier !== '' ? `<br/>${getHeritier.name}` : '';
              let formula = firstRoll.formula;

              if(vmBonus === 1) {

                const getVM = getHeritier.system.valeursmorales[vmSelected];

                if(getVM.value > 0) { getHeritier.update({[`system.valeursmorales.${vmSelected}.value`]:+getVM.value-1}); }
                else {
                  const baseData = {
                    flavor:`${label}${getHeritierName}`,
                    main:{
                      empty:true,
                      text:game.i18n.localize('NAUTILUS.ROLL.VMEpuisee')
                    }
                  };

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

                  return;
                }
              }

              if(speSelected !== undefined && speSelected !== 'aucune') {
                const speName = specialites[speSelected].name;
                const speValue = +specialites[speSelected].value;
                const speLabel = `${speName} (${label})${getHeritierName}${getNameWpn}`;
                let mergeResults;

                if(firstTotal === value) {
                  const explode = await this._doRoll(speValue, pression);
                  mergeResults = [...firstRoll.roll.dice[0].results, ...explode.roll.dice[0].results];
                  formula += ` (${game.i18n.localize(`NAUTILUS.ROLL.Base`)}) + ${explode.formula} (${game.i18n.localize(`NAUTILUS.ROLL.Specialite`)})`;

                  let r1 = [];

                  for(let i = 0;i < mergeResults.length;i++) {
                    const dS = mergeResults[i];

                    if(dS.result === 1) r1.push(i);
                  }

                  this._createRollMsg(speLabel, mergeResults, formula, firstTotal+explode.roll.total, specialites, r1, getDataWpn, vmSelected);
                } else {
                  let toR = value-firstTotal;

                  if(speValue < toR) toR = speValue;

                  const relance = await this._doRoll(toR, pression);

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

                  this._createRollMsg(speLabel, rF, formula, firstTotal+relance.roll.total, specialites, r1, getDataWpn, vmSelected);
                }

              } else {
                let r1 = [];

                for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
                  const dS = firstRoll.roll.dice[0].results[i];

                  if(dS.result === 1) r1.push(i);
                }

                this._createRollMsg(`${label}${getHeritierName}${getNameWpn}`, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, getDataWpn, vmSelected);
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

    html.find('.roll_specialite').click(async ev => {
      const gData = this.getData();
      const target = $(ev.currentTarget);
      const key = target.data("aptitude");
      const kSpe = target.data("spe");
      const getData = gData.data.system;
      const data = getData.aptitudes[key];
      const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
      const bValue = data.value
      const specialites = data.specialites;
      const pression = getData.pression.value;
      const sante = getData.sante;
      const heritiers = this.actor.equipage.heritiers.sort((a, b) => (a.name > b.name ? 1 : -1));
      const vm = CONFIG.NAUTILUS.vm;
      const lvm = [`<option value="" selected></option>`];
      const tvm = [];
      const lheritier = [`<option value="" selected></option>`];
      let bvm = {};

      let specialite = Object.keys(specialites).length > 0 ? `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>` : "";

      for(let key in specialites) {
        const name = specialites[key].name;
        const value = specialites[key].value;

        if(+key === kSpe) specialite += `<label class="spe"><input type="radio" class="specialite" name="specialite" value="${key}" checked /><span>${name} ${value}R</span></label>`;
        else specialite += `<label class="spe"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
      }

      for(let key in vm) {
        const t = game.i18n.localize(vm[key]);
        tvm.push(t);
        bvm[t] = key;
      }

      tvm.sort();

      for(let i = 0;i < tvm.length;i++) {
        const translate = tvm[i];
        const brut = bvm[translate];

        lvm.push(`<option value="${brut}">${translate}</option>`);
      }

      for(let i = 0;i < heritiers.length;i++) {
        lheritier.push(`<option value="${heritiers[i].id}">${heritiers[i].name} (${heritiers[i].role})</option>`);
      }

      const dataAsk = {
        specialite:specialite,
        vm:lvm.length > 1 ? lvm.join(' ') : false,
        heritiers:lheritier.join(' ')
      };
      const dialogAsk = await renderTemplate("systems/nautilus/templates/ask/roll-nautilus.html", dataAsk);
      const askOptions = {
        classes: ["nautilus-roll-nautilus-ask"],
        width: 450,
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
              const heritierSelected = target?.find('select.heritier').val();
              const vmSelected = target?.find('select.uvm').val();
              const vmBonus = vmSelected !== '' && heritierSelected !== '' && vmSelected !== undefined ? 1 : 0;
              const santeMalus = sante.list[`s${sante.value}`].malus === 'false' ? 0 : +sante.list[`s${sante.value}`].malus;
              const amelioration = speSelected !== undefined && speSelected !== 'aucune' ? gData.actor.roll[key][specialites[speSelected].label].reduce((accumulator, currentValue) => accumulator + currentValue, 0) : gData.actor.roll[key].value.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
              const value = +bValue + +mod + vmBonus - santeMalus + amelioration;
              const firstRoll = await this._doRoll(value, pression);
              const firstTotal = firstRoll.roll.total;
              const getHeritier = heritierSelected === '' ? '' : game.actors.get(heritierSelected);
              const getHeritierName = getHeritier !== '' ? `<br/>${getHeritier.name}` : '';
              let formula = firstRoll.formula;

              if(vmBonus === 1) {

                const getVM = getHeritier.system.valeursmorales[vmSelected];

                if(getVM.value > 0) { getHeritier.update({[`system.valeursmorales.${vmSelected}.value`]:+getVM.value-1}); }
                else {
                  const baseData = {
                    flavor:`${label}${getHeritierName}`,
                    main:{
                      empty:true,
                      text:game.i18n.localize('NAUTILUS.ROLL.VMEpuisee')
                    }
                  };

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

                  return;
                }
              }

              if(speSelected !== undefined && speSelected !== 'aucune') {
                const speName = specialites[speSelected].name;
                const speValue = +specialites[speSelected].value;
                const speLabel = `${speName} (${label})${getHeritierName}`;
                let mergeResults;

                if(firstTotal === value) {
                  const explode = await this._doRoll(speValue, pression);
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

                  const relance = await this._doRoll(toR, pression);

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

                this._createRollMsg(`${label}${getHeritierName}`, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, false, vmSelected);
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

    html.find('div.options button').click(async ev => {
      const target = $(ev.currentTarget);
      const key = target.data("key");
      const value = target.data("value") ? false : true;

      const update = {};

      update[`system.options.${key}`] = value;

      if(key === 'isnautilus' && value) {
        update['system.pression.value'] = game.settings.get("nautilus", "pression");

        const aptitudes = ['detection', 'endurance', 'manoeuvre', 'puissance'];
        const lapt = this.getData().data.system.aptitudes;
        const delSpe = {};

        const specialites = {
          detection:['fanal'],
          endurance:['chasse', 'coque'],
          manoeuvre:['maniabilite', 'plonger'],
          puissance:['eperonnage']
        };

        for(let i = 0;i < aptitudes.length;i++) {
          const apt = aptitudes[i];
          const updateSpe = {};

          for(let n = 0;n < Object.keys(lapt[apt].specialites).length;n++) {
            delSpe[`system.aptitudes.${apt}.specialites.-=${n}`] = null;
          }

          for(let n = 0;n < Object.keys(specialites[apt]).length;n++) {
            const spe = specialites[apt][n];
            const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[spe]);

            updateSpe[n] = {label:spe, name:label, value:0};
          }

          update[`system.aptitudes.${apt}.specialites`] = updateSpe;
        }

        await this.actor.update(delSpe);
      }

      this.actor.update(update);
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

      this.actor.update(update);
    });
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
        "amelioration": "systems/nautilus/assets/icons/amelioration.svg",
        "avarie": "systems/nautilus/assets/icons/avarie.svg",
        "armement": "systems/nautilus/assets/icons/armement.svg",
      }[type]
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    const itemBaseType = itemData[0].type;

    if(itemBaseType === 'distance'
    || itemBaseType === 'melee'
    || itemBaseType === 'equipement') return;

    return this.actor.createEmbeddedDocuments("Item", itemData);
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

  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    const maxSante = +sheetData.data.system.sante.max;
    const ameliorations = [];
    const avaries = [];
    const roll = {
      manoeuvre:{
        value:[0],
        maniabilite:[0],
        plonger:[0],
      },
      endurance:{
        value:[0],
        chasse:[0],
        coque:[0],
      },
      puissance:{
        value:[0],
        eperonnage:[0],
      },
      detection:{
        value:[0],
        fanal:[0]
      }
    };
    const sante = [];
    const armement = [];

    for (let i of sheetData.items) {
      if (i.type === 'amelioration' && sheetData.data.system.options.isnautilus) {
        ameliorations.push(i);

        const bRoll = i.system.roll,
              bArmement = i.system.distance,
              bSante = i.system.sante;

        if(bRoll.actif) {
          if(bRoll.aptitude !== '' && bRoll.specialite === '') roll[bRoll.aptitude]['value'].push(bRoll.value);
          else if(bRoll.aptitude !== '' && bRoll.specialite !== '') roll[bRoll.aptitude][bRoll.specialite].push(bRoll.value);
        }

        if(bSante.actif) sante.push(bSante.value);

        if(bArmement.actif) armement.push({
          name:i.name,
          type:i.type,
          _id:i._id,
          system:{
            description:i.system.description,
            degats:bArmement.degats
          }
        });
      }

      if (i.type === 'avarie' && sheetData.data.system.options.isnautilus) {
        avaries.push(i);
      }

      if (i.type === 'armement') {
        armement.push(i);
      }
    }

    const sumBSante = sante.reduce((partialSum, a) => partialSum + a, 0);

    actorData.armement = {
      actif: armement.length > 0 ? true : false,
      list: armement
    };
    actorData.roll = roll;
    actorData.ameliorations = ameliorations;
    actorData.avaries = avaries;

    if(sheetData.data.system.sante.calc !== maxSante+sumBSante) this.actor.update({['system.sante.calc']:maxSante+sumBSante});
  }

  _prepareEquipage(sheetData) {
    const actorData = sheetData.actor;

    const listActors = game.actors;

    const heritiers = [];
    const equipage = [];

    for(let i of listActors) {
      const type = i.type;

      switch(type) {
        case 'heritier':
          heritiers.push({name:i.name, role:i.system.role, id:i._id})
          break;

        case 'equipage':
          equipage.push({name:i.name, role:i.system.role, id:i._id})
          break;
      }
    }

    actorData.equipage = {
      heritiers:heritiers,
      equipage:equipage
    };
  }

  async _doRoll(value, pression) {
    let val = value;

    if(val < 0) val = 0;

    const formula = `${val}D10>=${pression}`;

    let r = new Roll(`${val}D10cs>=${pression}`);

    await r.evaluate({async:true});

    return {roll:r, formula:formula};
  }

  async _createRollMsg(label, lDices, formula, total, specialites, r1, wpn=false, hasVm='') {
    const vSante = this.actor.system.sante.value;
    const sante = this.actor.system.sante.list[`s${vSante}`].notes;

    let dices = [];
    let spec = [];

    for (let key in specialites) {
      const label = specialites[key].name;
      const value = specialites[key].value;
      spec.push(`${label} ${value}R`);
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
      }
    }

    console.log(wpn);

    const baseData = {
      flavor:`${label}`,
      main:{
        total:total,
        tooltip:tooltip,
        specialites:spec.join(' / '),
        result:result,
        sante:sante,
        wpn:!wpn ? false : true,
        degats:!wpn ? false : wpn.degats,
        description:!wpn ? false : wpn?.description,
        vm:hasVm === '' ? false : labelVm
      }
    };

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