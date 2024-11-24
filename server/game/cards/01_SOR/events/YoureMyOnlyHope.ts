import AbilityHelper from '../../../AbilityHelper';
import { EventCard } from '../../../core/card/EventCard';
import { CostAdjustType } from '../../../core/cost/CostAdjuster';

export default class YoureMyOnlyHope extends EventCard {
    protected override getImplementationId() {
        return {
            id: '3509161777',
            internalName: 'youre-my-only-hope',
        };
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Look at the top card of your deck',
            immediateEffect: AbilityHelper.immediateEffects.lookAt((context) => ({
                target: context.source.controller.getTopCardOfDeck()
            })),
            ifYouDo: (ifYouDoContext) => ({
                title: ifYouDoContext.source.controller.base.remainingHp <= 5
                    ? `Play ${ifYouDoContext.source.controller.getTopCardOfDeck().title} for free`
                    : `Play ${ifYouDoContext.source.controller.getTopCardOfDeck().title}, it costs 5 less`,
                optional: true,
                immediateEffect: AbilityHelper.immediateEffects.conditional({
                    condition: (context) => context.source.controller.base.remainingHp <= 5,
                    onTrue: AbilityHelper.immediateEffects.playCardFromOutOfPlay((context) => ({
                        target: context.source.controller.getTopCardOfDeck(),
                        adjustCost: { costAdjustType: CostAdjustType.Free }
                    })),
                    onFalse: AbilityHelper.immediateEffects.playCardFromOutOfPlay((context) => ({
                        target: context.source.controller.getTopCardOfDeck(),
                        adjustCost: { costAdjustType: CostAdjustType.Decrease, amount: 5 }
                    }))
                })
            })
        });
    }
}

YoureMyOnlyHope.implemented = true;