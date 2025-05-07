import NautilusHooks  from "./hooks.mjs";
import { GmTool } from "./gm/gmTool.mjs";
// Import document classes.
import { NautilusActor } from "./documents/actor.mjs";
import { NautilusItem } from "./documents/item.mjs";

// Import sheet classes.
import { VaisseauxActorSheet } from "./sheets/vaisseaux-actor-sheet.mjs";
import { PersonnageActorSheet } from "./sheets/personnage-actor-sheet.mjs";
import { WpnSheet } from "./sheets/wpn-item-sheet.mjs";
import { EquipementSheet } from "./sheets/equipement-item-sheet.mjs";
import { AmeliorationSheet } from "./sheets/amelioration-item-sheet.mjs";
import { AvarieSheet } from "./sheets/avarie-item-sheet.mjs";
import { ArmementSheet } from "./sheets/armement-item-sheet.mjs";

// Import models classes.
import { EquipageDataModel } from "./models/actors/equipage-data-model.mjs";
import { HeritierDataModel } from "./models/actors/heritier-data-model.mjs";
import { PersonnageDataModel } from "./models/actors/personnage-data-model.mjs";
import { VaisseauxDataModel } from "./models/actors/vaisseaux-data-model.mjs";
import { AmeliorationDataModel } from "./models/items/amelioration-data-model.mjs";
import { ArmementDataModel } from "./models/items/armement-data-model.mjs";
import { AvarieDataModel } from "./models/items/avarie-data-model.mjs";
import { DistanceDataModel } from "./models/items/distance-data-model.mjs";
import { EquipementDataModel } from "./models/items/equipement-data-model.mjs";
import { MeleeDataModel } from "./models/items/melee-data-model.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { NAUTILUS } from "./helpers/config.mjs";
import { RegisterSettings } from "./settings.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.nautilus = {
    applications: {
      VaisseauxActorSheet,
      PersonnageActorSheet,
      WpnSheet,
      EquipementSheet,
      AmeliorationSheet,
      AvarieSheet,
      ArmementSheet,
    },
    documents:{
      NautilusActor,
      NautilusItem,
      GmTool
    },
    RollPersonnageMacro,
    RollVaisseauxMacro,
    doRoll,
    personnages:{
      createRollMsg:createRollMsgPersonnage
    },
    vaisseaux:{
      createRollMsg:createRollMsgVaisseaux
    }
  };

  // Add custom constants for configuration.
  CONFIG.NAUTILUS = NAUTILUS;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "0",
    decimals: 2
  };
  // Define custom Document classes
  CONFIG.Actor.documentClass = NautilusActor;
  CONFIG.Item.documentClass = NautilusItem;

  CONFIG.Actor.dataModels = {
    equipage:EquipageDataModel,
    heritier:HeritierDataModel,
    personnage:PersonnageDataModel,
    vaisseaux:VaisseauxDataModel,
  };
  CONFIG.Item.dataModels = {
    amelioration:AmeliorationDataModel,
    armement:ArmementDataModel,
    equipement:EquipementDataModel,
    avarie:AvarieDataModel,
    distance:DistanceDataModel,
    melee:MeleeDataModel,
  };

  // SETTINGS
  RegisterSettings();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  Actors.registerSheet("nautilus", VaisseauxActorSheet, {
    types: ["vaisseaux"],
    makeDefault: true
  });

  Actors.registerSheet("nautilus", PersonnageActorSheet, {
    types: ["heritier", "equipage", "personnage"],
    makeDefault: true
  });

  Items.registerSheet("nautilus", WpnSheet, {
    types: ["distance", "melee"],
    makeDefault: true
  });

  Items.registerSheet("nautilus", EquipementSheet, {
    types: ["equipement"],
    makeDefault: true
  });

  Items.registerSheet("nautilus", AmeliorationSheet, {
    types: ["amelioration"],
    makeDefault: true
  });

  Items.registerSheet("nautilus", AvarieSheet, {
    types: ["avarie"],
    makeDefault: true
  });

  Items.registerSheet("nautilus", ArmementSheet, {
    types: ["armement"],
    makeDefault: true
  });

  Handlebars.registerHelper('translate', function(tra, where) {
    const translation = game.i18n.localize(CONFIG.NAUTILUS[where][tra]);

    return translation;
  });

  Handlebars.registerHelper('labelR', function(value) {
    const result = value > 1 ? game.i18n.localize("NAUTILUS.ROLL.Reussites") : game.i18n.localize("NAUTILUS.ROLL.Reussite");

    return result;
  });

  Handlebars.registerHelper('sanCheck', function(actuel, key) {
    let val = key.substring(1)

    let result = false;

    if(actuel <= +val) result = true;
    return result;
  });

  Handlebars.registerHelper('semCheck', function(actuel, key) {

    let result = false;

    if(actuel <= key) result = true;
    return result;
  });

  Handlebars.registerHelper('isEqual', function(actuel, key) {
    let result = false;

    if(actuel === key) result = true;
    return result;
  });

  Handlebars.registerHelper('generateSelect', function(type, data=[]) {
    let result = {};

    switch(type) {
      case 'vm':
        result[''] = '';
        result = foundry.utils.mergeObject(result, CONFIG.NAUTILUS.vm);
        break;

      case 'pression':
        result = Object.fromEntries(
          Object.entries(CONFIG.NAUTILUS.pression).map(([value, label]) => [
              value,
              `${game.i18n.localize('NAUTILUS.PRESSION.Label')} : ${game.i18n.localize(label)}`
          ])
      );
        break;

      case 'malus':
        result = {
          'false':"NAUTILUS.VAISSEAUX.SANTE.NotMalus",
          '1':"NAUTILUS.VAISSEAUX.SANTE.HasMalus",
          '2':"NAUTILUS.VAISSEAUX.SANTE.HasMalus2",
        }
        break;

      case 'aptitudes':
      case 'specialites':
        result = data.reduce((acc, itm) => {
          if(itm !== '') acc[itm] = game.i18n.localize(`NAUTILUS.VAISSEAUX.APTITUDES.${itm.charAt(0).toUpperCase() + itm.slice(1)}`);
          else acc[itm] = '';
          return acc;
        }, {});
        break;
    }

    return result;
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", NautilusHooks.ready);

Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (bar, data, slot) => createMacro(bar, data, slot));
});

