import { AbilityContext } from '../AbilityContext';
import { EventNames, Locations, Players, TargetModes } from '../Constants';
import { Event } from '../events/Event';
import { CardGameAction } from '../GameActions/CardGameAction';
import { GameAction } from '../GameActions/GameAction';
import * as GameActions from '../GameActions/GameActions';
import { HandlerAction } from '../GameActions/HandlerAction';
import { ReturnToDeckProperties } from '../gameActions/ReturnToDeckAction';
import { SelectCardProperties } from '../gameActions/SelectCardAction';
import { TriggeredAbilityContext } from '../TriggeredAbilityContext';
import { Derivable, derive } from '../utils/helpers';
import BaseCard from '../card/basecard';
import { GameActionCost } from './GameActionCost';
import { MetaActionCost } from './MetaActionCost';
import { ReduceableResourceCost } from '../costs/ReduceableResourceCost';
import { TargetDependentFateCost } from './costs/TargetDependentFateCost';
import DeckCard from '../card/deckcard';
import Player from '../player';

type SelectCostProperties = Omit<SelectCardProperties, 'gameAction'>;

function getSelectCost(
    action: CardGameAction,
    properties: undefined | SelectCostProperties,
    activePromptTitle: string
) {
    return new MetaActionCost(
        GameActions.selectCard(Object.assign({ gameAction: action }, properties)),
        activePromptTitle
    );
}

export type Result = {
    canCancel?: boolean;
    cancelled?: boolean;
};

export interface Cost {
    canPay(context: AbilityContext): boolean;

    action?: GameAction;
    activePromptTitle?: string;

    selectCardName?(player: Player, cardName: string, context: AbilityContext): boolean;
    promptsPlayer?: boolean;
    dependsOn?: string;
    isPrintedFateCost?: boolean;
    isPlayCost?: boolean;
    canIgnoreForTargeting?: boolean;

    getActionName?(context: AbilityContext): string;
    getCostMessage?(context: AbilityContext): unknown[];
    hasTargetsChosenByInitiatingPlayer?(context: AbilityContext): boolean;
    addEventsToArray?(events: any[], context: AbilityContext, result?: Result): void;
    resolve?(context: AbilityContext, result: Result): void;
    payEvent?(context: TriggeredAbilityContext): Event | Event[];
    pay?(context: TriggeredAbilityContext): void;
}

/**
 * Cost that will return a selected card to hand which matches the passed
 * condition.
 */
export function returnToHand(properties: SelectCostProperties): Cost {
    return getSelectCost(GameActions.returnToHand(), properties, 'Select card to return to hand');
}

/**
 * Cost that will return a selected card to the appropriate deck which matches the passed
 * condition.
 */
export function returnToDeck(properties: ReturnToDeckProperties & SelectCostProperties): Cost {
    return getSelectCost(GameActions.returnToDeck(properties), properties, 'Select card to return to your deck');
}

/**
 * Cost that will return to hand the card that initiated the ability.
 */
export function returnSelfToHand(): Cost {
    return new GameActionCost(GameActions.returnToHand());
}

/**
 * Cost that will shuffle a selected card into the relevant deck which matches the passed
 * condition.
 */
export function shuffleIntoDeck(properties: SelectCostProperties): Cost {
    return getSelectCost(
        GameActions.moveCard({ destination: Locations.DynastyDeck, shuffle: true }),
        properties,
        'Select card to shuffle into deck'
    );
}

/**
 * Cost that requires discarding a specific card.
 */
export function discardCardSpecific(cardFunc: (context: AbilityContext) => DeckCard): Cost {
    return new GameActionCost(GameActions.discardCard((context) => ({ target: cardFunc(context) })));
}

/**
 * Cost that requires discarding itself from hand.
 */
export function discardSelf(): Cost {
    return new GameActionCost(GameActions.discardCard((context) => ({ target: context.source })));
}

/**
 * Cost that requires discarding a card to be selected by the player.
 */
