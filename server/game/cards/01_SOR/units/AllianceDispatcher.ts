import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { CardType, ZoneName } from '../../../core/Constants';
import { CostAdjustType } from '../../../core/cost/CostAdjuster';

export default class AllianceDispatcher extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '2756312994',
            internalName: 'alliance-dispatcher',
        };
    }

    public override setupCardAbilities() {
        this.addActionAbility({
            title: 'Play a unit from your hand. It costs 1 less',
            cost: AbilityHelper.costs.exhaustSelf(),
            targetResolver: {
                cardTypeFilter: CardType.BasicUnit,
                zoneFilter: ZoneName.Hand,
                immediateEffect: AbilityHelper.immediateEffects.playCardFromHand({
                    adjustCost: { costAdjustType: CostAdjustType.Decrease, amount: 1 }
                })
            }
        });
    }
}

AllianceDispatcher.implemented = true;