async function createMacro(bar, data, slot) {
  // Create the macro command

  const type = data.type;
  const label = data.label;
  const actorId = data.actorId;
  const wpnId = data.wpn;
  const aptitude = data.aptitude;
  const specialite = data.specialite;
  const command = type === 'vaisseaux' ? `game.nautilus.RollVaisseauxMacro("${actorId}", "${aptitude}", "${specialite}", "${wpnId}");` : `game.nautilus.RollPersonnageMacro("${actorId}", "${aptitude}", "${specialite}", "${wpnId}");`;

  let img = "";

  console.log(specialite);

  if(wpnId !== false) img = game.actors.get(actorId).items.get(wpnId).img;
  else if(specialite !== false) img = "systems/nautilus/assets/icons/dices.svg";

  let macro = await Macro.create({
    name: label,
    type: "script",
    img: img,
    command: command,
    flags: { "nautilus.attributMacro": true }
  });
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

async function RollPersonnageMacro(actorid, aptitude, spe, wpn) {
  const speaker = ChatMessage.getSpeaker();

  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) actor = game.actors.get(actorid);

  const type = actor.type;
  const getData = actor.system;
  const getDWpn = wpn === 'false' ? {} : actor.items.get(wpn);
  const key = aptitude;
  const data = getData.aptitudes[key];
  const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
  const bValue = data.value
  const specialites = data.specialites;
  const pression = getData.pression.value;
  const sante = getData.sante.value;
  const getVM = getData.valeursmorales;
  const getNameWpn = wpn === 'false' ? "" : getDWpn.name;
  const getDataWpn = wpn === 'false' ? false : getDWpn.system;
  const vm = CONFIG.NAUTILUS.vm;
  const lvm = [`<option value="" selected></option>`];
  const tvm = [];
  const isContact = key === 'sebattre' ? true : false;
  let bvm = {};

  let specialite = "";

  if(Object.keys(specialites).length > 0) {
    if(!spe) {
      specialite = `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" checked /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>`
    } else {
      specialite = `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>`
    }
  }


  for(let key in specialites) {
    const data = specialites[key];
    const name = data.name;
    const value = data.value;
    const description = data.description;

    if(spe !== false) {
      if(key === spe) specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" checked /><span>${name} ${value}R</span></label>`;
      else specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
    } else {
      specialite += `<label class="spe" title="${description}"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
    }
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
          const firstRoll = await game.nautilus.doRoll(value, pression);
          const firstTotal = firstRoll.roll.total;
          let formula = firstRoll.formula;

          if(speSelected !== undefined && speSelected !== 'aucune') {
            const speName = specialites[speSelected].name;
            const speValue = specialites[speSelected].value;
            const speLabel = wpn === 'false' ? `${speName} (${label})` : `${speName} (${label}) - ${getNameWpn}`;
            let mergeResults;

            if(firstTotal === value) {
              const explode = await game.nautilus.doRoll(speValue, pression, sante);
              mergeResults = [...firstRoll.roll.dice[0].results, ...explode.roll.dice[0].results];
              formula += ` (${game.i18n.localize(`NAUTILUS.ROLL.Base`)}) + ${explode.formula} (${game.i18n.localize(`NAUTILUS.ROLL.Specialite`)})`;

              let r1 = [];

              for(let i = 0;i < mergeResults.length;i++) {
                const dS = mergeResults[i];

                if(dS.result === 1) r1.push(i);
              }

              game.nautilus.personnages.createRollMsg(actor, speLabel, mergeResults, formula, firstTotal+explode.roll.total, specialites, r1, getDataWpn, vmSelected, isContact);
            } else {
              let toR = value-firstTotal;

              if(speValue < toR) toR = speValue;

              const relance = await game.nautilus.doRoll(toR, pression, sante);

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

              game.nautilus.personnages.createRollMsg(actor, speLabel, rF, formula, firstTotal+relance.roll.total, specialites, r1, getDataWpn, vmSelected, isContact);
            }

          } else {
            let r1 = [];

            for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
              const dS = firstRoll.roll.dice[0].results[i];

              if(dS.result === 1) r1.push(i);
            }

            const baseLabel = wpn === 'false' ? label : `${label} - ${getNameWpn}`;

            game.nautilus.personnages.createRollMsg(actor, baseLabel, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, getDataWpn, vmSelected, isContact);
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
}

async function RollVaisseauxMacro(actorid, aptitude, spe, wpn) {
  const speaker = ChatMessage.getSpeaker();

  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) actor = game.actors.get(actorid);
  const gData = actor;
  const getData = gData.system;
  const listActors = game.actors;

  const lHeritiers = [];
  const lEquipage = [];
  const lRoll = {
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

  for(let i of listActors) {
    const type = i.type;

    switch(type) {
      case 'heritier':
        lHeritiers.push({name:i.name, role:i.system.role, id:i._id})
        break;

      case 'equipage':
        lEquipage.push({name:i.name, role:i.system.role, id:i._id})
        break;
    }
  }

  for (let i of actor.items) {
    if (i.type === 'amelioration' && getData.options.isnautilus) {
      const bRoll = i.system.roll;

      if(bRoll.actif) {
        if(bRoll.aptitude !== '' && bRoll.specialite === '') lRoll[bRoll.aptitude]['value'].push(bRoll.value);
        else if(bRoll.aptitude !== '' && bRoll.specialite !== '') lRoll[bRoll.aptitude][bRoll.specialite].push(bRoll.value);
      }
    }
  }

  const key = aptitude;
  const data = getData.aptitudes[key];
  const label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[key]);
  const bValue = data.value
  const specialites = data.specialites;
  const pression = getData.pression.value;
  const sante = getData.sante;
  const getDWpn = wpn !== 'false' ? actor.items.get(wpn) : {};

  const heritiers = lHeritiers.sort((a, b) => (a.name > b.name ? 1 : -1));
  const vm = CONFIG.NAUTILUS.vm;
  const lvm = [`<option value="" selected></option>`];
  const tvm = [];
  const lheritier = [`<option value="" selected></option>`];
  let bvm = {};
  let getNameWpn = '';
  let getDataWpn = false;

  if(wpn !== 'false') {
    getNameWpn = `<br/>${getDWpn.name}`;
    getDataWpn = getDWpn.type === 'armement' ? getDWpn.system : {degats:getDWpn.system.distance.degats};
  }

  let specialite = "";

  if(Object.keys(specialites).length > 0) {
    if(spe !== 'false') specialite = `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>`;
    else specialite = `<label class="spe"><input type="radio" class="specialite" name="specialite" value="aucune" checked /><span>${game.i18n.localize("NAUTILUS.ROLL.ASK.Aucune")}</span></label>`;
  }

  for(let key in specialites) {
    const name = specialites[key].name;
    const value = specialites[key].value;

    if(key === spe) {
      specialite += `<label class="spe"><input type="radio" class="specialite" name="specialite" value="${key}" checked/><span>${name} ${value}R</span></label>`;
    } else {
      specialite += `<label class="spe"><input type="radio" class="specialite" name="specialite" value="${key}" /><span>${name} ${value}R</span></label>`;
    }
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
          const amelioration = speSelected !== undefined && speSelected !== 'aucune' ? lRoll[key][specialites[speSelected].label].reduce((accumulator, currentValue) => accumulator + currentValue, 0) : lRoll[key].value.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
          const value = +bValue + +mod + vmBonus - santeMalus + amelioration;
          const firstRoll = await game.nautilus.doRoll(value, pression);
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
              const explode = await game.nautilus.doRoll(speValue, pression);
              mergeResults = [...firstRoll.roll.dice[0].results, ...explode.roll.dice[0].results];
              formula += ` (${game.i18n.localize(`NAUTILUS.ROLL.Base`)}) + ${explode.formula} (${game.i18n.localize(`NAUTILUS.ROLL.Specialite`)})`;

              let r1 = [];

              for(let i = 0;i < mergeResults.length;i++) {
                const dS = mergeResults[i];

                if(dS.result === 1) r1.push(i);
              }

              game.nautilus.vaisseaux.createRollMsg(actor, speLabel, mergeResults, formula, firstTotal+explode.roll.total, specialites, r1, getDataWpn, vmSelected);
            } else {
              let toR = value-firstTotal;

              if(speValue < toR) toR = speValue;

              const relance = await game.nautilus.doRoll(toR, pression);

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

              game.nautilus.vaisseaux.createRollMsg(actor, speLabel, rF, formula, firstTotal+relance.roll.total, specialites, r1, getDataWpn, vmSelected);
            }

          } else {
            let r1 = [];

            for(let i = 0;i < firstRoll.roll.dice[0].results.length;i++) {
              const dS = firstRoll.roll.dice[0].results[i];

              if(dS.result === 1) r1.push(i);
            }

            game.nautilus.vaisseaux.createRollMsg(actor, `${label}${getHeritierName}${getNameWpn}`, firstRoll.roll.dice[0].results, formula, firstTotal, specialites, r1, getDataWpn, vmSelected);
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
}

async function doRoll(value, pression) {
  let val = value;

  if(val < 0) val = 0;

  const formula = `${val}D10>=${pression}`;

  let r = new Roll(`${val}D10cs>=${pression}`);

  await r.evaluate({async:true});

  return {roll:r, formula:formula};
}

async function createRollMsgPersonnage(actor, label, lDices, formula, total, specialites, r1, wpn=false, hasVm='', isContact=false) {
  const type = actor.type;
  const gForcer = +actor.system.bonus.contact;
  const gSante = actor.system.sante;
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
      actor.update({[`system.valeursmorales.${hasVm}.value`]:+actor.system.valeursmorales[hasVm].value-1});
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
      actor: actor?.id || null,
      token: actor?.token?.id || null,
      alias: actor?.name || null,
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

async function createRollMsgVaisseaux(actor, label, lDices, formula, total, specialites, r1, wpn=false, hasVm='') {
  const vSante = actor.system.sante.value;
  const sante = actor.system.sante.list[`s${vSante}`].notes;

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
      actor: actor?.id || null,
      token: actor?.token?.id || null,
      alias: actor?.name || null,
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