export function discardCard(properties?: SelectCostProperties): Cost {
    return getSelectCost(
        GameActions.discardCard(),
        Object.assign({ location: Locations.Hand, mode: TargetModes.Exactly }, properties),
        (properties?.numCards ?? 0) > 1 ? `Select ${properties.numCards} cards to discard` : 'Select card to discard'
    );
}

export function discardTopCardsFromDeck(properties: { amount: number; deck: Decks }): Cost {
    const getDeck =
        properties.deck === Decks.DynastyDeck
            ? (context: AbilityContext) => context.player.dynastyDeck
            : (context: AbilityContext) => context.player.conflictDeck;
    const destination =
        properties.deck === Decks.DynastyDeck ? Locations.DynastyDiscardPile : Locations.ConflictDiscardPile;
    return {
        getActionName: (context) => 'discardTopCardsFromDeck',
        getCostMessage: (context) => ['discarding {0}'],
        canPay: (context) => getDeck(context).size() >= 4,
        resolve: (context) => {
            context.costs.discardTopCardsFromDeck = getDeck(context).first(4);
        },
        pay: (context) => {
            for (const card of context.costs.discardTopCardsFromDeck as DeckCard[]) {
                card.controller.moveCard(card, destination);
            }
        }
    };
}

/**
 * Cost that requires removing a card selected by the player from the game.
 */
export function removeFromGame(properties: SelectCostProperties): Cost {
    return getSelectCost(GameActions.removeFromGame(), properties, 'Select card to remove from game');
}

/**
 * Cost that requires removing a card selected by the player from the game.
 */
export function removeSelfFromGame(properties?: { location: Array<Locations> }): Cost {
    return new GameActionCost(GameActions.removeFromGame(properties));
}

export function discardStatusToken(properties: Omit<SelectCardProperties, 'gameAction' | 'subActionProperties'>): Cost {
    return new MetaActionCost(
        GameActions.selectCard(
            Object.assign(
                {
                    gameAction: GameActions.discardStatusToken(),
                    subActionProperties: (card: DeckCard) => ({ target: card.getStatusToken(CharacterStatus.Honored) })
                },
                properties
            )
        ),
        'Select character to discard honored status token from'
    );
}

/**
 * Cost that will discard the status token on a card to be selected by the player
 */
export function discardStatusTokenFromSelf(): Cost {
    return new GameActionCost(GameActions.discardStatusToken());
}

/**
 * Cost that will put into play the card that initiated the ability
 */
export function putSelfIntoPlay(): Cost {
    return new GameActionCost(GameActions.putIntoPlay());
}

/**
 * Cost that will prompt for a card
 */
export function selectedReveal(properties: SelectCostProperties): Cost {
    return getSelectCost(GameActions.reveal(), properties, `Select a ${properties.cardType || 'card'} to reveal`);
}

/**
 * Cost that will reveal specific cards
 */
export function reveal(cardFunc: (context: AbilityContext) => BaseCard[]): Cost {
    return new GameActionCost(GameActions.reveal((context) => ({ target: cardFunc(context) })));
}

/**
 * Cost that will pay the exact printed fate cost for the card.
 */
export function payPrintedFateCost(): Cost {
    return {
        canIgnoreForTargeting: true,
        canPay(context: TriggeredAbilityContext) {
            const amount = context.source.getCost();
            return (
                context.player.fate >= amount &&
                (amount === 0 || context.player.checkRestrictions('spendFate', context))
            );
        },
        payEvent(context: TriggeredAbilityContext) {
            const amount = context.source.getCost();
            return new Event(
                EventNames.OnSpendFate,
                { amount, context },
                (event) => (event.context.player.fate -= event.amount)
            );
        }
    };
}

/**
 * Cost that will pay the printed fate cost on the card minus any active
 * reducer effects the play has activated. Upon playing the card, all
 * matching reducer effects will expire, if applicable.
 */
