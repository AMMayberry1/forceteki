import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class ZiroTheHuttColorfulSchemer extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '4489623180',
            internalName: 'ziro-the-hutt#colorful-schemer'
        };
    }

    public override setupCardAbilities() {
        this.addWhenPlayedAbility({
            title: 'Exhaust an enemy unit',
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Opponent,
                cardTypeFilter: WildcardCardType.Unit,
                immediateEffect: AbilityHelper.immediateEffects.exhaust()
            }
        });

        this.addOnAttackAbility({
            title: 'Exhaust an enemy resource',
            optional: true,
            immediateEffect: AbilityHelper.immediateEffects.exhaustResources({ amount: 1 }),
        });
    }
}

ZiroTheHuttColorfulSchemer.implemented = true;
