export const RegisterSettings = function () {
    /* ------------------------------------ */
    /* User settings                        */
    /* ------------------------------------ */
    game.settings.register("nautilus", "pression", {
        name: "",
        hint: "",
        scope: "world",
        config: false,
        default: 5,
        type: Number,
    });

    game.settings.register("nautilus", "vmc", {
        name: "",
        hint: "",
        scope: "world",
        config: false,
        default: "",
        type: String,
    });
};