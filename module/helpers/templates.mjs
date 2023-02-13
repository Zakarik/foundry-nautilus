/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Attribute list partial.
    "systems/nautilus/templates/parts/tabs/aptitudes.html",
    "systems/nautilus/templates/parts/tabs/vmsan.html",
    "systems/nautilus/templates/parts/tabs/partial/vm.html",
    "systems/nautilus/templates/parts/tabs/partial/san.html",
    "systems/nautilus/templates/parts/tabs/partial/psan.html",
    "systems/nautilus/templates/parts/tabs/partial/vsan.html",
    "systems/nautilus/templates/parts/tabs/partial/apt.html",
    "systems/nautilus/templates/parts/tabs/partial/sem.html",
    "systems/nautilus/templates/parts/tabs/partial/ame.html",
    "systems/nautilus/templates/parts/tabs/partial/ava.html",
    "systems/nautilus/templates/parts/tabs/partial/quarts.html",
    "systems/nautilus/templates/parts/tabs/partial/lieux.html",
    "systems/nautilus/templates/parts/tabs/partial/creatures.html",
    "systems/nautilus/templates/parts/tabs/equipements.html",
    "systems/nautilus/templates/parts/tabs/historique.html",
    "systems/nautilus/templates/parts/tabs/aptsan.html",
    "systems/nautilus/templates/parts/tabs/equipage.html",
    "systems/nautilus/templates/parts/tabs/armement.html",
    "systems/nautilus/templates/parts/tabs/ameava.html",
    "systems/nautilus/templates/parts/tabs/voyage.html",
    "systems/nautilus/templates/parts/tabs/description.html",
    "systems/nautilus/templates/parts/tabs/options.html",
    "systems/nautilus/templates/msg/roll.html",
    "systems/nautilus/templates/msg/default.html",
    "systems/nautilus/templates/ask/roll.html",
    "systems/nautilus/templates/ask/roll-nautilus.html",
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};