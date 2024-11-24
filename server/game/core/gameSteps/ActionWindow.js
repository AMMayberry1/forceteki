const { UiPrompt } = require('./prompts/UiPrompt.js');
const { RelativePlayer, WildcardZoneName } = require('../Constants.js');
const EnumHelpers = require('../utils/EnumHelpers.js');
const Contract = require('../utils/Contract');

class ActionWindow extends UiPrompt {
    constructor(game, title, windowName, prevPlayerPassed, setPassStatus, activePlayer = null) {
        super(game);

        this.title = title;
        this.windowName = windowName;
        this.activePlayer = activePlayer ?? this.game.actionPhaseActivePlayer;
        this.activePlayerConsecutiveActions = 0;
        this.opportunityCounter = 0;

        // whether the previous player passed their action
        this.prevPlayerPassed = prevPlayerPassed;

        // used to inform the owning ActionPhase of whether this window was passed or not
        this.setPassStatus = setPassStatus;
    }

    /** @override */
    activeCondition(player) {
        return player === this.activePlayer;
    }

    /** @override */
    onCardClicked(player, card) {
        if (player !== this.activePlayer) {
            return false;
        }

        let legalActions = this.getCardLegalActions(card, this.activePlayer);
        if (legalActions.length === 0) {
            return false;
        }

        if (legalActions.length === 1) {
            let action = legalActions[0];
            let targetPrompts = action.targetResolvers.some((targetResolver) => targetResolver.properties.choosingPlayer !== RelativePlayer.Opponent);
            if (!this.activePlayer.optionSettings.confirmOneClick || action.cost.some((cost) => cost.promptsPlayer) || targetPrompts) {
                this.resolveAbility(action.createContext(player));
                return true;
            }
        }
        this.game.promptWithHandlerMenu(player, {
            activePromptTitle: (EnumHelpers.isArena(card.zoneName) ? 'Choose an ability:' : 'Play ' + card.name + ':'),
            source: card,
            choices: legalActions.map((action) => action.title).concat('Cancel'),
            handlers: legalActions.map((action) => (() => this.resolveAbility(action.createContext(player)))).concat(() => true)
        });
        return true;
    }

    resolveAbility(context) {
        const resolver = this.game.resolveAbility(context);
        this.game.queueSimpleStep(() => {
            if (resolver.resolutionComplete) {
                this.postResolutionUpdate(resolver);
            }
        }, `Check and pass priority for ${resolver.context.ability}`);
    }

    postResolutionUpdate(resolver) {
        this.setPassStatus(false);

        // if (this.activePlayerConsecutiveActions > 1) {
        //     this.markBonusActionsTaken();
        // }

        this.complete();
    }

    // TODO: confirm that this works correctly
    /** @override */
    continue() {
        // TODO: do we need promptedActionWindows?
        if (!this.activePlayer.promptedActionWindows[this.windowName]) {
            this.pass();
        }

        let completed = super.continue();

        if (!completed) {
            this.highlightSelectableCards();
            this.game.currentActionWindow = this;
        } else {
            this.game.currentActionWindow = null;
        }
        return completed;
    }

    /** @override */
    activePrompt() {
        let buttons = [
            { text: 'Pass', arg: 'pass' }
        ];
        if (!this.game.isInitiativeClaimed) {
            buttons.push({ text: 'Claim Initiative', arg: 'claimInitiative' });
        }
        if (this.game.manualMode) {
            buttons.unshift({ text: 'Manual Action', arg: 'manual' });
        }
        return {
            menuTitle: 'Choose an action',
            buttons: buttons,
            promptTitle: this.title,
            promptUuid: this.uuid
        };
    }

    /** @override */
    waitingPrompt() {
        return { menuTitle: 'Waiting for opponent to take an action or pass' };
    }

    /** @override */
    menuCommand(player, choice) {
        switch (choice) {
            case 'manual':
                this.game.promptForSelect(this.activePlayer, {
                    source: 'Manual Action',
                    activePrompt: 'Which ability are you using?',
                    zone: WildcardZoneName.Any,
                    controller: RelativePlayer.Self,
                    cardCondition: (card) => card.isFaceup() || card.canBeSmuggled(),
                    onSelect: (player, card) => {
                        this.game.addMessage('{0} uses {1}\'s ability', player, card);
                        this.setPassStatus(false);
                        return true;
                    }
                });
                return true;

            case 'pass':
                this.pass();
                return true;

            case 'claimInitiative':
                this.claimInitiative();
                return true;

            default:
                Contract.fail(`Unknown menu command: ${choice}`);
        }
    }