export function payReduceableResourceCost(ignoreType = false): Cost {
    return new ReduceableResourceCost(ignoreType);
}

/**
 * Cost that is dependent on context.targets[targetName]
 */
export function payTargetDependentFateCost(targetName: string, ignoreType = false): Cost {
    return new TargetDependentFateCost(ignoreType, targetName);
}

/**
 * Cost in which the player must pay a fixed, non-reduceable amount of fate.
 */
export function payFate(amount: number | ((context: AbilityContext) => number) = 1): Cost {
    return new GameActionCost(
        typeof amount === 'function'
            ? GameActions.loseFate((context) => ({ target: context.player, amount: amount(context) }))
            : GameActions.loseFate((context) => ({ target: context.player, amount }))
    );
}

// TODO: reuse variable methods for swu cards
export function variableHonorCost(amountFunc: (context: TriggeredAbilityContext) => number): Cost {
    return {
        promptsPlayer: true,
        canPay(context: TriggeredAbilityContext) {
            return amountFunc(context) > 0 && context.game.actions.loseHonor().canAffect(context.player, context);
        },
        resolve(context: TriggeredAbilityContext, result) {
            const amount = amountFunc(context);
            const max = Math.min(amount, context.player.honor);
            const choices = Array.from(Array(max), (x, i) => String(i + 1));
            if (result.canCancel) {
                choices.push('Cancel');
            }
            context.game.promptWithHandlerMenu(context.player, {
                activePromptTitle: 'Choose how much honor to pay',
                context: context,
                choices: choices,
                choiceHandler: (choice) => {
                    if (choice === 'Cancel') {
                        context.costs.variableHonorCost = 0;
                        result.cancelled = true;
                    } else {
                        context.costs.variableHonorCost = parseInt(choice);
                    }
                }
            });
        },
        payEvent(context: TriggeredAbilityContext) {
            const action = context.game.actions.loseHonor({ amount: context.costs.variableHonorCost });
            return action.getEvent(context.player, context);
        }
    };
}

export function variableFateCost(properties: {
    activePromptTitle: string;
    minAmount?: Derivable<number, TriggeredAbilityContext>;
    maxAmount: Derivable<number, TriggeredAbilityContext>;
}): Cost {
    function deriveMinAmount(context: TriggeredAbilityContext) {
        return properties.minAmount === undefined ? 1 : derive(properties.minAmount, context);
    }
    function deriveMaxAmount(context: TriggeredAbilityContext) {
        return properties.maxAmount === undefined ? -1 : derive(properties.maxAmount, context);
    }
    return {
        promptsPlayer: true,
        canPay(context: TriggeredAbilityContext) {
            if ((context as any).ignoreResourceCost) {
                return true;
            }
            const costModifiers = context.player.getTotalCostModifiers(PlayTypes.PlayFromHand, context.source);
            return (
                costModifiers < 0 ||
                (context.player.fate >= deriveMinAmount(context) + costModifiers &&
                    context.game.actions.loseFate().canAffect(context.player, context))
            );
        },
        resolve(context: TriggeredAbilityContext, result) {
            const costModifiers = (context as any).ignoreResourceCost
                ? -1000
                : context.player.getTotalCostModifiers(PlayTypes.PlayFromHand, context.source);

            const maxAmount = deriveMaxAmount(context);
            const min = deriveMinAmount(context);
            let max = context.player.fate - costModifiers;
            if (maxAmount >= 0) {
                max = Math.min(maxAmount, context.player.fate - costModifiers);
            }
            if (!context.game.actions.loseFate().canAffect(context.player, context)) {
                max = Math.min(max, -costModifiers);
            }
            const choices = Array.from({ length: max + 1 - min }, (_, idx) => String(idx + min));
            if (result.canCancel) {
                choices.push('Cancel');
            }
            context.game.promptWithHandlerMenu(context.player, {
                activePromptTitle: properties.activePromptTitle
                    ? properties.activePromptTitle
                    : 'Choose how much fate to pay',
                context: context,
                choices: choices,
                choiceHandler: (choice: string) => {
                    if (choice === 'Cancel') {
                        context.costs.variableFateCost = 0;
                        result.cancelled = true;
                    } else {
                        context.costs.variableFateCost = Math.max(0, parseInt(choice));
                    }
                }
            });
        },
        payEvent(context: TriggeredAbilityContext) {
            const payZeroFate = new HandlerAction({});
            if ((context as any).ignoreResourceCost) {
                return payZeroFate.getEvent(context.player, context);
            }

            const costModifiers = context.player.getTotalCostModifiers(PlayTypes.PlayFromHand, context.source);
            const cost = context.costs.variableFateCost + Math.min(0, costModifiers); //+ve cost modifiers are applied by the engine
            if (cost > 0) {
                const action = context.game.actions.loseFate({ amount: cost });
                return action.getEvent(context.player, context);
            }

            return payZeroFate.getEvent(context.player, context);
        }
    };
}

