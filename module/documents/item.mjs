/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class NautilusItem extends Item {
    static async create(data, options = {}) {
        // Replace default image
        if (data.img === undefined) {

            switch(data.type) {
                case "distance":
                    data.img = "systems/nautilus/assets/icons/distance.svg";
                    break;

                case "melee":
                    data.img = "systems/nautilus/assets/icons/melee.svg";
                    break;

                case "equipement":
                    data.img = "systems/nautilus/assets/icons/equipement.svg";
                    break;

                case "amelioration":
                    data.img = "systems/nautilus/assets/icons/amelioration.svg";
                    break;

                case "avarie":
                    data.img = "systems/nautilus/assets/icons/avarie.svg";
                    break;

                case "armement":
                    data.img = "systems/nautilus/assets/icons/armement.svg";
                    break;
            }
        }

        await super.create(data, options);
    }
}
