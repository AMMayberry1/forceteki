import AbilityHelper from '../../../AbilityHelper';
import { AbilityContext } from '../../../core/ability/AbilityContext';
import { EventCard } from '../../../core/card/EventCard';
import { TargetMode, WildcardCardType } from '../../../core/Constants';
import { GameSystem } from '../../../core/gameSystem/GameSystem';
import { IThenAbilityPropsWithSystems } from '../../../Interfaces';
import * as Contract from '../../../core/utils/Contract';

export default class DontGetCocky extends EventCard {
    protected override getImplementationId() {
        return {
            id: '2202839291',
            internalName: 'dont-get-cocky',
        };
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Choose a unit',
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit
            },
            then: (unitChosenContext) => ({
                title: 'Reveal the top card of your deck',
                immediateEffect: AbilityHelper.immediateEffects.reveal((context) => ({ target: context.source.controller.getTopCardOfDeck() })),
                then: this.thenAfterReveal(1, unitChosenContext)
            })
        });
    }

    private thenAfterReveal(cardsRevealedCount: number, contextWithUnitTarget: AbilityContext): IThenAbilityPropsWithSystems<AbilityContext> {
        Contract.assertTrue(cardsRevealedCount > 0 && cardsRevealedCount < 8, `Error in Don\'t Get Cocky implementation: thenAfterReveal called with invalid cardsRevealedCount ${cardsRevealedCount}`);
        if (cardsRevealedCount === 7) {
            return {
                title: 'Deal damage equal to the chosen unit equal to the total cost of cards revealed, if it is 7 or less',
                immediateEffect: this.afterStopRevealingEffect(7, contextWithUnitTarget)
            };
        }
        const then: IThenAbilityPropsWithSystems<AbilityContext> = {
            title: 'Reveal the next card from your deck or stop revealing cards',
            targetResolver: {
                activePromptTitle: `Current total cost: ${this.topXCardsTotalCost(cardsRevealedCount, contextWithUnitTarget)}\nSelect one:`,
                mode: TargetMode.Select,
                choices: {
                    ['Reveal another card']: AbilityHelper.immediateEffects.reveal((context) => ({ target: context.source.controller.getTopCardsOfDeck(7)[cardsRevealedCount] })),
                    ['Stop revealing cards']: this.afterStopRevealingEffect(cardsRevealedCount, contextWithUnitTarget)
                }
            },
            then: this.thenAfterReveal(cardsRevealedCount + 1, contextWithUnitTarget)
        };
        if (cardsRevealedCount > 1) {
            then.thenCondition = (context) => context.select === 'Reveal another card';
        }
        return then;
    }

    private afterStopRevealingEffect(cardsRevealedCount: number, contextWithUnitTarget: AbilityContext): GameSystem<AbilityContext> {
        return AbilityHelper.immediateEffects.simultaneous((context) => {
            const totalCost = this.topXCardsTotalCost(cardsRevealedCount, contextWithUnitTarget);
            return [
                AbilityHelper.immediateEffects.conditional({
                    condition: totalCost <= 7,
                    onTrue: AbilityHelper.immediateEffects.damage({ target: contextWithUnitTarget.target, amount: totalCost }),
                    onFalse: AbilityHelper.immediateEffects.noAction()

                }),
                AbilityHelper.immediateEffects.moveToBottomOfDeck({ target: context.source.controller.getTopCardsOfDeck(cardsRevealedCount) })
            ];
        });
    }

    private topXCardsTotalCost(cardsRevealedCount: number, context: AbilityContext) {
        return context.source.controller.getTopCardsOfDeck(cardsRevealedCount).reduce((total, card) => total + card.printedCost, 0);
    }
}

DontGetCocky.implemented = true;