export function discardCardsExactlyVariableX(amountDerivable: Derivable<number, TriggeredAbilityContext>): Cost {
    return {
        promptsPlayer: true,
        canPay(context: TriggeredAbilityContext) {
            return (
                derive(amountDerivable, context) > 0 &&
                context.game.actions.chosenDiscard().canAffect(context.player, context)
            );
        },
        resolve(context: TriggeredAbilityContext, result) {
            const amount = derive(amountDerivable, context);
            context.game.promptForSelect(context.player, {
                activePromptTitle: 'Choose ' + amount + ' card' + (amount === 1 ? '' : 's') + ' to discard',
                context: context,
                mode: TargetModes.Exactly,
                numCards: amount,
                ordered: false,
                location: Locations.Hand,
                controller: Players.Self,
                onSelect: (player, cards) => {
                    if (cards.length === 0) {
                        context.costs.discardCardsExactlyVariableX = [];
                        result.cancelled = true;
                    } else {
                        context.costs.discardCardsExactlyVariableX = cards;
                    }
                    return true;
                },
                onCancel: () => {
                    result.cancelled = true;
                    return true;
                }
            });
        },
        payEvent(context: TriggeredAbilityContext) {
            const action = context.game.actions.discardCard({ target: context.costs.discardCardsExactlyVariableX });
            return action.getEvent(context.costs.discardCardsExactlyVariableX, context);
        }
    };
}

export function discardHand(): Cost {
    return {
        promptsPlayer: true,
        canPay(context: TriggeredAbilityContext) {
            return context.game.actions.chosenDiscard().canAffect(context.player, context);
        },
        resolve(context: TriggeredAbilityContext, result) {
            context.costs.discardHand = context.player.hand.value();
        },
        payEvent(context: TriggeredAbilityContext) {
            const action = context.game.actions.discardCard({ target: context.costs.discardHand });
            return action.getEvent(context.costs.discardHand, context);
        }
    };
}

export function optional(cost: Cost): Cost {
    const getActionName = (context: TriggeredAbilityContext) =>
        `optional${cost.getActionName(context).replace(/^./, (c) => c.toUpperCase())}`;

    return {
        promptsPlayer: true,
        canPay: () => true,
        getCostMessage: (context: TriggeredAbilityContext) =>
            context.costs[getActionName(context)] ? cost.getCostMessage(context) : undefined,
        getActionName: getActionName,
        resolve: (context: TriggeredAbilityContext, result) => {
            if (!cost.canPay(context)) {
                return;
            }
            const actionName = getActionName(context);

            const choices = ['Yes', 'No'];
            const handlers = [
                () => {
                    context.costs[actionName] = true;
                },
                () => {}
            ];

            if (result.canCancel) {
                choices.push('Cancel');
                handlers.push(() => {
                    result.cancelled = true;
                });
            }

            context.game.promptWithHandlerMenu(context.player, {
                activePromptTitle: 'Pay optional cost?',
                source: context.source,
                choices: choices,
                handlers: handlers
            });
        },

        payEvent: (context: TriggeredAbilityContext) => {
            const actionName = getActionName(context);
            if (!context.costs[actionName]) {
                const doNothing = new HandlerAction({});
                return doNothing.getEvent(context.player, context);
            }

            const events = [];
            cost.addEventsToArray(events, context, {});
            return events;
        }
    };
}

