import { EventCard } from '../../../core/card/EventCard';
import { Aspect, CardType, ZoneName } from '../../../core/Constants';
import AbilityHelper from '../../../AbilityHelper';
import { CostAdjustType } from '../../../core/cost/CostAdjuster';

export default class GalacticAmbition extends EventCard {
    protected override getImplementationId () {
        return {
            id: '5494760041',
            internalName: 'galactic-ambition',
        };
    }

    public override setupCardAbilities () {
        this.setEventAbility({
            title: 'Play a non-Heroism unit from your hand for free',
            targetResolver: {
                zoneFilter: ZoneName.Hand,
                cardTypeFilter: CardType.BasicUnit,
                cardCondition: (card) => !card.hasSomeAspect(Aspect.Heroism),
                immediateEffect: AbilityHelper.immediateEffects.playCardFromHand({
                    adjustCost: { costAdjustType: CostAdjustType.Free }
                })
            },
            ifYouDo: (ifYouDoContext) => ({
                title: 'Deal damage to your base equal to the played unit\'s cost',
                immediateEffect: AbilityHelper.immediateEffects.damage({
                    target: ifYouDoContext.source.controller.base,
                    amount: ifYouDoContext.target.printedCost
                })
            })
        });
    }
}
GalacticAmbition.implemented = true;
