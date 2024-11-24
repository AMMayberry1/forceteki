import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, WildcardCardType, WildcardZoneName } from '../../../core/Constants';

export default class FreetownBackup extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '4534554684',
            internalName: 'freetown-backup'
        };
    }

    public override setupCardAbilities() {
        this.addOnAttackAbility({
            title: 'Give another friendly unit +2/+2',
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                zoneFilter: WildcardZoneName.AnyArena,
                controller: RelativePlayer.Self,
                cardCondition: (card, context) => card !== context.source,
                immediateEffect: AbilityHelper.immediateEffects.forThisPhaseCardEffect({
                    effect: AbilityHelper.ongoingEffects.modifyStats({ power: 2, hp: 2 })
                })
            }
        });
    }
}

FreetownBackup.implemented = true;
