// VARIABLES -------------------------------------------------------------------
var downArrow = 'keyboard_arrow_down';
var rightArrow = 'keyboard_arrow_right';        // These values may change if you use a different icon pack

// HELPER FUNCTIONS ------------------------------------------------------------

/* Detect if the device is an iOS device with rounded corners */
function isIOS() { 
    console.log(navigator.userAgent);
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
/* Use the isIOS function to apply a class to the body to allow for iOS specific styling */
function updateForIOS() { 
    if (isIOS() == true) { 
        document.body.classList.add('ios');
    } else {
        document.body.classList.remove('ios');
    }
}

/* Check if device supports fullscreen mode */
function supportsFullscreen() {
    return !!(document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen);
}
/* Use the supportsFullscreen function to apply a class to tell the body not to support fullscreen */
function updateForFullscreen() {
    if (supportsFullscreen() == false) {
        document.body.classList.add('no-fullscreen');
    } else {
        document.body.classList.remove('no-fullscreen');
    }
}



// Lists containing every initialised instance of a Ph object
var Ph_SelectList = [];
var Ph_ChipList = [];
var Ph_TextList = [];
var Ph_TextAreaList = [];
var Ph_RangeList = [];
var Ph_CheckList = [];
var Ph_CheckContainerList = [];
var Ph_FileUploadList = [];
var Ph_StepperList = [];

var Ph_SectionList = [];
var Ph_ContainerList = [];

var Ph_MobileSheetList = [];
var Ph_MobileDrawerList = [];

// FRAMEWORK -------------------------------------------------------------------
function loadFramework() {
    let framework = new Ph_Framework({
        downArrow: downArrow,
        rightArrow: rightArrow
    });
    framework.initialise();

    // Small functions
    updateForIOS();
    updateForFullscreen();
}
class Ph_Framework {
    constructor({
        iconPack = 'material-icons-round',
        downArrow = 'keyboard_arrow_down',
        rightArrow = 'keyboard_arrow_right'
    } = {}) {
        this.iconPack = iconPack;
        this.downArrow = downArrow;
        this.rightArrow = rightArrow;
    }

    initialise() {
        loadSelects();
        loadTexts();
        loadRanges();
        loadChecks();
        loadCheckContainers();
        loadFileUploads();
        loadSteppers();
        loadSections();
        loadContainers();
        loadMobileSheets();
        loadMobileDrawers();
    }
}



// INPUTS ----------------------------------------------------------------------

// SELECT / DROPDOWN
function loadSelects() {

    // Iterate through every select item
    const selects = document.getElementsByClassName('input select');
    let i = 0;
    for (item of selects) {
        // Create & initialise item
        let options = [];
        for (option of item.querySelector('div').children) {
            options.push(new Ph_SelectOption({
                value: option.value,
                content: option.innerHTML,
                isSelected: option.classList.contains('selected'),
                isDisabled: option.disabled,
                parent: item.parentNode,
                html: option
            }));
        }

        let select = new Ph_Select({
            placeholder: item.querySelector('span'),
            parent: item.parentNode,
            options: options, 
            isDisabled: item.classList.contains('disabled'),
            isHighlighted: item.classList.contains('highlight'),
            html: item
        });
        select.initialise();

        i++;
    }
}
function getSelect(id) {
    for (item of Ph_SelectList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}

class Ph_SelectOption {
    constructor({
        value = '',
        content = '',
        isSelected = false,
        isDisabled = false,
        parent,
        html
    } = {}) {
        // Check for errors
        if (!value && value != 0) { console.error('Unable to construct object SelectOption: no value provided.'); return; }
        if (parent && typeof(parent) != 'object') { console.error('Unable to construct object SelectOption: invalid parent provided.'); return; }

        this.value = value;
        this.content = content;
        this.isSelected = isSelected;
        this.isDisabled = isDisabled;
        this.parent = parent;
        this.html = html
    }

    initialise() {
        // Give onclick
        let object = this.html;
        
        // Update states
        if (this.isDisabled) { this.disable(); }
    }

    instantiate() {
        // Create objects
        let option = document.createElement('button');
        if (this.value) { option.value = this.value; }
        option.innerHTML = this.content;
        if (this.parent) { this.parent.appendChild(option); }

        // Initialise & return
        this.html = option;
        this.initialise();
        return(this.html);
    }

    disable(disableObject = true) {
        this.html.disabled = disableObject;
        this.isDisabled = disableObject;
    }

    select(selectObject = true) {
        if (selectObject) { this.html.classList.add('selected'); }
        else { this.html.classList.remove('selected'); }
        
        this.isSelected = selectObject;
    }
}
class Ph_Select {
    constructor({
        id = 0,
        placeholder = '',
        options,
        selectedOption = -1,
        isDisabled = false,
        isHighlighted = false,
        isPrepended = false,
        parent,
        html
    } = {}) {
        // Check for errors
        if (!placeholder) { console.error('Unable to construct object Select: no placeholder provided.'); return; }
        if (!parent || typeof(parent) != 'object') { console.error('Unable to construct object Select: no parent provided.'); return; }
        if (!options) { console.error('Unable to construct object Select: no options provided.'); return; }
        if (!selectedOption > options.length) { console.warn('Selected option for object Select is outside of option length range.'); }

        for (item of options) {
            if(!item instanceof Ph_SelectOption) { 
                options.splice(options.indexOf(item), 1);
                console.warn('Removed option: ' + item + ': not a valid type.');
            }
        }

        // Assign variables
        this.id = id;
        this.placeholder = placeholder;
        this.options = options;
        this.selectedOption = selectedOption;
        this.isDisabled = isDisabled;
        this.isHighlighted = isHighlighted;
        this.isPrepended = isPrepended;
        this.parent = parent;
        this.html = html;
    }

    initialise() {
        // Check for errors
        if (!this.html) { console.error('Unable to initialise object: no html content.'); return; }

        // Add onclick to dropdown
        let selectObject = this;
        this.html.onclick = function() { selectObject.toggleOpen(); }

        // Loop over options
        for (item of this.options) {
            // Assign onclick
            let option = item;
            option.html.onclick = function() { selectObject.selectItem(selectObject.options.indexOf(option)); }

            // Find selected option
            if (item.isSelected || this.selectedOption == this.options.indexOf(item)) { this.selectItem(this.options.indexOf(item)); }
        }

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }

        // Assign ID & add to list
        this.id = Ph_SelectList.length;
        this.html.classList.add('ph-select-' + Ph_SelectList.length);
        Ph_SelectList.push(this);
    }

    instantiate() {

        // Create objects
        let dropdown = document.createElement('div');
        dropdown.classList.add('input', 'select');
        if (this.isHighlighted) { dropdown.classList.add('highlight'); }

        let placeholder = document.createElement('span');
        placeholder.innerHTML = this.placeholder + '...';
        dropdown.appendChild(placeholder);

        let icon = document.createElement('span');
        icon.classList.add('material-icons-round');
        icon.innerHTML = rightArrow;
        dropdown.appendChild(icon);

        let optionsContainer = document.createElement('div');
        dropdown.appendChild(optionsContainer);

        let i = 0;
        for (item of this.options) {
            let option = document.createElement('button');
            option.setAttribute('data-value', item.value);
            option.innerHTML = item.content;
            item.html = option;

            if (i == this.selectedOption) { option.classList.add('selected'); }

            optionsContainer.appendChild(option);
            i++;
        }

        // Initialise & return
        if (this.isPrepended) { this.parent.insertBefore(dropdown, this.parent.firstChild); }
        else { this.parent.appendChild(dropdown); }
        this.html = dropdown;
        this.initialise();
        return(dropdown);
    }

    toggleOpen() {
        if (!this.isDisabled) {
            this.html.classList.toggle('open');
            
            let icon = this.html.querySelector('.material-icons-round');
            if (this.html.classList.contains('open')) { icon.innerHTML = downArrow; }
            else { icon.innerHTML = rightArrow; }
        }
    }

    selectItem(id) {
        let option = this.options[id];
        if (!option) { console.error('Unable to select Option with ID ' + id + ': unable to find object.'); return; }

        // Save selected option ID
        this.selectedOption = id;

        // Iterate over every option
        for (item of this.options) {
            item.select(false);
        }
        option.select();

        // Set select innerHTML
        this.html.querySelector('span').innerHTML = option.content;
    }

    disable(disableObject = true) {
        if (disableObject) { this.html.classList.add('disabled'); } 
        else { this.html.classList.remove('disabled'); }

        this.isDisabled = this.html.classList.contains('disabled');
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = this.html.classList.contains('highlight');
    }
}

// TEXT
function loadTexts() {

    // Iterate through every text item
    const texts = document.getElementsByClassName('input text');
    for (item of texts) {

        // Get variables
        let input = item.querySelector('input');
        let chipContainer = item.querySelector('chip-content');

        // Get chip info
        let isAllowedChips = item.classList.contains('with-chips');
        let chips = []
        if (isAllowedChips && chipContainer) { 
            for (chip of chipContainer.children) { 
                chips.push(new Ph_Chip({
                    content: chip.innerText,
                    buttonContent: 'clear',
                    html: chip
                }));
            }
        }
        let maxChips = -1
        let delimiter = ',';
        if (item.dataset.maxchips > 0) { maxChips = item.dataset.maxchips; }
        if (item.dataset.delimiter) { delimiter = item.dataset.delimiter; }

        // Get any buttons
        let buttons = [];
        for (button of item.querySelectorAll('button')) {
            buttons.push(new Ph_TextButton({
                icon: button.querySelector('span').innerText,
                event: button.onclick,
                isDisabled: button.classList.contains('disabled') || button.disabled,
                html: button
            }));
        }

        // Initialise item
        let text = new Ph_Text({
            value: input.value,
            placeholder: input.placeholder,
            type: input.type,
            parent: item.parentNode,
            minLength: input.minLength,
            maxLength: input.maxLength,
            chips: chips,
            maxChips: maxChips,
            delimiter: delimiter,
            buttons: buttons,
            isAllowedChips: isAllowedChips,
            isAllowedAutocomplete: input.hasAttribute('autocomplete'),
            isHighlighted: item.classList.contains('highlight'),
            isDisabled: item.classList.contains('disabled') || input.disabled,
            html: item
        });
        text.initialise();
    }

    // Iterate through every textarea item
    const textareas = document.getElementsByClassName('input textarea');
    for (item of textareas) {
        let input = item.querySelector('textarea');

        // Initialise
        let textArea = new Ph_TextArea({
            value: input.value,
            placeholder: input.placeholder,
            parent: item.parentNode,
            minLength: input.minLength,
            maxLength: input.maxLength,
            isAllowedAutocomplete: input.hasAttribute('autocomplete'),
            isHighlighted: item.classList.contains('highlight'),
            isDisabled: item.classList.contains('disabled') || input.disabled,
            html: item
        });
        textArea.initialise();
    }

}
function getChip(id) {
    for (item of Ph_ChipList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
function getText(id) {
    for (item of Ph_TextList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
function getTextArea(id) {
    for (item of Ph_TextAreaList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}

class Ph_Chip {
    constructor({
        id = 0,
        parentID = 0,
        content = '',
        buttonContent = 'close',
        html
    } = {}) {
        // Check for errors
        if (!content) { console.error('Unable to construct object Chip: no content provided.'); return; }
        if (!getText(parentID)) { console.error('UNable to construct object Chip: invalid parent ID provided.'); return; }

        // Assign variables
        this.id = id;
        this.parentID = parentID;
        this.content = content;
        this.buttonContent = buttonContent;
        this.html = html;
    }

    initialise() { 

        // Add onclick
        let chipObject = this;
        this.html.onclick = function() {
            chipObject.remove();
        };
        
        // Add ID
        this.id = Ph_ChipList.length;
        this.html.classList.add('ph-chip-' + Ph_ChipList.length);
        Ph_ChipList.push(this);
    }

    // Chips are instantiated without parent objects, meaning the html element is returned to the caller to implement manually
    instantiate() {

        // Create objects
        let chip = document.createElement('div');
        chip.classList.add('chip');
        chip.innerText = this.content;

        if (this.buttonContent) { 
            chip.classList.add('with-button'); 

            let span = document.createElement('span');
            span.classList.add('material-icons-round');
            span.innerText = this.buttonContent;
            chip.appendChild(span);
        }

        this.html = chip;
        this.initialise();
        return(chip);
    }

    remove() {
        let parent = getText(this.parentID);
        parent.chips.splice(parent.chips.indexOf(this), 1);
        Ph_ChipList.splice(Ph_ChipList.indexOf(this), 1);
        this.html.parentNode.removeChild(this.html);
    }
}
class Ph_TextButton { 
    constructor({
        icon = '',
        event,
        isLink = false,
        isDisabled = false,
        html
    } = {}) {
        // Find errors
        if (!icon) { console.error('Unable to create object TextButton: no icon provided'); return; }

        // Assign variables
        this.icon = icon;
        this.event = event;
        this.isLink = isLink;
        this.isDisabled = isDisabled;
        this.html = html;
    }

    // A TextButton instantiates differently in that it doesn't tether to a parent - instead, it will return the html object to be tethered by the Text object later.
    instantiate() {

        // Create objects
        let buttonType = 'button';
        if (this.isLink) { buttonType = 'a'; }
        
        let button = document.createElement(buttonType);
        button.classList.add('button', 'icon');
        let icon = document.createElement('span');
        icon.classList.add('material-icons-round');
        icon.innerText = this.icon;
        button.appendChild(icon);

        // Set attrributes
        if (this.isDisabled) { 
            button.classList.add('disabled'); 
            button.disabled = true;
        }
        if (this.event) {
            if (this.isLink) { button.href = this.event; }
            else { button.onclick = this.event; }
        }

        // Return object
        this.html = button;
        return(button);
    }
}
class Ph_Text {
    constructor({
        id = 0,
        value,
        placeholder = '',
        type = 'text',
        parent,
        minLength = -1,
        maxLength = -1,
        chips = [],
        maxChips = -1,
        delimiter = ',',
        buttons = [],
        isAllowedChips = false,
        isAllowedAutocomplete = false,
        isHighlighted = false,
        isDisabled = false,
        html
    } = {}) {
        // Check for errors
        if (!parent) { console.error('Unable to construct object Text: no parent provided.'); return; }
        for (item of chips) { 
            if (!item instanceof Ph_Chip) { 
                chips.splice(chips.indexOf(item), 1);
                console.warn('Removed chip: ' + item + ': not a valid type.');
            }
        }
        for (item of buttons) { 
            if (!item instanceof Ph_TextButton && !item.icon) { 
                buttons.splice(buttons.indexOf(item), 1);
                console.warn('Removed button: ' + item + ': not a valid type.');
            }
        }

        // Assign variables
        this.id = id;
        this.value = value;
        this.placeholder = placeholder;
        this.type = type;
        this.parent = parent;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.chips = chips;
        this.maxChips = maxChips;
        this.delimiter = delimiter;
        this.buttons = buttons;
        this.isAllowedChips = isAllowedChips;
        this.isAllowedAutocomplete = isAllowedAutocomplete;
        this.isHighlighted = isHighlighted;
        this.isDisabled = isDisabled;
        this.html = html;
    }

    initialise() {
        // Get variables
        let container = this.html;
        let input = this.html.querySelector('input');

        // Password
        if (this.type == 'password') {
            let passButton = new Ph_TextButton({ icon: 'visibility' });
            let button = passButton.instantiate();
            let textObject = this;
            button.onmousedown = function() { textObject.showText(); }
            button.onmouseup = function() { textObject.hideText(); }
            container.appendChild(button);
        }

        // Chips 
        if (this.isAllowedChips) { 
            // Set attributes
            if (this.maxChips > 0) { container.dataset.maxChips = this.maxChips; }
            container.dataset.delimiter = this.delimiter;

            // Oninput event
            let textObject = this;
            input.oninput = function() {
                let input = textObject.html.querySelector('input');
                let chipContainer = textObject.html.querySelector('.chip-content');

                // Check input content
                let contentList = input.value.split(textObject.delimiter);
                if (contentList.length > 1) {
                    for (item of contentList) { 
                        if (textObject.maxChips > 0 && textObject.chips.length >= textObject.maxChips) { continue; }

                        // Check & clean up value
                        item.trim();
                        if (item == '') { continue; }

                        // Create chip
                        let chip = new Ph_Chip({
                            parentID: textObject.id,
                            content: item,
                            buttonContent: 'clear'
                        });

                        // Add to element & object
                        chipContainer.appendChild(chip.instantiate());
                        textObject.chips.push(chip);

                        // Remove from input content
                        contentList.splice(contentList.indexOf(item), 1);
                    }

                    // Reconstruct input content
                    input.value = '';
                    // input.value = contentList.join(',');
                }
            }

            // Create chip container
            if (!this.html.querySelector('.chip-content')) {
                let chipContainer = document.createElement('div');
                chipContainer.classList.add('chip-content');
                container.appendChild(chipContainer);

                // Add chips
                if (this.chips) { for (item of this.chips) { 
                    let chip = item.instantiate();
                    chipContainer.appendChild(chip);
                }}
            }
        }

        // Clear
        for (item of this.buttons) { 
            if (item.icon == 'clear') { 
                let clear = this.clear;
                let html = this.html;
                let isAllowedChips = this.isAllowedChips;
                let object = this;
                item.html.onclick = function() { 
                    clear(object, html, isAllowedChips);
                }
            }
        }

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }

        // Add to list
        this.id = Ph_TextList.length;
        this.html.classList.add('ph-text-' + Ph_TextList.length);
        Ph_TextList.push(this);
    }

    instantiate() {

        // Create objects
        let container = document.createElement('div');
        container.classList.add('input', 'text'); 
        let input = document.createElement('input');
        input.type = this.type;
        container.appendChild(input);

        // Assign values
        if (this.value) { input.value = this.value; }
        if (this.placeholder) { input.placeholder = this.placeholder; }
        if (this.minLength > 0) { input.minLength = this.minLength; }
        if (this.maxLength > 0) { input.maxLength = this.maxLength; }
        if (this.isAllowedAutocomplete) { input.autocomplete = true; }
        if (this.isHighlighted) { container.classList.add('highlight'); }
        
        
        // Buttons
        for (item of this.buttons) {
            let button = item.instantiate();
            container.appendChild(button);
        }

        this.parent.appendChild(container);

        // Initialise & return
        this.html = container;
        this.initialise();
        return(container);
    }

    showText() { 
        if (this.isDisabled) { return; }

        let input = this.html.querySelector('input');
        input.type = 'text'; 
    }
    hideText() { 
        if (this.isDisabled) { return; }

        let input = this.html.querySelector('input');
        input.type = 'password'; 
    }

    clear(object, html, isAllowedChips) {
        if (object.isDisabled) { return; }

        let input = html.querySelector('input');
        input.value = '';

        if (isAllowedChips) { 
            let chips = [...object.chips];
            let i = 0;
            for (item of chips) {
                item.remove();
                i++;
            }
        }
    }

    disable(disableObject = true) {
        let input = this.html.querySelector('input');
        if (disableObject) { this.html.classList.add('disabled'); input.disabled = true; } 
        else { this.html.classList.remove('disabled'); input.disabled = false; }

        this.isDisabled = disableObject;
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = highlightObject;
    }
}
class Ph_TextArea {
    constructor({
        id = 0,
        value = '',
        placeholder = '',
        parent,
        minLength = -1,
        maxLength = -1,
        isAllowedAutocomplete = false,
        isHighlighted = false,
        isDisabled = false,
        html
    } = {}) {
        // Check for errors
        if (!parent || !parent instanceof Object) { console.error('Unable to construct object TextArea: either no or an invalid parent provided.'); return; }

        // Assign variables
        this.id = id;
        this.value = value;
        this.placeholder = placeholder;
        this.parent = parent;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.isAllowedAutocomplete = isAllowedAutocomplete;
        this.isHighlighted = isHighlighted;
        this.isDisabled = isDisabled;
        this.html = html;
    }

    initialise() {
        // Add ID
        this.id = Ph_TextAreaList.length;
        this.html.classList.add('ph-textarea-' + Ph_TextAreaList.length);
        Ph_TextAreaList.push(this);

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }
    }

    instantiate() { 
        // Create objects
        let currentContainers = document.getElementsByClassName('input textarea').length;
        let container = document.createElement('div');
        container.classList.add('input', 'textarea', 'ph-textarea-' + currentContainers - 1); 
        let textarea = document.createElement('textarea');
        container.appendChild(textarea);
        this.parent.appendChild(container);

        // Assign values
        if (this.value) { textarea.value = this.value; }
        if (this.placeholder) { textarea.placeholder = this.placeholder; }
        if (this.minLength > 0) { textarea.minLength = this.minLength; }
        if (this.maxLength > 0) { textarea.maxLength = this.maxLength; }
        if (this.isAllowedAutocomplete) { textarea.autocomplete = true; }
        if (this.isHighlighted) { container.classList.add('highlight'); }

        // Initialise & return
        this.html = container;
        this.initialise();
        return(container);
    }

    disable(disableObject = true) {
        let input = this.html.querySelector('textarea');
        if (disableObject) { this.html.classList.add('disabled'); input.disabled = true; } 
        else { this.html.classList.remove('disabled'); input.disabled = false; }

        this.isDisabled = disableObject;
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = highlightObject;
    }
}

// SLIDER (RANGE)
function loadRanges() {

    // Iterate through every range item
    const ranges = document.getElementsByClassName('input range');
    let i = 0;
    for (item of ranges) {
        // Create & initialise object
        let range = new Ph_Range({
            value: item.value,
            minValue: item.min,
            maxValue: item.max,
            step: item.step,
            isHighlighted: item.classList.contains('higlight'),
            isDisabled: item.classList.contains('disabled') || item.disabled,
            parent: item.parentNode,
            html: item
        });
        range.initialise();
    }
}
function getRange(id) {
    for (item of Ph_RangeList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_Range {
    constructor({
        id = 0,
        value = 0,
        minValue,
        maxValue,
        step = 1,
        isHighlighted = false,
        isDisabled = false,
        parent,
        html
    } = {}) {
        // Check for errors
        if (maxValue < minValue) { console.warn('Object Range: max value (' + maxValue + ') is not larger than min value (' + minValue + '). Is this correct?'); }
        if (!parent) { console.error('Unable to construct object Range: no parent object provided.'); return;}

        // Assign variables
        this.id = id;
        this.value = value;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.step = step;
        this.isHighlighted = isHighlighted;
        this.isDisabled = isDisabled;
        this.parent = parent;
        this.html = html;
    }

    initialise() {
        // Check for errors
        if (!this.html) { console.error('Unable to initialise object Range: no html content provided.'); return; }

        // Update states
        if (this.isHighlighted) { this.html.classList.add('highlight'); }
        if (this.isDisabled) { this.html.disabled = true; }

        // Assign id & add to list
        this.id = Ph_RangeList.length;
        this.html.classList.add('ph-range-' + Ph_RangeList.length);
        Ph_RangeList.push(this);

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }
    }

    instantiate() {
        // Create object
        let input = document.createElement('input');
        input.type = 'range';
        input.classList.add('input', 'range')

        // Assign values
        input.value = this.value;
        if (this.minValue) { input.min = this.minValue; }
        if (this.maxValue) { input.max = this.maxValue; }
        if (this.step) { input.step = this.step; }
        this.html = input;

        // Initialise & return
        this.initialise();
        this.parent.appendChild(input);
        return(input);
    }

    disable(disableObject = true) {
        this.html.disabled = disableObject;

        if (disableObject) { this.html.classList.add('disabled'); } 
        else { this.html.classList.remove('disabled'); }

        this.isDisabled = this.html.classList.contains('disabled');
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = this.html.classList.contains('highlight');
    }
}

// CHECK
function loadChecks() {
    const checks = document.getElementsByClassName('checkbox');
    for (item of checks) {
        // Construct object
        let check = new Ph_Check({
            label: item.querySelector('label').innerHTML,
            isChecked: item.classList.contains('checked'),
            isRadio: item.classList.contains('radio'),
            isDisabled: item.classList.contains('disabled'),
            isHighlighted: item.classList.contains('highlight'),
            parent: item.parentNode,
            html: item
        });
        check.initialise();
    }
}
function getCheck(id) {
    for (item of Ph_CheckList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_Check {
    constructor({
        id = 0,
        parentID = -1,
        label = '',
        isChecked = false,
        isRadio = false,
        isDisabled = false, 
        isHighlighted = false,
        parent,
        html
    } = {}) {
        // Assign variables
        this.id = id;
        this.parentID = parentID;
        this.label = label;
        this.isChecked = isChecked;
        this.isRadio = isRadio;
        this.isDisabled = isDisabled;
        this.isHighlighted = isHighlighted;
        this.parent = parent;
        this.html = html;
    }

    initialise() {
        // Check for html
        if (!this.html) { console.error('Unable to initialise object Check: no html content provided.'); return; }

        // Add onclick function
        let checkObject = this;
        this.html.onclick = function() { 
            checkObject.toggle();
        }

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }

        // Assign ID & add to list
        this.id = Ph_CheckList.length;
        this.html.classList.add('ph-check-' + Ph_CheckList.length);
        Ph_CheckList.push(this);
    }

    instantiate() {
        // Create objects
        let checkbox = document.createElement('label');
        checkbox.classList.add('checkbox');
        if (this.isRadio) { checkbox.classList.add('radio'); }
        if (this.isChecked) { checkbox.classList.add('checked'); }

        let check = document.createElement('div');
        check.classList.add('check');
        check.appendChild(document.createElement('div'));
        checkbox.appendChild(check);

        let label = document.createElement('label');
        label.innerHTML = this.label;
        checkbox.appendChild(label);

        // Add to parent
        this.parent.appendChild(checkbox);

        // Initialise and return
        this.html = checkbox;
        this.initialise();
        return(checkbox);
    }

    toggle() {
        if (!this.isDisabled) {
            let currentState = this.html.classList.contains('checked');
            if (this.isRadio && this.parentID && !currentState) {        // Is a valid radio button
                // Get parent object
                let parent = getCheckContainer(this.parentID);
                for (item of parent.selectedChecks) {
                    item.toggle();
                }
            }

            this.html.classList.toggle('checked');
            this.checked = this.html.classList.contains('checked');

            // Change parent values if necessary
            if (this.parentID > -1) { 
                let parent = getCheckContainer(this.parentID);
                if (this.checked) { parent.selectedChecks.push(this); }
                else { parent.selectedChecks.splice(parent.selectedChecks.indexOf(this), 1); }
            }
        }
    }

    disable(disableObject = true) {
        if (disableObject) { this.html.classList.add('disabled'); } 
        else { this.html.classList.remove('disabled'); }

        this.isDisabled = this.html.classList.contains('disabled');
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = this.html.classList.contains('highlight');
    }
}

// CHECK CONTAINER
function loadCheckContainers() {
    const containers = document.getElementsByClassName('check-container');
    for (item of containers) {
        // Get contained checks & assemble objects
        let checks = item.querySelectorAll('.checkbox');
        let checkObjects = [];
        for (item of checks) { 
            checkObjects.push(new Ph_Check({
                label: item.querySelector('label').innerHTML,
                isRadio: item.classList.contains('radio')
            }));
        }

        // Construct & initialise object
        let container = new Ph_CheckContainer({
            checks: checkObjects,
            isHighlighted: item.classList.contains('highlight'),
            isDisabled: item.classList.contains('disabled'),
            parent: item.parentNode,
            html: item
        });
        container.initialise();
    }
}
function getCheckContainer(id) {
    for (item of Ph_CheckContainerList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_CheckContainer {
    constructor({
        id = 0,
        selectedChecks = [],
        checks = [],
        isDisabled = false,
        isHighlighted = false,
        parent,
        html
    } = {}) {
        // Check for errors
        if (!parent) { console.error('Unable to construct object CheckContainer: no parent provided.'); return; }
        for (item of checks) { if (!item instanceof Ph_Check) { 
            console.warn('Removing Check from CheckContainer: invalid type.'); 
            checks.splice(checks.indexOf(item), 1)
        }}

        // Assign variables
        this.id = id;
        this.selectedChecks = selectedChecks;
        this.checks = checks;
        this.isDisabled = isDisabled;
        this.isHighlighted = isHighlighted;
        this.parent = parent;
        this.html = html;
    }

    initialise() {
        // Check for html content
        if (!this.html) { console.error('Unable to initialise object CheckContainer: no html content provided.'); return; }

        // Assign ID & add to list
        this.id = Ph_CheckContainerList.length;
        this.html.classList.add('ph-check-container-' + Ph_CheckContainerList.length);
        Ph_CheckContainerList.push(this);

        // Search for children
        let containerObject = this;
        let children = this.html.querySelectorAll('.checkbox');
        for (item of children) {
            // Get item ID from html
            let itemID = 0;
            for (let i of item.classList) {
                if (i.includes('ph-check-')) { itemID = i.split('-')[2]; }
            }

            // Get object
            let check = getCheck(itemID);

            // Update parent ID
            check.parentID = containerObject.id;

            // Add to checks list
            containerObject.checks.push(check);
            if (item.isChecked) { containerObject.selectedChecks.push(check); }
        }

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }

        // Set parent for checks
        for (item of this.checks) { 
            item.parent = this.html;
            item.parentID = this.id;
        }
    }

    instantiate() {
        // Create objects
        let container = document.createElement('div');
        container.classList.add('input', 'check-container');

        // Append to parent
        this.parent.appendChild(container)

        // Initialise
        this.html = container;
        this.initialise();

        // Initialise children
        for (item of this.checks) { 
            item.parent = this.html;
            item.instantiate();
        }

        // Return
        return(container);
    }

    disable(disableObject = true) {
        // Disable main object
        if (disableObject) { 
            this.html.classList.add('disabled'); } 
        else { this.html.classList.remove('disabled'); }

        this.isDisabled = this.html.classList.contains('disabled');

        // Disable children
        for (item of this.checks) { item.disable(disableObject); }
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = this.html.classList.contains('highlight');
    }
}

// FILE UPLOADS
function loadFileUploads() {
    // Get Objects
    const fileUploads = document.getElementsByClassName('file-upload');
    for (item of fileUploads) {
        let input = item.querySelector('input')

        // Create & initialise object
        let fileUpload = new Ph_FileUpload({
            value: item.querySelector('label').innerText,
            acceptsTypes: item.querySelector('input').accept.split(', '),
            isDisabled: item.classList.contains('disabled') || input.disabled,
            isHighlighted: item.classList.contains('higlight'),
            parent: item.parentNode, 
            html: item
        });
        fileUpload.initialise();
    }
}
function getFileUpload(id) {
    for (item of Ph_FileUploadList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_FileUpload {
    constructor({
        id = 0,
        files,
        acceptsTypes = [],
        icon = 'image',
        label = 'Upload a File...',
        hoverLabel = 'Drop Files Here...',
        isDisabled = false,
        isHighlighted = false,
        parent,
        html
    } = {}) {
        // Check for errors
        if (!parent) { console.error('Unable to construct object FileUpload: no parent provided.'); return; }

        // Assign variables
        this.id = id;
        this.files = files;
        this.acceptsTypes = acceptsTypes;
        this.icon = icon;
        this.label = label;
        this.hoverLabel = hoverLabel;
        this.isDisabled = isDisabled,
        this.isHighlighted = isHighlighted,
        this.parent = parent;
        this.html = html;
    }

    initialise() {
        // Check for html content
        if (!this.html) { console.error('Unable to initialise object CheckContainer: no html content provided.'); return; }

        // Update states 
        if (this.isSelected) { this.html.classList.add('highlight'); }
        if (this.isDisabled) { 
            this.html.classList.add('disabled'); 
            this.html.querySelector('input').disabled = true;
        }

        // Add event handlers
        let uploadObject = this;        

        // this.html.ondrop = function() { console.log('eee'); }
        this.html.ondrop = function(event) { uploadObject.dropHandler(event); }
        this.html.ondragover = function(event) { uploadObject.dragOverHandler(event); }
        this.html.ondragleave = function(event) { uploadObject.dragLeaveHandler(event); }

        // Assign ID & add to list
        this.id = Ph_FileUploadList.length;
        this.html.classList.add('ph-file-upload-' + this.id);
        Ph_FileUploadList.push(this);
    }

    instantiate() {
        // Create objects
        let container = document.createElement('label');
        container.classList.add('input', 'file-upload');

        let input = document.createElement('input');
        input.type = 'file';
        input.setAttribute('accept', this.acceptsTypes.join(', '));
        container.appendChild(input);

        let image = document.createElement('span');
        image.classList.add('material-icons-round');
        image.innerText = this.icon;
        container.appendChild(image);

        let label = document.createElement('label');
        label.innerText = this.label;
        container.appendChild(label);

        // Initialise & return
        this.html = container;
        this.initialise();
        return(container);
    }

    dragOverHandler(ev) {
        ev.preventDefault();

        if (!this.isDisabled) {
            this.html.classList.add('hover');
            this.html.querySelector('label').innerText = this.hoverLabel;
        }
    }

    dragLeaveHandler(ev) {
        ev.preventDefault();

        if (!this.isDisabled) {
            this.html.classList.remove('hover');
            this.html.querySelector('label').innerText = this.label;
        }
    }

    dropHandler(ev) { 
        ev.preventDefault();
        if (!this.isDisabled) {
            this.dragLeaveHandler(ev);

            // Access file information
            if (ev.dataTransfer.items) {

                let input = this.html.querySelector('input');
        
                // EVENTUALLY - update to only accept certain files

                // Hand off to Input
                input.files = ev.dataTransfer.files;
                this.files = input.files;

                // Update Children
                let label = this.html.querySelector('label');
                if (ev.dataTransfer.items.length > 1) { label.innerText = ev.dataTransfer.items.length + ' items'; }
                else { 
                    var file = ev.dataTransfer.items[0].getAsFile();
                    label.innerText = file.name;
                }
            }
        }
    }

    disable(disableObject = true) {
        if (disableObject) { 
            this.html.classList.add('disabled'); 
            this.html.querySelector('input').disabled = true;
        } else {
            this.html.classList.remove('disabled'); 
            this.html.querySelector('input').disabled = false;
        }

        this.isDisabled = this.html.querySelector('input').disabled;
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = this.html.classList.contains('highlight');
    }
}

// STEPPER 
function loadSteppers() {
    // Get Objects
    const steppers = document.getElementsByClassName('stepper');
    for (item of steppers) { 
        // Assemble & init object
        let input = item.querySelector('input');
        let stepperObject = new Ph_Stepper({
            value: input.value,
            step: input.step,
            placeholder: input.placeholder,
            minValue: input.min,
            maxValue: input.max,
            isHighlighted: item.classList.contains('highlight'),
            isDisabled: item.classList.contains('disabled') || input.disabled,
            parent: item.parentNode,
            html: item
        });
        stepperObject.initialise();
    }
}
function getStepper(id) {
    for (item of Ph_StepperList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_Stepper {
    constructor({
        id = 0,
        value = 0,
        step = 1,
        buttons = [],
        minValue,
        maxValue,
        isHighlighted = false,
        isDisabled = false,
        parent,
        html
    } = {}) {
        minValue = parseInt(minValue);
        maxValue = parseInt(maxValue);

        // Check for errors
        if (!parent) { console.error('Unable to construct object Stepper: no parent provided.'); return; }
        if (minValue && maxValue && maxValue <= minValue) {console.error('Unable to construct object Stepper: maxValue (' + maxValue + ') is smaller than minValue (' + minValue + ').'); return; }
        for (item of buttons) { 
            if (!typeof(item) == 'object') { 
                buttons.splice(buttons.indexOf(item), 1);
                console.warn('Removed button: ' + item + ': not a valid type.');
            }
        }

        // Assign variables
        this.id = id;
        this.value = value;
        this.step = Math.abs(step) || 1;
        this.buttons = buttons;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.isHighlighted = isHighlighted;
        this.isDisabled = isDisabled;
        this.parent = parent;
        this.html = html;
    }

    initialise() { 
        // Check for errors
        if (!this.html) { console.error('Unable to initialise object Stepper: no html content provided.'); return; }

        // Assign ID
        this.id = Ph_StepperList.length;
        this.html.classList.add('ph-stepper-' + this.id);
        Ph_StepperList.push(this);

        // Check buttons exist & assign onclick
        let decButton = this.html.querySelector('.stepper-decrease');
        let incButton = this.html.querySelector('.stepper-increase');
        let stepperObject = this;
        if (!decButton) { 
            let decButtonObject = new Ph_Button({
                icon: 'keyboard_arrow_down',
                parent: stepperObject.html
            });
            decButton = decButtonObject.instantiate();
            decButton.classList.add('stepper-decrease');
        }
        if (!incButton) { 
            let incButtonObject = new Ph_Button({
                icon: 'keyboard_arrow_up',
                parent: stepperObject.html
            });
            incButton = incButtonObject.instantiate();
            incButton.classList.add('stepper-increase'); 
        }

        // Assign onclick to buttons
        decButton.onclick = function() { stepperObject.decrease(); }
        this.buttons.push(decButton);
        incButton.onclick = function() { stepperObject.increase(); }
        this.buttons.push(incButton);

        // Unify states
        if (this.isDisabled) { this.disable(); }
        if (this.isHighlighted) { this.highlight(); }

        // Assign onchange to input
        this.html.querySelector('input').onchange = function() { stepperObject.syncInput(false); }

        // Run first update on button states
        this.syncInput(true);
    }

    instantiate() { 
        // Create objects
        let stepper = document.createElement('div');
        stepper.classList.add('input', 'stepper');
        if (this.isHighlighted) { stepper.classList.add('highlight'); }

        let input = document.createElement('input');
        input.type = 'number';
        if (this.minValue > -1) { input.min = this.minValue; }
        if (this.maxValue > -1) { input.max = this.maxValue; }
        input.step = this.step;

        // Initialise & return
        this.parent.appendChild(stepper);
        this.html = stepper;
        this.initialise();
        return(this.html);
    }

    decrease() {
        this.value -= this.step;
        this.syncInput();
    }

    increase() {
        this.value -= 0;
        this.value += this.step;
        this.syncInput();
    }

    syncInput(overrideInput = true) {
        // Override values
        if (!overrideInput) { this.value = this.html.querySelector('input').value; }
        this.value = this.value * 1;

        // Check for illegal values
        if (this.maxValue && this.value > this.maxValue) { this.value = this.maxValue; }
        if (this.minValue && this.value < this.minValue) { this.value = this.minValue; }

        // Check for multiple of step
        if (this.value > 0) { this.value = Math.ceil(this.value / this.step) * this.step; }
        else { this.value = Math.floor(this.value / this.step) * this.step; }

        // Update input value
        this.html.querySelector('input').value = this.value;

        // Update stepper buttons
        let decButton = this.html.querySelector('.stepper-decrease');
        let incButton = this.html.querySelector('.stepper-increase');
        if (decButton && this.minValue) { 
            if (this.value - this.step < this.minValue) { decButton.disabled = true;} 
            else { decButton.disabled = false; }
        }
        if (incButton && this.maxValue) { 
            if (this.value + this.step > this.maxValue) { incButton.disabled = true; }
            else { incButton.disabled = false; }
        }
    }

    disable(disableObject = true) {
        let input = this.html.querySelector('input');
        input.disabled = disableObject;

        if (disableObject) { this.html.classList.add('disabled'); } 
        else { this.html.classList.remove('disabled'); }

        this.isDisabled = this.html.classList.contains('disabled');
    }

    highlight(highlightObject = true) {
        if (highlightObject) { this.html.classList.add('highlight'); } 
        else { this.html.classList.remove('highlight'); }

        this.isHighlighted = this.html.classList.contains('highlight');
    }
}

// BUTTON
class Ph_Button {

    constructor({
        value = '', 
        icon = '',
        event, 
        parent,
        color = 'primary', 
        type = 'regular', 
        isLink = false,
        isIconLeading = true,
        isDisabled = false,
    } = {}) {
        this.buttonColors = ['primary', 'secondary', 'tertiary'];
        this.buttonTypes = ['regular', 'outlined', 'contained'];

        // Error
        if (!parent) { console.error('Unable to construct object Button: no parent provided.'); return; }
        if (!this.buttonColors.includes(color)) { console.error('Unable to construct object Button: invalid color provided.'); return;}
        if (!this.buttonTypes.includes(type)) { console.error('Unable to construct object Button: invalid type provided.'); return;}

        // Set variables
        this.value = value;
        this.icon = icon;
        this.event = event;
        this.parent = parent;
        this.color = color;
        this.type = type;
        this.isLink = isLink;
        this.isIconLeading = isIconLeading;
        this.isDisabled = isDisabled;
    }

    instantiate() {

        // Create objects
        let buttonElement = 'button';
        if (this.isLink) { buttonElement = 'a'; }
        let button = document.createElement(buttonElement);

        // Handle classes
        button.classList.add('button', this.color, this.type);
        if (this.isDisabled) { 
            button.classList.add('disabled'); 
            button.disabled = true;
        }

        // Handle event
        if (this.event) { 
            if (this.isLink) { button.href = this.event; }
            else { 
                if (this.event[this.event.length -1] != ')') { 
                    button.setAttribute('onclick', 'javascript: ' + this.event + '();'); 
                }
                else {
                    button.setAttribute('onclick', 'javascript: ' + this.event + '');
                }
            }
        }

        // Handle icon & value
        if (this.value) { button.innerHTML = this.value; }
        if (this.icon) { 
            if (!this.value) { button.classList.add('icon'); }
            else { button.classList.add('with-icon'); }

            let icon = document.createElement('span');
            icon.classList.add('material-icons-round');
            icon.innerHTML = this.icon;

            if (this.isIconLeading) { button.insertBefore(icon, button.childNodes[0]); }
            else { button.appendChild(icon); }
        }       

        // Append to parent
        this.parent.appendChild(button);
        return(button);
    }

    disable(disableObject) { 
        if (disableObject) { this.html.classList.add('disabled'); }
        else { this.html.classList.remove('disabled'); }
        this.isDisabled = disableObject;
    }
}

// LISTBUTTON
class Ph_ListButton {
    constructor({
        title = '', 
        subtitle = '',
        foreIcon = '',
        aftIcon = 'keyboard_arrow_right',
        event, 
        parent,
        color = 'primary', 
        type = 'regular',
        isDisabled = false,
    } = {}) {
        this.buttonColors = ['primary', 'secondary', 'tertiary'];
        this.buttonTypes = ['regular', 'outlined', 'contained'];

        // Error
        if (!parent) { console.error('Unable to construct object ListButton: no parent provided.'); return; }
        if (!title) { console.error('Unable to construct object ListButton: no title provided.'); return;}
        if (!this.buttonColors.includes(color)) { console.error('Unable to construct object ListButton: invalid color provided.'); return;}
        if (!this.buttonTypes.includes(type)) { console.error('Unable to construct object ListButton: invalid type provided.'); return;}

        // Set variables
        this.title = title;
        this.subtitle = subtitle;
        this.foreIcon = foreIcon;
        this.aftIcon = aftIcon;
        this.event = event;
        this.parent = parent;
        this.color = color;
        this.type = type;
        this.isDisabled = isDisabled;
    }

    instantiate() {
        // Create objects
        let button = document.createElement('button');
        button.classList.add('button', 'list', this.color, this.type);

        if (this.foreIcon) { 
            let foreIcon = document.createElement('span');
            foreIcon.classList.add('material-icons-round');
            foreIcon.innerHTML = this.foreIcon;
            button.appendChild(foreIcon);
        }

        let content = document.createElement('div');
        content.classList.add('content-vertical');
        button.appendChild(content);
        
        let title = document.createElement('h4');
        title.innerHTML = this.title;
        content.appendChild(title);

        if (this.subtitle) { 
            let subtitle = document.createElement('p');
            subtitle.innerHTML = this.subtitle;
            content.appendChild(subtitle);
        }

        if (this.aftIcon) { 
            let aftIcon = document.createElement('span');
            aftIcon.classList.add('material-icons-round');
            aftIcon.innerHTML = this.aftIcon;
            button.appendChild(aftIcon);
        }

        // Handle event
        let buttonObject = this;
        button.onclick = buttonObject.event;

        // Return
        this.parent.appendChild(button);
        return(button);
    }

    disable(disableObject) { 
        if (disableObject) { this.html.classList.add('disabled'); }
        else { this.html.classList.remove('disabled'); }
        this.isDisabled = disableObject;
    }
}



// SECTION ---------------------------------------------------------------------
function loadSections() {

    // Iterate through every section
    const sections = document.getElementsByClassName('section');
    for (item of sections) {
        // Construct object
        let object = new Ph_Section({
            header: item.querySelector('header').querySelector('h2').innerText,
            content: item.querySelector('.section-content'),
            parent: item.parentNode,
            isOpen: item.classList.contains('section-open'),
            html: item
        });

        // Initialise item
        object.initialise();
    }
}
function getSection(id) {
    for (item of Ph_SectionList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_Section {
    constructor({
        id = 0,
        header = '', 
        content, 
        parent, 
        isOpen = false, 
        html
    } = {}) {

        // Check header
        if (!header) { console.error('Unable to construct object Section: no header provided.'); return; }
        if (typeof(header) != 'string') { console.error('Unable to construct object Section: invalid header content provided.'); return; }
        if (!parent) { console.error('Unable to construct object Section: no parent provided.'); return; }

        // Assign variables
        this.id = id;
        this.header = header;
        this.content = content;
        this.parent = parent;
        this.isOpen = isOpen;
        this.html = html;

        this.isInstantiated = false;
        if (this.html) { this.isInstantiated = true; }
    }

    initialise() {
        // Check for html content
        if (!this.html) { console.error('Unable to initialise object Section: no html content provided.'); return; }

        // Setup onclick event
        let button = this.html.querySelector('.section-button');
        if (!button) { console.error('Failed to initialise object Section: no button provided.'); return; }
        let section = this.html;
        button.onclick = function() { 
            section.classList.toggle('section-open');
            let icon = section.querySelector('.section-button').children[0];
            if (section.classList.contains('section-open')) { icon.innerHTML = downArrow; }
            else { icon.innerHTML = rightArrow; }
        };

        // Check if open
        if (this.html.classList.contains('section-open')) { button.children[0].innerHTML = downArrow; }
        else { button.children[0].innerHTML = rightArrow; }

        // Assign ID & add to list
        this.id = Ph_SectionList.length;
        this.html.classList.add('ph-section-' + Ph_SectionList.length);
        Ph_SectionList.push(this);
    }

    instantiate() {

        // Check if is instantiated
        if (this.isInstantiated) { console.error('Unable to instantiate object Section: already instantiated.'); return; }

        // Create objects
        let existingSections = document.getElementsByClassName('section');
        let section = document.createElement('section');
        section.classList.add('section', 'ph-section-' + existingSections.length);
        
        let iconValue = rightArrow;
        if (this.isOpen) { section.classList.add('section-open'); iconValue = downArrow; }

        let header = document.createElement('header');
        let headerButton = new Ph_Button({
            icon: iconValue,
            parent: header
        });
        headerButton.instantiate().classList.add('section-button');
        let h2 = document.createElement('h2');
        h2.innerText = this.header;
        header.appendChild(h2);
        let sep = document.createElement('div');
        sep.classList.add('sep', 'horizontal');
        header.appendChild(sep);

        let content = document.createElement('div');
        content.classList.add('section-content');
        if (this.content) { content.innerHTML = this.content; }

        section.appendChild(header);
        section.appendChild(content);
        this.parent.appendChild(section);

        this.html = section;
        this.isInstantiated = true;
        this.initialise();
        return(section);
    }
}



// CONTAINER -------------------------------------------------------------------
function loadContainers() {

    // Iterate through every container
    const containers = document.getElementsByClassName('container');
    let i = 0;
    for (item of containers) {
        let object = new Ph_Container({
            header: item.querySelector('header'),
            content: item.querySelector('.container-content'), 
            parent: item.parentNode,
            isOpen: item.classList.contains('container-open')
        });

        // Get object & assign onclick
        object.initialise();

        i++;
    }
}
function getContainer(id) {
    for (item of Ph_ContainerList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_Container {
    constructor({
        id = 0,
        header, 
        content, 
        parent, 
        isOpen = false
    } = {}) {

        // Errors
        if (!header) { console.error('Unable to construct object Container: no header content provided.'); return; }
        if (typeof(header) == 'object') {
            if (!header.querySelector('.container-button')) { console.error('Unable to construct object Container: no valid header button provided.'); return; }
        } else if (!typeof(header) == 'string') { 
            console.error('Unable to construct object Container: invalid header content.'); 
            return;
        }
        if (!parent) { console.error('Unable to construct object Container: no parent provided.'); return; }

        // Assign variables
        this.id = id;
        this.header = header;
        this.content = content;
        this.parent = parent;
        this.html = header.parentNode;

        this.isOpen = isOpen;
        this.isInstantiated = false;
    }

    initialise() {
        // Check for html content
        if (!this.html) { console.error('Unable to initialise object Container: no html content provided.'); return; }

        // Setup onclick event
        let button = this.html.querySelector('.container-button');
        let container = this.html;
        button.onclick = function() { 
            container.classList.toggle('container-open');
            let icon = container.querySelector('.container-button').children[0];
            if (container.classList.contains('container-open')) { icon.innerHTML = downArrow; }
            else { icon.innerHTML = rightArrow; }
        };
        
        // Check if open
        if (this.html.classList.contains('container-open')) { button.children[0].innerHTML = downArrow; }
        else { button.children[0].innerHTML = rightArrow; }

        // Assign ID & add to list
        this.id = Ph_ContainerList.length;
        this.html.classList.add('ph-container-' + Ph_ContainerList.length);
        Ph_ContainerList.push(this);
    }

    instantiate() {

        // Check if instantiated
        if (this.isInstantiated) { console.error('Unable to instantiate object Container: already instantiated.'); return; }

        // Create objects
        let existingContainers = document.getElementsByClassName('container');
        let container = document.createElement('div');
        container.classList.add('container', 'ph-container-' + existingContainers.length);

        let iconValue = rightArrow;
        if (this.isOpen) { container.classList.add('container-open'); iconValue = downArrow; }

        // Append children
        if (typeof(this.header) != 'string') { container.appendChild(this.header); }
        else { 
            let header = document.createElement('header');
            let h3 = document.createElement('h3');
            h3.innerText = this.header;
            header.appendChild(h3);
            
            let headerButton = new Ph_Button({
                icon: iconValue,
                parent: header
            });
            headerButton.instantiate().classList.add('container-button');
            container.appendChild(header);
        }
        let containerContent = document.createElement('div');
        containerContent.classList.add('container-content');
        if (this.content) { containerContent.innerHTML = this.content; }
        container.appendChild(containerContent);

        this.parent.appendChild(container);
        this.html = container;
        this.initialise();
        this.isInstantiated = true;

        // Return object
        return(container);
    }
}



// ALERT -----------------------------------------------------------------------
class Ph_Alert {
    constructor({title, text, timeout = 5000} = {}) {
        this.title = title;
        this.text = text;
        this.timeout = timeout;
    }

    instantiate() { 
        // Check for errors
        if (document.getElementById('ph-alert')) { document.getElementById('ph-alert').parentNode.removeChild(document.getElementById('ph-alert')); }

        // Create objects
        let alert = document.createElement('div');
        alert.classList.add('alert');
        alert.id = 'ph-alert';

        let button = document.createElement('button');
        button.classList.add('button', 'icon');
        button.onclick = this.destroy;
        let buttonIcon = document.createElement('span');
        buttonIcon.classList.add('material-icons-round');
        buttonIcon.innerText = 'close';
        button.appendChild(buttonIcon);
        alert.appendChild(button);

        let alertLeft = document.createElement('div');
        alertLeft.classList.add('alert-left');
        alert.appendChild(alertLeft);
        
        if (this.title) {
            let alertTitle = document.createElement('h2');
            alertTitle.innerText = this.title;
            alertLeft.appendChild(alertTitle);
        }
        if (this.text) {
            let alertText = document.createElement('p');
            alertText.innerText = this.text;
            alertLeft.appendChild(alertText);
        }

        document.getElementsByTagName('body')[0].appendChild(alert);

        // Set timeout
        if (this.timeout > 0) {     // Don't auto destroy if timeout is negative
            clearTimeout(this.destroy);
            setTimeout(this.destroy, this.timeout);
        }

        return(alert);
    }

    destroy() {
        clearTimeout(this.destroy);
        let alert = document.getElementById('ph-alert');
        if (!alert) { return; }
        alert.classList.add('hide');

        setTimeout(function() {
            alert.parentNode.removeChild(alert);
        }, 500);
    }
}



// MODAL -----------------------------------------------------------------------
class Ph_Modal {
    constructor({headerText, content} = {}) {
        if (!headerText) { console.error('Unable to construct object Modal: no header text provided.'); return; }
        this.headerText = headerText;
        this.content = content;
    }

    instantiate() {

        // Check for errors
        if (document.getElementById('ph-modal')) { console.error('Unable to instantiate object Modal: another modal already exists.'); return; }

        // Create object
        let modalOverlay = document.createElement('div');
        modalOverlay.classList.add('modal-overlay');
        modalOverlay.id = 'ph-modal';

        let modal = document.createElement('div');
        modal.classList.add('modal');
        modalOverlay.appendChild(modal);

        let modalHeader = document.createElement('header');
        modalHeader.classList.add('modal-header');
        modal.appendChild(modalHeader);

        let modalHeaderH1 = document.createElement('h1');
        modalHeaderH1.innerText = this.headerText;
        modalHeader.appendChild(modalHeaderH1);

        let modalHeaderButton = document.createElement('button');
        modalHeaderButton.classList.add('button', 'icon', 'secondary', 'outlined');
        modalHeaderButton.onclick = this.destroy;
        let modalHeaderButtonIcon = document.createElement('span');
        modalHeaderButtonIcon.classList.add('material-icons-round');
        modalHeaderButtonIcon.innerHTML = 'close';
        modalHeaderButton.appendChild(modalHeaderButtonIcon);
        modalHeader.appendChild(modalHeaderButton);

        let modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');
        modal.appendChild(modalContent);
        if (this.content) { modalContent.appendChild(this.content); }

        document.getElementsByTagName('body')[0].appendChild(modalOverlay);

        return(modal);
    }

    destroy() {
        // Hide
        let modal = document.getElementById('ph-modal');
        modal.classList.add('hide');

        // Delete after transition
        setTimeout(function() {
            modal.parentNode.removeChild(modal);
        }, 500);
    }
}



// [ MOBILE ] SHEET ------------------------------------------------------------
function loadMobileSheets() {
    const containers = document.getElementsByClassName('become-mobile-sheet');
    for (item of containers) {
        let mobileSheet = new Ph_MobileSheet();
        mobileSheet.instantiate(item);
    }
}
class Ph_MobileSheet {
    constructor({
        id = 0,
        buttons = [],
        html
    } = {}) {
        this.id = id;
        this.buttons = buttons;
        this.html = html;
    }

    // Instantiate a mobile sheet based on the content of an object
    // containing a series of buttons, generally marked with 
    // 'become-mobile-sheet'.
    instantiate(originalObject) { 
        let thisObject = this;

        // Create objects
        let overlay = document.createElement('div');
        overlay.classList.add('mobile-sheet-overlay');
        overlay.onclick = function() { thisObject.close(); }
        document.getElementsByTagName('body')[0].appendChild(overlay);

        let sheet = document.createElement('div');
        sheet.classList.add('mobile-sheet');
        overlay.appendChild(sheet);
        
        // Create buttons
        for (item of originalObject.querySelectorAll('.button')) {
            // Buttons must contain text, but can contain an icon
            let buttonText = '';
            let buttonIcon = '';
            
            // Check if is icon button
            if (item.classList.contains('icon')) { 
                // Check for alt text
                if (!item.dataset.alt) { console.warn('Unable to create object Button from IconButton: no alt text provided.'); continue; }

                // Extract text & icon
                buttonText = item.dataset.alt;
                buttonIcon = item.querySelector('span').innerText;
            }

            // Get event
            var buttonEvent;
            if (item.tagName == 'A') { buttonEvent = item.href; }
            else { buttonEvent = item.getAttribute('onclick'); }

            // Create Button instance
            let button = new Ph_Button({    // Come back to events
                value: buttonText,
                icon: buttonIcon,
                event: buttonEvent,
                isIconLeading: true,
                isDisabled: item.disabled || item.classList.contains('disabled'),
                isLink: item.tagName == 'A',
                parent: sheet
            });

            // Get class information
            for (item of item.classList) {
                if (button.buttonColors.includes(item)) { button.color = item; }
                if (button.buttonTypes.includes(item)) { button.type = item; }
            }

            button.instantiate();
            this.buttons.push(button);
        }

        // Create mobile-only button
        let mobileButton = new Ph_Button({
            icon: 'more_vert',
            parent: originalObject.parentNode
        });
        let buttonObject = mobileButton.instantiate();
        buttonObject.classList.add('mobile-only');
        buttonObject.onclick = function() { thisObject.open(); }

        // Assign ID & return
        this.id = Ph_MobileSheetList.length;
        this.html = overlay;
        this.html.classList.add(this.id);
        Ph_MobileSheetList.push(this);
        return(overlay);
    }

    open() {
        this.html.style.display = 'flex';
        this.html.classList.add('show');
    }
    close() {
        this.html.classList.remove('show');
    }
}



// [ MOBILE ] DRAWER -----------------------------------------------------------
function loadMobileDrawers() {
    const overlays = document.getElementsByClassName('drawer-overlay');
    for (item of overlays) {
        let mobileDrawer = new Ph_MobileDrawer({parent: item.parentNode, html: item});
        mobileDrawer.initialise(item);
    }
}
function getMobileDrawer(id) {
    for (item of Ph_MobileDrawerList) { 
        if (item.id == id || item.html.id == id || item.html.classList.contains(id)) { 
            return(item);
        }
    }
}
class Ph_MobileDrawer {

    // Mobile Drawers are unusual in that they are highly modular, thus
    // are pretty much instantiated as a base object and returned to
    // the developer to customise post-instantiation

    constructor({
        id = 0,
        parent, 
        html
    } = {}) {
        if (!parent) { console.error('Unable to construct object MobileDrawer: no parent provided.'); return; }

        this.id = id;
        this.parent = parent;
        this.html = html;
    }

    initialise() {
        // Check for errors
        if (!this.html) { console.error('Unable to initialise object MobileDrawer: no html content provided.'); return; }

        // Assign ID
        this.id = Ph_MobileDrawerList.length;
        this.html.classList.add('ph-mobile-drawer-' + this.id);
        Ph_MobileDrawerList.push(this);

        // Give exit button onclick
        let exitButton = this.html.querySelector('.drawer-close');
        if (!exitButton) { console.warn('Unable to assign OnClick to Button in object MobileDrawer: no button found.'); }
        else {
            let drawerObject = this;
            exitButton.onclick = function() {
                drawerObject.hide();
            }
        }
    }

    instantiate() { 
        // Create objects
        let overlay = document.createElement('div');
        overlay.classList.add('drawer-overlay');
        this.parent.appendChild(overlay);

        let buttonBar = document.createElement('div');
        buttonBar.classList.add('content-horizontal', 'except');
        overlay.appendChild(buttonBar);

        let exitButton = new Ph_Button({
            icon: 'first_page',
            parent: buttonBar
        });
        let exitButtonObject = exitButton.instantiate();
        exitButtonObject.classList.add('drawer-close');

        // Initialise & return
        this.html = overlay;
        this.initialise();
        return(this.html);
    }

    show() { this.html.style.display = 'flex'; this.html.classList.add('show'); }
    hide() { this.html.classList.remove('show'); }
}