/* global describe, beforeEach, jasmine */
/* eslint camelcase: 0, no-invalid-this: 0 */

const { select } = require('underscore');
const { GameMode } = require('../../server/GameMode.js');
const Contract = require('../../server/game/core/utils/Contract.js');
const TestSetupError = require('./TestSetupError.js');
const { checkNullCard, formatPrompt, getPlayerPromptState, promptStatesEqual, stringArraysEqual } = require('./Util.js');

require('./ObjectFormatters.js');

const DeckBuilder = require('./DeckBuilder.js');
const GameFlowWrapper = require('./GameFlowWrapper.js');
const Util = require('./Util.js');

const deckBuilder = new DeckBuilder();

// TODO: why not just call these directly
const ProxiedGameFlowWrapperMethods = [
    'allPlayersInInitiativeOrder',
    'startGame',
    'keepStartingHand',
    'skipSetupPhase',
    'selectInitiativePlayer',
    'moveToNextActionPhase',
    'moveToRegroupPhase',
    'advancePhases',
    'getPromptedPlayer',
    'nextPhase',
    'setDamage',
    'getChatLogs',
    'getChatLog'
];

var customMatchers = {
    toHavePrompt: function () {
        return {
            compare: function (actual, expected) {
                var result = {};
                var currentPrompt = actual.currentPrompt();
                result.pass = actual.hasPrompt(expected);

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have prompt '${expected}' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have prompt '${expected}' but the prompt is:\n${formatPrompt(actual.currentPrompt(), actual.currentActionTargets)}`;
                }

                return result;
            }
        };
    },
    toHaveEnabledPromptButton: function (util, customEqualityMatchers) {
        return {
            compare: function (actual, expected) {
                var buttons = actual.currentPrompt().buttons;
                var result = {};

                result.pass = buttons.some(
                    (button) => !button.disabled && util.equals(button.text, expected, customEqualityMatchers)
                );

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have enabled prompt button '${expected}' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have enabled prompt button '${expected}' `;

                    if (buttons.length > 0) {
                        var buttonText = buttons.map(
                            (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                        ).join('\n');
                        result.message += `but it had buttons:\n${buttonText}`;
                    } else {
                        result.message += 'but it had no buttons';
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHaveEnabledPromptButtons: function (util, customEqualityMatchers) {
        return {
            compare: function (actual, expecteds) {
                if (!Array.isArray(expecteds)) {
                    expecteds = [expecteds];
                }

                var buttons = actual.currentPrompt().buttons;
                var result = {};

                for (let expected of expecteds) {
                    result.pass = buttons.some(
                        (button) => !button.disabled && util.equals(button.text, expected, customEqualityMatchers)
                    );

                    if (result.pass) {
                        result.message = `Expected ${actual.name} not to have enabled prompt buttons '${expected}' but it did.`;
                    } else {
                        result.message = `Expected ${actual.name} to have enabled prompt buttons '${expected}' `;

                        if (buttons.length > 0) {
                            var buttonText = buttons.map(
                                (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                            ).join('\n');
                            result.message += `but it had buttons:\n${buttonText}`;
                        } else {
                            result.message += 'but it had no buttons';
                        }
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHaveDisabledPromptButton: function (util, customEqualityMatchers) {
        return {
            compare: function (actual, expected) {
                var buttons = actual.currentPrompt().buttons;
                var result = {};

                result.pass = buttons.some(
                    (button) => button.disabled && util.equals(button.text, expected, customEqualityMatchers)
                );

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have disabled prompt button '${expected}' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have disabled prompt button '${expected}' `;

                    if (buttons.length > 0) {
                        var buttonText = buttons.map(
                            (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                        ).join('\n');
                        result.message += `but it had buttons:\n${buttonText}`;
                    } else {
                        result.message += 'but it had no buttons';
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHaveDisabledPromptButtons: function (util, customEqualityMatchers) {
        return {
            compare: function (actual, expecteds) {
                if (!Array.isArray(expecteds)) {
                    expecteds = [expecteds];
                }

                var buttons = actual.currentPrompt().buttons;
                var result = {};

                for (let expected of expecteds) {
                    result.pass = buttons.some(
                        (button) => button.disabled && util.equals(button.text, expected, customEqualityMatchers)
                    );

                    if (result.pass) {
                        result.message = `Expected ${actual.name} not to have disabled prompt button '${expected}' but it did.`;
                    } else {
                        result.message = `Expected ${actual.name} to have disabled prompt buttons '${expected}' `;

                        if (buttons.length > 0) {
                            var buttonText = buttons.map(
                                (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                            ).join('\n');
                            result.message += `but it had buttons:\n${buttonText}`;
                        } else {
                            result.message += 'but it had no buttons';
                        }
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHavePassAbilityButton: function (util, customEqualityMatchers) {
        return {
            compare: function (actual) {
                var buttons = actual.currentPrompt().buttons;
                var result = {};

                result.pass = buttons.some(
                    (button) => !button.disabled && util.equals(button.text, 'Pass ability', customEqualityMatchers)
                );

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have enabled prompt button 'Pass ability' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have enabled prompt button 'Pass ability' `;

                    if (buttons.length > 0) {
                        var buttonText = buttons.map(
                            (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                        ).join('\n');
                        result.message += `but it had buttons:\n${buttonText}`;
                    } else {
                        result.message += 'but it had no buttons';
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHaveChooseNoTargetButton: function (util, customEqualityMatchers) {
        return {
            compare: function (actual) {
                var buttons = actual.currentPrompt().buttons;
                var result = {};

                result.pass = buttons.some(
                    (button) => !button.disabled &&
                      (util.equals(button.text, 'Choose no target', customEqualityMatchers) || util.equals(button.text, 'Choose no targets', customEqualityMatchers))
                );

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have enabled prompt button 'Choose no target(s)' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have enabled prompt button 'Choose no target(s)' `;

                    if (buttons.length > 0) {
                        var buttonText = buttons.map(
                            (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                        ).join('\n');
                        result.message += `but it had buttons:\n${buttonText}`;
                    } else {
                        result.message += 'but it had no buttons';
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHavePassAttackButton: function (util, customEqualityMatchers) {
        return {
            compare: function (actual) {
                var buttons = actual.currentPrompt().buttons;
                var result = {};

                result.pass = buttons.some(
                    (button) => !button.disabled && util.equals(button.text, 'Pass attack', customEqualityMatchers)
                );

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have enabled prompt button 'Pass attack' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have enabled prompt button 'Pass attack' `;

                    if (buttons.length > 0) {
                        var buttonText = buttons.map(
                            (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                        ).join('\n');
                        result.message += `but it had buttons:\n${buttonText}`;
                    } else {
                        result.message += 'but it had no buttons';
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toHaveClaimInitiativeAbilityButton: function (util, customEqualityMatchers) {
        return {
            compare: function (actual) {
                var buttons = actual.currentPrompt().buttons;
                var result = {};

                result.pass = buttons.some(
                    (button) => !button.disabled && util.equals(button.text, 'Claim Initiative', customEqualityMatchers)
                );

                if (result.pass) {
                    result.message = `Expected ${actual.name} not to have enabled prompt button 'Claim Initiative' but it did.`;
                } else {
                    result.message = `Expected ${actual.name} to have enabled prompt button 'Claim Initiative' `;

                    if (buttons.length > 0) {
                        var buttonText = buttons.map(
                            (button) => '[' + button.text + (button.disabled ? ' (disabled) ' : '') + ']'
                        ).join('\n');
                        result.message += `but it had buttons:\n${buttonText}`;
                    } else {
                        result.message += 'but it had no buttons';
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(actual)}`;

                return result;
            }
        };
    },
    toBeAbleToSelect: function () {
        return {
            compare: function (player, card) {
                if (typeof card === 'string') {
                    card = player.findCardByName(card);
                } else {
                    checkNullCard(card);
                }
                let result = {};

                result.pass = player.currentActionTargets.includes(card);

                if (result.pass) {
                    result.message = `Expected ${card.name} not to be selectable by ${player.name} but it was.`;
                } else {
                    result.message = `Expected ${card.name} to be selectable by ${player.name} but it wasn't.`;
                }

                result.message += `\n\n${generatePromptHelpMessage(player)}`;

                return result;
            }
        };
    },
    toBeAbleToSelectAllOf: function () {
        return {
            compare: function (player, cards) {
                checkNullCard(cards);
                if (!Array.isArray(cards)) {
                    cards = [cards];
                }

                let cardsPopulated = [];
                for (let card of cards) {
                    if (typeof card === 'string') {
                        cardsPopulated.push(player.findCardByName(card));
                    } else {
                        cardsPopulated.push(card);
                    }
                }

                let result = {};

                let selectable = cardsPopulated.filter((x) => player.currentActionTargets.includes(x));
                let unselectable = cardsPopulated.filter((x) => !player.currentActionTargets.includes(x));

                result.pass = unselectable.length === 0;

                if (result.pass) {
                    if (selectable.length === 1) {
                        result.message = `Expected ${selectable[0].name} not to be selectable by ${player.name} but it was.`;
                    } else {
                        result.message = `Expected at least 1 of the following cards not to be selectable by ${player.name} but they all were: ${selectable.map((card) => card.name).join(', ')}`;
                    }
                } else {
                    if (unselectable.length === 1) {
                        result.message = `Expected ${unselectable[0].name} to be selectable by ${player.name} but it wasn't.`;
                    } else {
                        result.message = `Expected the following cards to be selectable by ${player.name} but they were not: ${unselectable.map((card) => card.name).join(', ')}`;
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(player)}`;

                return result;
            }
        };
    },
    toBeAbleToSelectNoneOf: function () {
        return {
            compare: function (player, cards) {
                checkNullCard(cards);
                if (!Array.isArray(cards)) {
                    cards = [cards];
                }

                let cardsPopulated = [];
                for (let card of cards) {
                    if (typeof card === 'string') {
                        cardsPopulated.push(player.findCardByName(card));
                    } else {
                        cardsPopulated.push(card);
                    }
                }

                let result = {};

                let selectable = cardsPopulated.filter((x) => player.currentActionTargets.includes(x));
                let unselectable = cardsPopulated.filter((x) => !player.currentActionTargets.includes(x));

                result.pass = selectable.length === 0;

                if (result.pass) {
                    if (unselectable.length === 1) {
                        result.message = `Expected ${unselectable[0].name} to be selectable by ${player.name} but it wasn't.`;
                    } else {
                        result.message = `Expected at least 1 of the following cards to be selectable by ${player.name} but they all were not: ${unselectable.map((card) => card.name).join(', ')}`;
                    }
                } else {
                    if (selectable.length === 1) {
                        result.message = `Expected ${selectable[0].name} not to be selectable by ${player.name} but it was.`;
                    } else {
                        result.message = `Expected the following cards to not be selectable by ${player.name} but they were: ${selectable.map((card) => card.name).join(', ')}`;
                    }
                }

                result.message += `\n\n${generatePromptHelpMessage(player)}`;

                return result;
            }
        };
    },
    toBeAbleToSelectExactly: function () {
        return {
            compare: function (player, cards) {
                checkNullCard(cards);
                if (!Array.isArray(cards)) {
                    cards = [cards];
                }

                let cardsPopulated = [];
                for (let card of cards) {
                    if (typeof card === 'string') {
                        cardsPopulated.push(player.findCardByName(card));
                    } else {
                        cardsPopulated.push(card);
                    }
                }

                let result = {};

                let expectedSelectable = cardsPopulated.filter((x) => player.currentActionTargets.includes(x));
                let unexpectedUnselectable = cardsPopulated.filter((x) => !player.currentActionTargets.includes(x));
                let unexpectedSelectable = player.currentActionTargets.filter((x) => !cardsPopulated.includes(x));

                result.pass = unexpectedUnselectable.length === 0 && unexpectedSelectable.length === 0;

                if (result.pass) {
                    result.message = `Expected ${player.name} not to be able to select exactly these cards but they can: ${expectedSelectable.map((card) => card.name).join(', ')}`;
                } else {
                    let message = '';

                    if (unexpectedUnselectable.length > 0) {
                        message = `Expected the following cards to be selectable by ${player.name} but they were not: ${unexpectedUnselectable.map((card) => card.name).join(', ')}`;
                    }
                    if (unexpectedSelectable.length > 0) {
                        if (message.length > 0) {
                            message += '\n';
                        }
                        message += `Expected the following cards not to be selectable by ${player.name} but they were: ${unexpectedSelectable.map((card) => card.name).join(', ')}`;
                    }
                    result.message = message;
                }

                result.message += `\n\n${generatePromptHelpMessage(player)}`;

                return result;
            }
        };
    },
    toHaveAvailableActionWhenClickedBy: function () {
        return {
            compare: function (card, player) {
                checkNullCard(card);
                if (typeof card === 'string') {
                    card = player.findCardByName(card);
                }
                let result = {};

                const beforeClick = getPlayerPromptState(player.player);

                player.clickCardNonChecking(card);

                const afterClick = getPlayerPromptState(player.player);

                // if the prompt state changed after click, there was an action available
                result.pass = !promptStatesEqual(beforeClick, afterClick);

                if (result.pass) {
                    result.message = `Expected ${card.name} not to have an action available when clicked by ${player.name} but it has ability prompt:\n${generatePromptHelpMessage(player)}`;
                } else {
                    result.message = `Expected ${card.name} to have an action available when clicked by ${player.name} but it did not.`;
                }

                return result;
            }
        };
    },
    toBeActivePlayer: function () {
        return {
            compare: function (player) {
                let result = {};

                // use player.player here because the received parameter is a PlayerInteractionWrapper
                result.pass = player.game.actionPhaseActivePlayer === player.player;

                if (result.pass) {
                    result.message = `Expected ${player.name} not to be the active player but they were.`;
                } else {
                    result.message = `Expected ${player.name} to be the active player but they were not.`;
                }

                return result;
            }
        };
    },
    toHaveInitiative: function () {
        return {
            compare: function (player) {
                let result = {};

                result.pass = player.hasInitiative;

                if (result.pass) {
                    result.message = `Expected ${player.name} not to have initiative but it did.`;
                } else {
                    result.message = `Expected ${player.name} to have initiative but it did not.`;
                }

                return result;
            }
        };
    },
    toHavePassAbilityPrompt: function () {
        return {
            compare: function (player, abilityText) {
                var result = {};

                if (abilityText == null) {
                    throw new TestSetupError('toHavePassAbilityPrompt requires an abilityText parameter');
                }

                const passPromptText = `Trigger the ability '${abilityText}' or pass`;
                result.pass = player.hasPrompt(passPromptText);

                if (result.pass) {
                    result.message = `Expected ${player.name} not to have pass prompt '${passPromptText}' but it did.`;
                } else {
                    result.message = `Expected ${player.name} to have pass prompt '${passPromptText}' but it has prompt:\n${generatePromptHelpMessage(player)}`;
                }

                return result;
            }
        };
    },
    toHavePassSingleTargetPrompt: function () {
        return {
            compare: function (player, abilityText, target) {
                var result = {};

                if (abilityText == null || target == null) {
                    throw new TestSetupError('toHavePassSingleTargetPrompt requires the target and abilityText parameters');
                }

                // in certain cases the prompt may have additional text explaining the hidden zone rule
                const passPromptText = `Trigger the effect '${abilityText}' on target '${target.title}' or pass`;
                const passPromptTextForHiddenZone = passPromptText + ' (because you are choosing from a hidden zone you may choose nothing)';

                result.pass = player.hasPrompt(passPromptText) || player.hasPrompt(passPromptTextForHiddenZone);

                if (result.pass) {
                    result.message = `Expected ${player.name} not to have pass prompt '${passPromptText}' but it did.`;
                } else {
                    result.message = `Expected ${player.name} to have pass prompt '${passPromptText}' but it has prompt:\n${generatePromptHelpMessage(player)}`;
                }

                return result;
            }
        };
    },
    toBeInBottomOfDeck: function () {
        return {
            compare: function (card, player, numCards) {
                checkNullCard(card);
                var result = {};
                const deck = player.deck;
                const L = deck.length;
                result.pass = L >= numCards;
                if (result.pass) {
                    result.pass = card.zoneName === 'deck';
                    if (!result.pass) {
                        result.message = `Expected ${card.title} to be in the deck.`;
                    } else {
                        var onBottom = false;
                        for (let i = 1; i <= numCards; i++) {
                            if (deck[L - i] === card) {
                                onBottom = true;
                                break;
                            }
                        }
                        result.pass = onBottom;
                        if (!onBottom) {
                            result.message = `Expected ${card.title} to be on the bottom of the deck.`;
                        }
                    }
                } else {
                    result.message = 'Deck is smaller than parameter numCards';
                }
                return result;
            }
        };
    },
    toAllBeInBottomOfDeck: function () {
        return {
            compare: function (cards, player, numCards) {
                checkNullCard(cards);
                var result = {};
                const deck = player.deck;
                const L = deck.length;
                result.pass = L >= numCards;
                if (result.pass) {
                    var notInDeck = [];
                    var notOnBottom = [];
                    for (let card of cards) {
                        thisCardPass = card.zoneName === 'deck';
                        if (!thisCardPass) {
                            result.pass = thisCardPass;
                            notInDeck.push(card.title);
                        } else {
                            var onBottom = false;
                            for (let i = 1; i <= numCards; i++) {
                                if (deck[L - i] === card) {
                                    onBottom = true;
                                    break;
                                }
                            }
                            thisCardPass = onBottom;
                            if (!onBottom) {
                                result.pass = onBottom;
                                notOnBottom.push(card.title);
                            }
                        }
                    }

                    if (!result.pass) {
                        result.message = '';
                        if (notInDeck.length > 0) {
                            result.message += `Expected ${notInDeck.join(', ')} to be in the deck.`;
                        }
                        if (notOnBottom.length > 0) {
                            result.message += ` Expected ${notOnBottom.join(', ')} to be on the bottom of the deck`;
                        }
                    }
                } else {
                    result.message = 'Deck is smaller than parameter numCards';
                }
                return result;
            }
        };
    },
    toBeInZone: function () {
        return {
            compare: function (card, zone, player = null) {
                if (typeof card === 'string') {
                    throw new TestSetupError('This expectation requires a card object, not a name');
                }
                if (zone === 'capture') {
                    throw new TestSetupError('Do not use toBeInZone to check for capture zone, use to toBeCapturedBy instead');
                }
                let result = {};

                const zoneOwningPlayer = player || card.controller;

                const correctProperty = card.zoneName === zone;
                const correctPile = zoneOwningPlayer.getCardsInZone(zone).includes(card);

                if (correctProperty !== correctPile) {
                    result.pass = false;
                    result.message = `Card ${card.internalName} has inconsistent zone state, card.zoneName is '${card.zoneName}' but it is not in the corresponding pile for ${zoneOwningPlayer.name}'`;
                    return result;
                }

                result.pass = correctProperty && correctPile;

                if (result.pass) {
                    result.message = `Expected ${card.internalName} not to be in zone '${zone}' but it is`;
                } else {
                    result.message = `Expected ${card.internalName} to be in zone '${zone}' but it is in zone '${card.zoneName}'`;
                }

                return result;
            }
        };
    },
    toBeCapturedBy: function () {
        return {
            compare: function (card, captor) {
                if (typeof card === 'string' || typeof captor === 'string') {
                    throw new TestSetupError('This expectation requires a card object, not a name');
                }
                let result = {};

                if (card.zoneName !== 'capture') {
                    result.pass = false;
                    result.message = `Card ${card.internalName} has inconsistent zone state, card.zoneName is '${card.zoneName}' but it is not in the corresponding capture zone for ${captor.internalName}'`;
                    return result;
                }

                const correctPile = captor.captureZone;

                result.pass = captor.captureZone.hasCard(card);

                if (result.pass) {
                    result.message = `Expected ${card.internalName} not to be captured by ${captor.internalName} but it is`;
                } else {
                    result.message = `Expected ${card.internalName} to be captured by ${captor.internalName} but it is in zone '${card.zone}'`;
                }

                return result;
            }
        };
    },
    toHaveExactUpgradeNames: function () {
        return {
            compare: function (card, upgradeNames) {
                let result = {};

                if (!card.upgrades) {
                    throw new TestSetupError(`Card ${card.internalName} does not have an upgrades property`);
                }
                if (!Array.isArray(upgradeNames)) {
                    throw new TestSetupError(`Parameter upgradeNames is not an array: ${upgradeNames}`);
                }

                const actualUpgradeNames = card.upgrades.map((upgrade) => upgrade.internalName);

                const expectedUpgradeNames = [...upgradeNames];

                result.pass = stringArraysEqual(actualUpgradeNames, expectedUpgradeNames);

                if (result.pass) {
                    result.message = `Expected ${card.internalName} not to have this exact set of upgrades but it does: ${expectedUpgradeNames.join(', ')}`;
                } else {
                    result.message = `Expected ${card.internalName} to have this exact set of upgrades: '${expectedUpgradeNames.join(', ')}' but it has: '${actualUpgradeNames.join(', ')}'`;
                }

                return result;
            }
        };
    },
    // TODO: could add a field to expect enabled or disabled per button
    toHaveExactPromptButtons: function () {
        return {
            compare: function (player, buttons) {
                let result = {};

                if (!Array.isArray(buttons)) {
                    throw new TestSetupError(`Parameter 'buttons' is not an array: ${buttons}`);
                }

                const actualButtons = player.currentPrompt().buttons.map((button) => button.text);

                const expectedButtons = [...buttons];

                result.pass = stringArraysEqual(actualButtons, expectedButtons);

                if (result.pass) {
                    result.message = `Expected ${player.name} not to have this exact set of buttons but it does: ${expectedButtons.join(', ')}`;
                } else {
                    result.message = `Expected ${player.name} to have this exact set of buttons: '${expectedButtons.join(', ')}'`;
                }

                result.message += `\n\n${generatePromptHelpMessage(player)}`;

                return result;
            }
        };
    },
    toHaveExactDropdownListOptions: function () {
        return {
            compare: function (player, expectedOptions) {
                let result = {};

                if (!Array.isArray(expectedOptions)) {
                    throw new TestSetupError(`Parameter 'options' is not an array: ${expectedOptions}`);
                }

                const actualOptions = player.currentPrompt().dropdownListOptions;

                result.pass = stringArraysEqual(actualOptions, expectedOptions);

                if (result.pass) {
                    result.message = `Expected ${player.name} not to have this exact list of options but it does: '${Util.createStringForOptions(expectedOptions)}'`;
                } else {
                    result.message = `Expected ${player.name} to have this exact list of options: '${Util.createStringForOptions(expectedOptions)}'`;
                }

                result.message += `\n\n${generatePromptHelpMessage(player)}`;

                return result;
            }
        };
    }
};

function generatePromptHelpMessage(player) {
    return `Current prompt for ${player.name}:\n${formatPrompt(player.currentPrompt(), player.currentActionTargets)}`;
}

function validatePlayerOptions(playerOptions, playerName, startPhase) {
    // list of approved property names
    const noneSetupPhase = [
        'hasInitiative',
        'resources',
        'groundArena',
        'spaceArena',
        'hand',
        'discard',
        'leader',
        'base',
        'deck',
        'resource',
    ];
    // list of approved property names for setup phase
    const setupPhase = [
        'leader',
        'deck'
    ];

    // Check for unknown properties
    for (const prop of Object.keys(playerOptions)) {
        if (!noneSetupPhase.includes(prop) && startPhase !== 'setup') {
            throw new Error(`${playerName} has an unknown property '${prop}'`);
        } else if (!setupPhase.includes(prop) && startPhase === 'setup') {
            throw new Error(`${playerName} has an unknown property '${prop}'`);
        }
    }
}

beforeEach(function () {
    jasmine.addMatchers(customMatchers);
});

global.integration = function (definitions) {
    describe('- integration -', function () {
        /**
         * @type {SwuTestContextRef}
         */
        const contextRef = {
            context: null, setupTest: function (options) {
                this.context.setupTest(options);
            }
        };
        beforeEach(function () {
            const newContext = {};
            contextRef.context = newContext;
            this.flow = newContext.flow = new GameFlowWrapper();

            this.game = newContext.game = this.flow.game;
            this.player1Object = newContext.player1Object = this.game.getPlayerByName('player1');
            this.player2Object = newContext.player2Object = this.game.getPlayerByName('player2');
            this.player1 = newContext.player1 = this.flow.player1;
            this.player2 = newContext.player2 = this.flow.player2;

            ProxiedGameFlowWrapperMethods.forEach((method) => {
                this[method] = newContext[method] = (...args) => this.flow[method].apply(this.flow, args);
            });

            this.buildDeck = newContext.buildDeck = function (faction, cards) {
                return deckBuilder.buildDeck(faction, cards);
            };

            /**
             * Factory method. Creates a new simulation of a game.
             * @param {Object} [options = {}] - specifies the state of the game
             */
            this.setupTest = newContext.setupTest = function (options = {}) {
                // Set defaults
                if (!options.player1) {
                    options.player1 = {};
                }
                if (!options.player2) {
                    options.player2 = {};
                }

                // validate supplied parameters
                validatePlayerOptions(options.player1, 'player1', options.phase);
                validatePlayerOptions(options.player2, 'player2', options.phase);

                this.game.gameMode = GameMode.Premier;

                if (options.player1.hasInitiative) {
                    this.game.initiativePlayer = this.player1Object;
                } else if (options.player2.hasInitiative) {
                    this.game.initiativePlayer = this.player2Object;
                }

                // pass decklists to players. they are initialized into real card objects in the startGame() call
                const [deck1, namedCards1] = deckBuilder.customDeck(1, options.player1, options.phase);
                const [deck2, namedCards2] = deckBuilder.customDeck(2, options.player2, options.phase);

                this.player1.selectDeck(deck1);
                this.player2.selectDeck(deck2);

                // pass the data for token cards to the game so it can generate them
                this.game.initialiseTokens(deckBuilder.getTokenData());

                // each player object will convert the card names to real cards on start
                this.startGame();

                if (options.phase !== 'setup') {
                    this.player1.player.promptedActionWindows[options.phase] = true;
                    this.player2.player.promptedActionWindows[options.phase] = true;

                    // Advance the phases to the specified
                    this.advancePhases(options.phase);
                } else {
                    // Set action window prompt
                    this.player1.player.promptedActionWindows['action'] = true;
                    this.player2.player.promptedActionWindows['action'] = true;
                }

                // return all zone cards to deck and then set them below
                this.player1.moveAllNonBaseZonesToRemoved();
                this.player2.moveAllNonBaseZonesToRemoved();


                if (options.phase !== 'setup') {
                    // Resources
                    this.player1.setResourceCards(options.player1.resources, ['outsideTheGame']);
                    this.player2.setResourceCards(options.player2.resources, ['outsideTheGame']);

                    // Arenas
                    this.player1.setGroundArenaUnits(options.player1.groundArena, ['outsideTheGame']);
                    this.player2.setGroundArenaUnits(options.player2.groundArena, ['outsideTheGame']);
                    this.player1.setSpaceArenaUnits(options.player1.spaceArena, ['outsideTheGame']);
                    this.player2.setSpaceArenaUnits(options.player2.spaceArena, ['outsideTheGame']);

                    // Hand + discard
                    this.player1.setHand(options.player1.hand, ['outsideTheGame']);
                    this.player2.setHand(options.player2.hand, ['outsideTheGame']);
                    this.player1.setDiscard(options.player1.discard, ['outsideTheGame']);
                    this.player2.setDiscard(options.player2.discard, ['outsideTheGame']);

                    // Set Leader state (deployed, exhausted, etc.)
                    this.player1.setLeaderStatus(options.player1.leader);
                    this.player2.setLeaderStatus(options.player2.leader);
                }

                // Set Base damage
                this.player1.setBaseStatus(options.player1.base);
                this.player2.setBaseStatus(options.player2.base);

                // Deck
                this.player1.setDeck(options.player1.deck, ['outsideTheGame']);
                this.player2.setDeck(options.player2.deck, ['outsideTheGame']);

                // add named cards to this for easy reference (allows us to do "this.<cardName>")
                // note that if cards map to the same property name (i.e., same title), then they won't be added
                const cardNamesAsProperties = Util.convertNonDuplicateCardNamesToProperties(
                    [this.player1, this.player2],
                    [namedCards1, namedCards2]
                );
                this.cardPropertyNames = newContext.cardPropertyNames = [];
                cardNamesAsProperties.forEach((card) => {
                    this[card.propertyName] = newContext[card.propertyName] = card.cardObj;
                    this.cardPropertyNames.push(card.propertyName);
                });

                this.p1Base = newContext.p1Base = this.player1.base;
                this.p1Leader = newContext.p1Leader = this.player1.leader;
                this.p2Base = newContext.p2Base = this.player2.base;
                this.p2Leader = newContext.p2Leader = this.player2.leader;

                this.game.resolveGameState(true);
            };
        });

        definitions(contextRef);
    });
};