    pass(showMessage = true) {
        if (showMessage) {
            this.game.addMessage('{0} passes', this.activePlayer);
        }

        if (this.prevPlayerPassed) {
            // in the (unusual) case that both players pass without claiming initiative, phase ends and initiative stays where it is
            this.activePlayer.passedActionPhase = true;
            this.activePlayer.opponent.passedActionPhase = true;
        } else if (this.activePlayer.opponent.passedActionPhase) {
            // if opponent already claimed initiative, we're done
            this.activePlayer.passedActionPhase = true;
        } else {
            this.setPassStatus(true);
        }

        this.complete();

        // if (!this.activePlayer.opponent) {
        //     this.attemptComplete();
        //     return;
        // }

        // // TODO: is this right? need to investigate for e.g. Leia hero ability
        // if (this.activePlayerConsecutiveActions > 1) {
        //     this.markBonusActionsTaken();
        // }
    }

    claimInitiative() {
        this.game.addMessage('{0} claims initiative and passes', this.activePlayer);
        this.game.claimInitiative(this.activePlayer);

        // Calls this.complete()
        this.pass(false);
    }

    /** @override */
    complete() {
        // this.teardownBonusActions();
        super.complete();
    }

    highlightSelectableCards() {
        const allPossibleCards = this.game.findAnyCardsInPlay().concat(
            this.activePlayer.discardZone.cards,
            this.activePlayer.resourceZone.cards,
            this.activePlayer.handZone.cards
        );
        this.activePlayer.setSelectableCards(allPossibleCards.filter((card) => this.getCardLegalActions(card, this.activePlayer).length > 0));
    }

    // IMPORTANT: the below code is referenced in the debugging guide (docs/debugging-guide.md). If you make changes here, make sure to update that document as well.
    getCardLegalActions(card, player) {
        let actions = card.getActions();
        const legalActions = actions.filter((action) => action.meetsRequirements(action.createContext(player)) === '');
        return legalActions;
    }

    // markBonusActionsTaken() {
    //     if (this.bonusActions) {
    //         this.bonusActions[this.activePlayer.uuid].actionsTaken = true;
    //     }
    // }

    // attemptComplete() {
    //     if (!this.activePlayer.opponent) {
    //         this.complete();
    //     }

    //     if (!this.checkBonusActions()) {
    //         this.complete();
    //     }
    // }

    // TODO: this "bonus actions" code from L5R is for a case where a card lets a user take extra actions out of sequence.
    // Leaving it here in case we ever have something similar

    // checkBonusActions() {
    //     if (!this.bonusActions) {
    //         if (!this.setupBonusActions()) {
    //             return false;
    //         }
    //     }

    //     const player1 = this.game.initiativePlayer();
    //     const player2 = player1.opponent;

    //     const p1 = this.bonusActions[player1.uuid];
    //     const p2 = this.bonusActions[player2.uuid];

    //     if (p1.actionCount > 0) {
    //         if (!p1.actionsTaken) {
    //             this.game.addMessage('{0} has a bonus action during resolution!', player1);
    //             this.prevPlayerPassed = false;
    //             // Set the current player to player1
    //             if (this.activePlayer !== player1) {
    //                 this.activePlayer = player1;
    //             }
    //             return true;
    //         }
    //     }
    //     if (p2.actionCount > 0) {
    //         if (!p2.actionsTaken) {
    //             this.game.addMessage('{0} has a bonus action during resolution!', player2);
    //             this.prevPlayerPassed = false;
    //             // Set the current player to player2
    //             if (this.activePlayer !== player2) {
    //                 this.activePlayer = player2;
    //             }
    //             return true;
    //         }
    //     }

    //     return false;
    // }

    // setupBonusActions() {
    //     const player1 = this.game.initiativePlayer;
    //     const player2 = player1.opponent;
    //     let p1ActionsPostWindow = player1.sumEffects(EffectName.AdditionalActionAfterWindowCompleted);
    //     let p2ActionsPostWindow = player2.sumEffects(EffectName.AdditionalActionAfterWindowCompleted);

    //     this.bonusActions = {
    //         [player1.uuid]: {
    //             actionCount: p1ActionsPostWindow,
    //             actionsTaken: false
    //         },
    //         [player2.uuid]: {
    //             actionCount: p2ActionsPostWindow,
    //             actionsTaken: false
    //         },
    //     };

    //     return p1ActionsPostWindow + p2ActionsPostWindow > 0;
    // }

    // teardownBonusActions() {
    //     this.bonusActions = undefined;
    // }
}

module.exports = ActionWindow;
