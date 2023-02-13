class Toggler {
  constructor() {
    this.toggles = this._load();
  }

  init(id, html) {
    id = this._cleanId(id);

    html[0].querySelectorAll('.js-toggler').forEach((element, index) => {
      const visible = this.toggles.get(this._getKey(id, index));

      if ('undefined' !== typeof visible) {
        this._getSiblings(element).toggle(visible);
        this._toggleClasses(element.querySelector('.deploy'), visible);
      }

      element.querySelector('.deploy').addEventListener('click', e => {
        e.preventDefault();

        const target = e.currentTarget;

        this._toggleClasses(target);

        this._getSiblings(element).toggle({
          complete: () => this._setElementVisibility(id, index, element),
        });
      });
    });
  }

  clearForId(id) {
    id = this._cleanId(id);

    this.toggles.forEach((value, key) => {
      if (key.startsWith(id)) {
        this.toggles.delete(key);
      }
    });

    this._save();
  }

  clearAll() {
    this.toggles = new Map();

    this._save();
  }

  _cleanId(id) {
    return id.split('-').pop();
  }

  _getSiblings(element) {
    return $(element).siblings();
  }

  _toggleClasses(element, forcedVisibility) {
    if ('undefined' === typeof forcedVisibility) {
        $(element).find('i').toggleClass('fa-circle-plus');
        $(element).find('i').toggleClass('fa-circle-minus');

      return;
    }

    if (forcedVisibility) {
        $(element).find('i').removeClass('fa-circle-plus');
        $(element).find('i').addClass('fa-circle-minus');
    } else {
        $(element).find('i').addClass('fa-circle-plus');
        $(element).find('i').removeClass('fa-circle-minus');
    }
  }

  _setElementVisibility(id, index, element) {
    const target = this._getToggleTarget(element);

    this.toggles.set(this._getKey(id, index), 'none' !== target.style.display);

    this._save();
  }

  _getToggleTarget(element) {
    return element.nextElementSibling;
  }

  _getKey(id, index) {
    return `${id}-${index}`;
  }

  _save() {
    const dataset = {};

    this.toggles.forEach((value, key) => {
      dataset[key] = value;
    });

    localStorage.setItem('nautilus.togglers', JSON.stringify(dataset));
  }

  _load() {
    const dataset = localStorage.getItem('nautilus.togglers');
    if (null === dataset) {
      return new Map();
    }

    const map = new Map();

    for (const [key, value] of Object.entries(JSON.parse(dataset))) {
      map.set(key, value);
    }

    return map;
  }
}

export default new Toggler();
