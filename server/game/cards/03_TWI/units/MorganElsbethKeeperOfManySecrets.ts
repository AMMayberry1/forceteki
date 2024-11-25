import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class MorganElsbethKeeperOfManySecrets extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '6412545836',
            internalName: 'morgan-elsbeth#keeper-of-many-secrets',
        };
    }

    public override setupCardAbilities() {
        this.addOnAttackAbility({
            title: 'Defeat another friendly unit. If you do, draw a card.',
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Self,
                cardTypeFilter: WildcardCardType.Unit,
                cardCondition: (card, context) => card !== context.source,
                immediateEffect: AbilityHelper.immediateEffects.defeat()
            },
            ifYouDo: {
                title: 'Draw a card',
                immediateEffect: AbilityHelper.immediateEffects.draw()
            }
        });
    }
}

MorganElsbethKeeperOfManySecrets.implemented = true;
