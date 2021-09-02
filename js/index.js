const currencyList = $('.currency-list');
const addCurrencyBtn = $('.add-currency-button');
const newCurrencyForm = $('.new-currency-background');
newCurrencyForm.nameInput = newCurrencyForm.find('input#new-currency-name');
newCurrencyForm.valueInput = newCurrencyForm.find('input#new-currency-value');

class Currency {
    constructor({ value, name, addButtons = true, showValue = true }) {
        $.extend(this, $('<div class="currency-item"></div>'));
        this.value = value;
        this.name = name;
        this.amount = null;

        this.append(`<span class="currency-name"><span>${name}</span></span>`);
        this.append('<input type="text" class="currency-input">');
        this.inputElement = this.find('input');
        //add default regex patterns
        let inputRegex = [
            /[^0-9,\.\-]/,
            [ /,/, '.' ],
            [ /(.+)-/, '$1' ],
            [ /\.(.*)\./, '.$1' , -1],
            [ /^(-?)\./, '$10.' ],
            [ /^(-?)0{2,}/, '$10' ],
        ];
        //process regex patterns for the input
        //accepts an array of [pattern, replace] arrays
        this.inputElement.on('input', function(e) {
            let val = $(this).val();
            let caretPosition = e.target.selectionStart; 
            inputRegex.forEach(patternArr => {
                if (!Array.isArray(patternArr)) patternArr = [patternArr, ''];
                let safetySwitch = 0;
                while (val.match(patternArr[0])) {
                    if (safetySwitch > 99) throw 'Executing of regex patterns on input took too long, action aborted';
                    let lengthBefore = val.length;
                    val = val.replace(patternArr[0], patternArr[1]);
                    $(this).val(val);
                    caretPosition -= lengthBefore - val.length;
                    safetySwitch++;
                }
            });
            $(this).val(val);
            this.setSelectionRange(caretPosition, caretPosition);
        });
        const globalThis = this;
        //update other currencies based on this value
        this.inputElement.on('input', function() {
            if ($(this).val().endsWith('.')) return;
            updateCurrencyValues(globalThis.value * $(this).val(), globalThis.name);
        });
        //add delete and edit buttons
        if (addButtons) {
            let nameEl = this.find('span.currency-name');
            let editButton = $('<button class="edit fas fa-pen"></button>');
            let deleteButton = $('<button class="delete fas fa-trash"></button>');
            nameEl.append(editButton);
            nameEl.append(deleteButton);
            editButton.click(function() {
                openNewCurrencyForm(globalThis.name, globalThis.value);
            });
            deleteButton.click(function() {
                globalThis.delete();
            });
        }
        if (showValue) {
            let valueDisplay = $(`<span class="value-display">Wartość: ${value} zł</span>`);
            this.valueDisplay = valueDisplay;
            valueDisplay.appendTo(this);
        }
    }
    addToDOM(destination, addMode) {
        if (!destination) throw 'Cannot add field to element: no destination specified!';
        destination = $(destination);
        switch (addMode?.toLowerCase?.()) {
            case 'prepend':
                this.prependTo(destination);
                break;
            case 'insertafter':
                this.insertAfter(destination);
                break;
            case 'insertbefore':
                this.insertBefore(destination);
                break;
            default:
                this.appendTo(destination);
                break;
        }
        return this;
    }
    fromPLN(plnCount) {
        return Math.roundTo(plnCount/this.value, 2);
    }
    setAmount(value) {
        this.amount = value;
        this.inputElement.val(value);
    }
    setValue(value) {
        this.value = value;
        nameValuePairs[this.name] = value;
        this.valueDisplay.html(`Wartość: ${value} zł`);
        localStorage.setItem('currencies', JSON.stringify(nameValuePairs));
    }
    setName(name) {
        allNames.splice(allNames.indexOf(this.name), 1);
        delete allCurrencies[this.name];
        delete nameValuePairs[this.name];
        this.name = name;
        allCurrencies[name] = this;
        nameValuePairs[name] = this.value;
        localStorage.setItem('currencies', JSON.stringify(nameValuePairs));
        this.find('.currency-name').children('span').html(name);
    }
    delete() {
        allNames.splice(allNames.indexOf(this.name), 1);
        delete allCurrencies[this.name];
        delete nameValuePairs[this.name];
        localStorage.setItem('currencies', JSON.stringify(nameValuePairs));
        this.remove();
    }
}
Math.roundTo = function(num, places = 1) {
    return Math.round(num*(10**places))/(10**places);
}