export function optionalFateCost(amount: number): Cost {
    return {
        promptsPlayer: true,
        canPay() {
            return true;
        },
        getActionName(context: TriggeredAbilityContext) {
            return 'optionalFateCost';
        },
        getCostMessage: (context: TriggeredAbilityContext) => {
            if (context.costs.optionalFateCost === 0) {
                return undefined;
            }
            return ['paying {1} fate', [amount]];
        },
        resolve(context: TriggeredAbilityContext, result) {
            let fateAvailable = true;
            if (context.player.fate < amount) {
                fateAvailable = false;
            }
            if (!context.player.checkRestrictions('spendFate', context)) {
                fateAvailable = false;
            }
            let choices = [];
            let handlers = [];
            context.costs.optionalFateCost = 0;

            if (fateAvailable) {
                choices = ['Yes', 'No'];
                handlers = [
                    () => (context.costs.optionalFateCost = amount),
                    () => (context.costs.optionalFateCost = 0)
                ];
            }
            if (fateAvailable && result.canCancel) {
                choices.push('Cancel');
                handlers.push(() => {
                    result.cancelled = true;
                });
            }

            if (choices.length > 0) {
                context.game.promptWithHandlerMenu(context.player, {
                    activePromptTitle: 'Spend ' + amount + ' fate?',
                    source: context.source,
                    choices: choices,
                    handlers: handlers
                });
            }
        },
        pay(context: TriggeredAbilityContext) {
            context.player.fate -= context.costs.optionalFateCost;
        }
    };
}

export function nameCard(): Cost {
    return {
        selectCardName(player, cardName, context) {
            context.costs.nameCardCost = cardName;
            return true;
        },
        getActionName(context: TriggeredAbilityContext) {
            return 'nameCard';
        },
        getCostMessage(context: TriggeredAbilityContext) {
            return ['naming {1}', [context.costs.nameCardCost]];
        },
        canPay() {
            return true;
        },
        resolve(context: TriggeredAbilityContext) {
            let dummyObject = {
                selectCardName: (player, cardName, context) => {
                    context.costs.nameCardCost = cardName;
                    return true;
                }
            };

            context.game.promptWithMenu(context.player, dummyObject, {
                context: context,
                activePrompt: {
                    menuTitle: 'Name a card',
                    controls: [
                        { type: 'card-name', command: 'menuButton', method: 'selectCardName', name: 'card-name' }
                    ]
                }
            });
        },
        pay() {}
    };
}

export function switchLocation(): Cost {
    return {
        promptsPlayer: false,
        canPay(context: TriggeredAbilityContext) {
            const canMoveHome = context.game.actions.sendHome().canAffect(context.source, context);
            const canMoveToConflict = context.game.actions.moveToConflict().canAffect(context.source, context);

            return canMoveHome || canMoveToConflict;
        },
        getActionName(context: TriggeredAbilityContext) {
            return 'switchLocation';
        },
        getCostMessage(context: TriggeredAbilityContext) {
            if (!context.source.isParticipating()) {
                return ['moving {1} home', [context.source]];
            }
            return ['moving {1} to the conflict', [context.source]];
        },
        resolve(context: TriggeredAbilityContext, result) {
            context.costs.switchLocation = context.source;
        },
        payEvent(context: TriggeredAbilityContext) {
            const action = context.source.isParticipating()
                ? context.game.actions.sendHome({ target: context.costs.switchLocation })
                : context.game.actions.moveToConflict({ target: context.costs.switchLocation });
            return action.getEvent(context.costs.switchLocation, context);
        }
    };
}