import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { WildcardCardType } from '../../../core/Constants';

export default class OuterRimHeadhunter extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '3613174521',
            internalName: 'outer-rim-headhunter'
        };
    }

    public override setupCardAbilities() {
        this.addOnAttackAbility({
            title: 'Exhaust a non-leader unit if you control a leader unit',
            optional: true,
            targetResolver: {
                cardTypeFilter: WildcardCardType.NonLeaderUnit,
                immediateEffect: AbilityHelper.immediateEffects.conditional({
                    condition: (context) => context.source.controller.leader.deployed,
                    onTrue: AbilityHelper.immediateEffects.exhaust(),
                    onFalse: AbilityHelper.immediateEffects.noAction()
                })
            }
        });
    }
}

OuterRimHeadhunter.implemented = true;