const PLN = new Currency({ value: 1, name: 'Polski złoty', addButtons: false, showValue: false, }).addToDOM(addCurrencyBtn, 'insertBefore');
const allCurrencies = {};
const allNames = [];
const nameValuePairs = {};
let fromLocalStorage = localStorage.getItem('currencies');
console.log(fromLocalStorage);
if (!fromLocalStorage || fromLocalStorage == '{}') {
    addCurrencyItem(0.28, 'Kajzerka');
    updateCurrencyValues(10);
}
else {
    fromLocalStorage = JSON.parse(fromLocalStorage);
    for (const name in fromLocalStorage) {
        const value = fromLocalStorage[name];
        addCurrencyItem(value, name);
    }
    updateCurrencyValues(10);
}

//! handle adding new currencies
addCurrencyBtn.click(function() {
    openNewCurrencyForm(null);
});
newCurrencyForm.click(closeNewCurrencyForm);
newCurrencyForm.find('.close-form').click(closeNewCurrencyForm);
newCurrencyForm.children().click(function(e) {
    e.stopPropagation();
});
newCurrencyForm.find('.submit-form').click(function() {
    let shouldReturn = false;
    if ($(this).attr('old-name') != newCurrencyForm.nameInput.val() && (!newCurrencyForm.nameInput.val() || allNames.includes(newCurrencyForm.nameInput.val()))) {
        newCurrencyForm.nameInput.addClass('error');
        shouldReturn = true;
    }
    if (!newCurrencyForm.valueInput.val()) {
        newCurrencyForm.valueInput.addClass('error');
        shouldReturn = true;
    }
    if (shouldReturn) return;
    if ($(this).attr('old-name')) {
        const oldName = $(this).attr('old-name');
        allCurrencies[oldName].setValue(newCurrencyForm.valueInput.val());
        allCurrencies[oldName].setName(newCurrencyForm.nameInput.val());
        closeNewCurrencyForm();
        updateCurrencyValues(PLN.amount);
        return;
    }
    addCurrencyItem(newCurrencyForm.valueInput.val(), newCurrencyForm.nameInput.val());
    closeNewCurrencyForm();
    updateCurrencyValues(PLN.amount);
})
newCurrencyForm.nameInput.on('input', function() {
    $(this).removeClass('error');
});
newCurrencyForm.valueInput.on('input', function() {
    $(this).removeClass('error');
    
    //add default regex patterns
    let inputRegex = [
        /[^0-9,\.\-]/,
        [ /,/, '.' ],
        [ /(.+)-/, '$1' ],
        [ /\.(.*)\./, '.$1' , -1],
        [ /^(-?)\./, '$10.' ],
        [ /^(-?)0{2,}/, '$10' ],
    ];
    //process regex patterns for the input
    //accepts an array of [pattern, replace] arrays
    $(this).on('input', function(e) {
        let val = $(this).val();
        let caretPosition = e.target.selectionStart; 
        inputRegex.forEach(patternArr => {
            if (!Array.isArray(patternArr)) patternArr = [patternArr, ''];
            let safetySwitch = 0;
            while (val.match(patternArr[0])) {
                if (safetySwitch > 99) throw 'Executing of regex patterns on input took too long, action aborted';
                let lengthBefore = val.length;
                val = val.replace(patternArr[0], patternArr[1]);
                $(this).val(val);
                caretPosition -= lengthBefore - val.length;
                safetySwitch++;
            }
        });
        $(this).val(val);
        this.setSelectionRange(caretPosition, caretPosition);
    });
});
function openNewCurrencyForm(oldName = null, oldValue) {
    newCurrencyForm.fadeIn(300);
    let submitBtn = newCurrencyForm.find('.submit-form')
    submitBtn.attr('old-name', oldName);
    submitBtn.html('Dodaj');
    if (oldName) {
        submitBtn.html('Zapisz');
        newCurrencyForm.nameInput.val(oldName);
        newCurrencyForm.valueInput.val(oldValue);
    }
}
function closeNewCurrencyForm() {
    newCurrencyForm.fadeOut(300);
    clearNewCurrencyForm();
}
function clearNewCurrencyForm() {
    newCurrencyForm.nameInput.val(null);
    newCurrencyForm.valueInput.val(null);
    newCurrencyForm.nameInput.removeClass('error');
    newCurrencyForm.valueInput.removeClass('error');
}
function addCurrencyItem(value, name) {
    nameValuePairs[name] = value;
    localStorage.setItem('currencies', JSON.stringify(nameValuePairs));
    allNames.push(name);
    allCurrencies[name] = new Currency({ value, name }).addToDOM(addCurrencyBtn, 'insertBefore');
}

function updateCurrencyValues(pln, name) {
    PLN.setAmount(Math.roundTo(pln, 2));
    for (const currencyName in allCurrencies) {
        if (currencyName == name) continue;
        const currency = allCurrencies[currencyName];
        currency.setAmount(currency.fromPLN(pln));
    }
}