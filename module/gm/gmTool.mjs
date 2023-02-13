export class GmTool extends FormApplication {
    constructor(data) {
        super();

        this.object = data;
    }

    static get defaultOptions() {
        const x = $(window).width();
        const y = $(window).height();
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["nautilus", "gmTool"],
            template: "systems/nautilus/templates/gm/gm-tool-sheet.html",
            title: game.i18n.localize("NAUTILUS.TOOL.MJ"),
            left: x - 630,
            top: y - 210,
            closeOnSubmit: false,
            submitOnClose: false,
            submitOnChange: true,
            minimizable: false
        });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    getData() {
        const context = super.getData();


        return context;
    }

    async render(force = false, options = {}) {
        if (!game.user.isGM) {
            return false;
        }

        return super.render(force, options);
    }

    /**
     * Remove the close button
     * @override
     */
     _getHeaderButtons() {
        return [];
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (!game.user.isGM) {
            return;
        }

        html.find('select.pression').change(async ev => {
            const target = $(ev.currentTarget);
            const pression = target.val();
            const actors = game.actors;

            await game.settings.set("nautilus", "pression", pression);

            for (let [key, value] of actors.entries()) {
                if(value.type === 'heritier' || (value.type === 'vaisseaux' && value.system.options.isnautilus)) value.update({['system.pression.value']:pression});
            }

            const baseData = {
                msg:`${game.i18n.localize('NAUTILUS.PRESSION.Label')} : ${game.i18n.localize(CONFIG.NAUTILUS.pression[`${pression}`])}`,
                class:`pression p${pression}`
            };

            const msgData = {
                user: game.user.id,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                content: await renderTemplate('systems/nautilus/templates/msg/default.html', baseData),
                sound: CONFIG.sounds.dice
              };

            const msg = await ChatMessage.create(msgData);
        });

        html.find('select.vmc').change(async ev => {
            const target = $(ev.currentTarget);
            const vmc = target.val();
            const actors = game.actors;

            await game.settings.set("nautilus", "vmc", vmc);

            for (let [key, value] of actors.entries()) {
                if(value.type === 'heritier') value.update({['system.valeursmorales.commune']:vmc});
            }
        });

        html.find('i.fa-lock-open').click(async ev => {
            this.object.vmcunlock = true;

            this.render(true);
        });

        html.find('i.fa-lock').click(async ev => {
            this.object.vmcunlock = false;

            this.render(true);
        });
    }

    async _updateObject(event, formData) {
        for (let key in formData) {
            const dataKey = key.split(".")[1];
            this.object[dataKey] = formData[key];
        }

        this.render(true);
    }

    /** @inheritdoc */
    async close(options={}) {
        return;
    }
 }